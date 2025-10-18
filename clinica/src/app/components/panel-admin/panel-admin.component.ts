import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { EmpleadosService, Empleado } from '../../services/empleados.service';
import { PacientesService, Paciente } from '../../services/pacientes.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-panel-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatProgressSpinnerModule],
  templateUrl: './panel-admin.component.html',
  styleUrls: ['./panel-admin.component.scss']
})
export class PanelAdminComponent implements OnInit {

  empleados: Empleado[] = [];
  administradores: Empleado[] = [];
  pacientes: Paciente[] = [];
  fb = new FormBuilder();
  loading = false;

  // Validador personalizado para evitar especialidad "administrador"
  private noAdministradorValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value?.toLowerCase();
    if (value === 'administrador') {
      return { noAdministrador: true };
    }
    return null;
  }

  // Validador para DNI (máximo 8 dígitos)
  private dniValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (value && (value.toString().length > 8 || value <= 0)) {
      return { dniInvalido: true };
    }
    return null;
  }

  // Validador asíncrono para email único
  private async emailUnicoValidator(email: string): Promise<boolean> {
    try {
      const duplicadosEmpleados = await this.empleadosService.validarDuplicados(email);
      const duplicadosPacientes = await this.pacientesService.validarDuplicados(email, 0, undefined);
      return !duplicadosEmpleados.email && !duplicadosPacientes.email;
    } catch (error) {
      console.error('Error validando email:', error);
      return false;
    }
  }

  // Validador asíncrono para contraseña única
  private async contraseñaUnicaValidator(contraseña: string): Promise<boolean> {
    try {
      const duplicadosEmpleados = await this.empleadosService.validarDuplicados(undefined, undefined, contraseña);
      const duplicadosPacientes = await this.pacientesService.validarDuplicados(undefined, 0, contraseña);
      return !duplicadosEmpleados.contraseña && !duplicadosPacientes.contraseña;
    } catch (error) {
      console.error('Error validando contraseña:', error);
      return false;
    }
  }

  // Validador asíncrono para DNI único
  private async dniUnicoValidator(dni: number): Promise<boolean> {
    try {
      const duplicadosEmpleados = await this.empleadosService.validarDuplicados(undefined, dni);
      const duplicadosPacientes = await this.pacientesService.validarDuplicados(undefined, dni, undefined);
      return !duplicadosEmpleados.dni && !duplicadosPacientes.dni;
    } catch (error) {
      console.error('Error validando DNI:', error);
      return false;
    }
  }

  // Formulario Administrador
  nuevoAdminForm = this.fb.group({
    nombre: ['', Validators.required],
    apellido: ['', Validators.required],
    edad: [null, [Validators.required, Validators.min(18), Validators.max(120)]],
    dni: [null, [Validators.required, this.dniValidator.bind(this)]],
    email: ['', [Validators.required, Validators.email]],
    contraseña: ['', [Validators.required, Validators.minLength(6)]],
    imagenPerfil: [null as File | null, Validators.required]
  });

  // Toggle entre crear empleado o paciente
  crearTipo: 'empleado' | 'paciente' | 'admin' = 'empleado';
  imagenPreview: string | null = null;

  private async mostrarSpinner(ms: number = 3000): Promise<void> {
    this.loading = true;
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        this.loading = false;
        resolve();
      }, ms);
    });
  }

  async toggleAprobado(empleado: Empleado) {
    await this.mostrarSpinner();
    try {
      // Cambia el estado aprobado
      empleado.aprobado = !empleado.aprobado;

      // Llama al servicio para actualizar en la base de datos
      await this.empleadosService.actualizarEmpleado(empleado);

      // Recarga la lista para reflejar cambios
      this.cargarEmpleados();
    } catch (error) {
      console.error(error);
      this.toastService.error('❌ Error al actualizar el estado del empleado');
    }
  }


  // Formulario Empleado
  nuevoEmpleadoForm = this.fb.group({
    nombre: ['', Validators.required],
    apellido: [''],
    edad: [null, [Validators.min(18), Validators.max(120)]],
    dni: [null, [Validators.required, this.dniValidator.bind(this)]],
    especialidad: ['', [Validators.required, this.noAdministradorValidator.bind(this)]],
    email: ['', [Validators.required, Validators.email]],
    contraseña: ['', [Validators.required, Validators.minLength(6)]],
    imagenPerfil: [null as File | null, Validators.required]
  });

  // Formulario Paciente
  nuevoPacienteForm = this.fb.group({
    nombre: ['', Validators.required],
    apellido: [''],
    dni: [null, [Validators.required, this.dniValidator.bind(this)]],
    obraSocial: [''],
    email: ['', [Validators.required, Validators.email]],
    contraseña: ['', [Validators.required, Validators.minLength(6)]],
    foto1: [null as File | null, Validators.required],
    foto2: [null as File | null, Validators.required]
  });

  constructor(
    private empleadosService: EmpleadosService,
    private pacientesService: PacientesService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.cargarEmpleados();
    this.cargarAdministradores();
    this.cargarPacientes();
  }

  async cargarEmpleados() {
    this.empleados = await this.empleadosService.obtenerTodos();
    // Filtrar solo empleados (excluir administradores)
    this.empleados = this.empleados.filter(emp => emp.especialidad !== 'administrador');
  }

  async cargarAdministradores() {
    const todosEmpleados = await this.empleadosService.obtenerTodos();
    // Filtrar solo administradores
    this.administradores = todosEmpleados.filter(emp => emp.especialidad === 'administrador');
  }

  async cargarPacientes() {
    this.pacientes = await this.pacientesService.obtenerTodos();
  }

  subirImagenEmpleado(event: Event, tipo: 'administrador' | 'empleado' = 'empleado') {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];
      const form = tipo === 'administrador' ? this.nuevoAdminForm : this.nuevoEmpleadoForm;
      form.patchValue({ imagenPerfil: file });
      const reader = new FileReader();
      reader.onload = () => this.imagenPreview = reader.result as string;
      reader.readAsDataURL(file);
    }
  }

  subirImagenPaciente(event: Event, foto: 'foto1' | 'foto2') {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];
      this.nuevoPacienteForm.patchValue({ [foto]: file });
    }
  }

  async crearAdmin() {
    if (this.nuevoAdminForm.invalid) {
      this.toastService.warning('⚠️ Completa todos los campos del administrador');
      return;
    }
    
    const form = this.nuevoAdminForm.value;
    
    // Validaciones asíncronas de duplicados
    const emailUnico = await this.emailUnicoValidator(form.email!);
    const contraseñaUnica = await this.contraseñaUnicaValidator(form.contraseña!);
    const dniUnico = await this.dniUnicoValidator(form.dni!);
    
    if (!emailUnico) {
      this.toastService.emailDuplicado();
      return;
    }
    
    if (!contraseñaUnica) {
      this.toastService.passwordDuplicado();
      return;
    }
    
    if (!dniUnico) {
      this.toastService.dniDuplicado();
      return;
    }
    
    if (!form.imagenPerfil) {
      this.toastService.error('❌ Debe seleccionar una imagen de perfil.');
      return;
    }
    
    await this.mostrarSpinner();
    try {
      let fotoUrl = '';
      if (form.imagenPerfil) {
        fotoUrl = await this.empleadosService.subirImagen(form.imagenPerfil, `admin-${Date.now()}`);
      }

      // Aquí llamás tu servicio para crear Admin
      const adminCreado = await this.empleadosService.crearAdmin({ ...form, imagenPerfil: fotoUrl });
      this.toastService.cuentaCreada('administrador', `${form.nombre} ${form.apellido}`);
      this.nuevoAdminForm.reset();
      this.imagenPreview = null;
      this.cargarAdministradores(); // Recargar lista de administradores
    } catch (error) {
      console.error(error);
      this.toastService.error('❌ Error al crear el administrador. Intente nuevamente.');
    }
  }

  async crearEmpleado() {
    if (this.nuevoEmpleadoForm.invalid) {
      this.toastService.warning('⚠️ Completa todos los campos del empleado');
      return;
    }
    
    const form = this.nuevoEmpleadoForm.value;
    
    // Validación adicional para evitar especialidad "administrador"
    const especialidad = form.especialidad?.toLowerCase();
    if (especialidad === 'administrador') {
      this.toastService.especialidadAdministrador();
      return;
    }
    
    // Validaciones asíncronas de duplicados
    const emailUnico = await this.emailUnicoValidator(form.email!);
    const contraseñaUnica = await this.contraseñaUnicaValidator(form.contraseña!);
    const dniUnico = await this.dniUnicoValidator(form.dni!);
    
    if (!emailUnico) {
      this.toastService.emailDuplicado();
      return;
    }
    
    if (!contraseñaUnica) {
      this.toastService.passwordDuplicado();
      return;
    }
    
    if (!dniUnico) {
      this.toastService.dniDuplicado();
      return;
    }
    
    if (!form.imagenPerfil) {
      this.toastService.error('❌ Debe seleccionar una imagen de perfil.');
      return;
    }
    
    await this.mostrarSpinner();
    try {
      let fotoUrl = '';
      if (form.imagenPerfil) {
        fotoUrl = await this.empleadosService.subirImagen(form.imagenPerfil, `perfil-${Date.now()}`);
      }

      const empleadoCreado = await this.empleadosService.crearEmpleado({ ...form, imagenPerfil: fotoUrl });
      this.toastService.cuentaCreada('especialista', `${form.nombre} ${form.apellido}`);
      this.nuevoEmpleadoForm.reset();
      this.imagenPreview = null;
      this.cargarEmpleados();
    } catch (error) {
      console.error(error);
      this.toastService.error('❌ Error al crear el empleado. Intente nuevamente.');
    }
  }

  async crearPaciente() {
    if (this.nuevoPacienteForm.invalid) {
      this.toastService.warning('⚠️ Completa todos los campos del paciente');
      return;
    }
    
    const form = this.nuevoPacienteForm.value;
    
    // Validaciones asíncronas de duplicados
    const emailUnico = await this.emailUnicoValidator(form.email!);
    const contraseñaUnica = await this.contraseñaUnicaValidator(form.contraseña!);
    const dniUnico = await this.dniUnicoValidator(form.dni!);
    
    if (!emailUnico) {
      this.toastService.emailDuplicado();
      return;
    }
    
    if (!contraseñaUnica) {
      this.toastService.passwordDuplicado();
      return;
    }
    
    if (!dniUnico) {
      this.toastService.dniDuplicado();
      return;
    }
    
    if (!form.foto1 || !form.foto2) {
      this.toastService.error('❌ Debe seleccionar ambas fotos del paciente.');
      return;
    }
    
    await this.mostrarSpinner();
    try {
      let foto1Url = '', foto2Url = '';

      if (form.foto1) {
        foto1Url = await this.pacientesService.subirImagen(form.foto1, `foto1-${Date.now()}`);
      }
      if (form.foto2) {
        foto2Url = await this.pacientesService.subirImagen(form.foto2, `foto2-${Date.now()}`);
      }

      const pacienteCreado = await this.pacientesService.crearPaciente({ 
        nombre: form.nombre!,   // ! asegura que no es null/undefined
        apellido: form.apellido || '',
        dni: form.dni || 0,
        obraSocial: form.obraSocial || '',
        email: form.email || '',
        contraseña: form.contraseña || '',
        foto1: foto1Url,
        foto2: foto2Url
      });
      this.toastService.cuentaCreada('paciente', `${form.nombre} ${form.apellido}`);
      this.nuevoPacienteForm.reset();
      this.cargarPacientes();
    } catch (error) {
      console.error(error);
      this.toastService.error('❌ Error al crear el paciente. Intente nuevamente.');
    }
  }

}

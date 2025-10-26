import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { EmpleadosService } from '../../services/empleados.service';
import { PacientesService } from '../../services/pacientes.service';
import { ToastService } from '../../services/toast.service';
import { Empleado } from '../../services/empleados.service';
import { Paciente } from '../../services/pacientes.service';

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './mi-perfil.component.html',
  styleUrls: ['./mi-perfil.component.scss']
})
export class MiPerfilComponent implements OnInit {
  private empleadosService = inject(EmpleadosService);
  private pacientesService = inject(PacientesService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  userType: 'admin' | 'especialista' | 'paciente' | null = null;
  currentUser: Empleado | Paciente | null = null;
  isLoading = true;
  isEditing = false;
  isSaving = false;

  // Formulario de datos personales
  datosPersonalesForm: FormGroup;

  // Preview de imágenes
  imagen1Preview: string | null = null;
  imagen2Preview: string | null = null;

  constructor() {
    this.datosPersonalesForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      edad: ['', [Validators.min(1), Validators.max(120)]],
      dni: ['', [Validators.min(1000000), Validators.max(99999999)]],
      email: ['', [Validators.required, Validators.email]],
      especialidad: [''], // Solo para empleados
      obraSocial: [''], // Solo para pacientes
      imagenPerfil: [''], // Para empleados
      foto1: [''], // Para pacientes
      foto2: [''] // Para pacientes
    });
  }

  async ngOnInit() {
    try {
      await this.detectUserType();
      if (this.currentUser) {
        this.loadUserDataToForm();
      }
    } catch (error) {
      console.error('Error al cargar perfil:', error);
      this.toastService.error('Error al cargar el perfil');
      this.router.navigate(['/welcome']);
    }
  }

  private async detectUserType() {
    this.isLoading = true;

    try {
      // Intentar obtener usuario actual desde empleados
      const empleado = this.empleadosService.usuarioActual;
      if (empleado) {
        this.currentUser = empleado;
        this.userType = empleado.especialidad?.toLowerCase() === 'administrador' ? 'admin' : 'especialista';
        this.isLoading = false;
        return;
      }

      // Si no es empleado, intentar desde pacientes
      const paciente = this.pacientesService.usuarioActual;
      if (paciente) {
        this.currentUser = paciente;
        this.userType = 'paciente';
        this.isLoading = false;
        return;
      }

      // Si no encontró usuario, redirigir al login
      this.toastService.warning('Debes iniciar sesión para acceder a tu perfil');
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error detectando tipo de usuario:', error);
      this.toastService.error('Error al cargar información del usuario');
      this.router.navigate(['/welcome']);
    } finally {
      this.isLoading = false;
    }
  }

  getUserDisplayName(): string {
    if (!this.currentUser) return '';
    
    if ('nombre' in this.currentUser && 'apellido' in this.currentUser) {
      return `${this.currentUser.nombre} ${this.currentUser.apellido}`;
    }
    
    return this.currentUser.email || 'Usuario';
  }

  getUserTypeLabel(): string {
    switch (this.userType) {
      case 'admin': return 'Administrador';
      case 'especialista': return 'Especialista';
      case 'paciente': return 'Paciente';
      default: return '';
    }
  }

  volver() {
    this.router.navigate(['/welcome']);
  }

  // ========== MÉTODOS PARA DATOS PERSONALES ==========

  loadUserDataToForm() {
    if (!this.currentUser) return;

    // Cargar datos básicos comunes
    this.datosPersonalesForm.patchValue({
      nombre: this.currentUser.nombre || '',
      apellido: this.currentUser.apellido || '',
      email: this.currentUser.email || ''
    });

    // Cargar datos específicos según tipo de usuario
    if (this.userType === 'admin' || this.userType === 'especialista') {
      const empleado = this.currentUser as Empleado;
      this.datosPersonalesForm.patchValue({
        edad: empleado.edad || '',
        dni: empleado.dni || '',
        especialidad: empleado.especialidad || ''
      });

      // Cargar imagen de empleado
      if (empleado.imagenPerfil) {
        this.imagen1Preview = empleado.imagenPerfil;
      }
    } else if (this.userType === 'paciente') {
      const paciente = this.currentUser as Paciente;
      this.datosPersonalesForm.patchValue({
        dni: paciente.dni || '',
        obraSocial: paciente.obraSocial || ''
      });

      // Cargar imágenes de paciente
      if (paciente.foto1) {
        this.imagen1Preview = paciente.foto1;
      }
      if (paciente.foto2) {
        this.imagen2Preview = paciente.foto2;
      }
    }
  }

  toggleEditing() {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      // Si cancela la edición, recargar datos originales
      this.loadUserDataToForm();
    }
  }

  async guardarCambios() {
    if (this.datosPersonalesForm.invalid) {
      this.toastService.warning('Por favor completa todos los campos requeridos');
      return;
    }

    this.isSaving = true;

    try {
      const formData = this.datosPersonalesForm.value;

      if (this.userType === 'admin' || this.userType === 'especialista') {
        await this.guardarEmpleado(formData);
      } else if (this.userType === 'paciente') {
        await this.guardarPaciente(formData);
      }

      this.toastService.success('Datos actualizados correctamente');
      this.isEditing = false;
    } catch (error) {
      console.error('Error al guardar datos:', error);
      this.toastService.error('Error al guardar los cambios');
    } finally {
      this.isSaving = false;
    }
  }

  private async guardarEmpleado(formData: any) {
    if (!this.currentUser?.id) return;

    const empleadoActualizado: Partial<Empleado> = {
      nombre: formData.nombre,
      apellido: formData.apellido,
      edad: formData.edad ? parseInt(formData.edad) : null,
      dni: formData.dni ? parseInt(formData.dni) : null,
      email: formData.email,
      especialidad: formData.especialidad
    };

    await this.empleadosService.actualizarEmpleado({ 
      ...this.currentUser, 
      ...empleadoActualizado 
    } as Empleado);
    
    // Actualizar usuario actual
    Object.assign(this.currentUser, empleadoActualizado);
  }

  private async guardarPaciente(formData: any) {
    if (!this.currentUser?.id) return;

    const pacienteActualizado: Partial<Paciente> = {
      nombre: formData.nombre,
      apellido: formData.apellido,
      dni: formData.dni ? parseInt(formData.dni) : undefined,
      email: formData.email,
      obraSocial: formData.obraSocial
    };

    await this.pacientesService.actualizarPaciente({ 
      ...this.currentUser, 
      ...pacienteActualizado 
    } as Paciente);
    
    // Actualizar usuario actual
    Object.assign(this.currentUser, pacienteActualizado);
  }

  onImageSelected(event: any, imageNumber: 1 | 2) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        if (imageNumber === 1) {
          this.imagen1Preview = imageData;
        } else {
          this.imagen2Preview = imageData;
        }
      };
      reader.readAsDataURL(file);
    }
  }

  isEmpleado(): boolean {
    return this.userType === 'admin' || this.userType === 'especialista';
  }

  isPaciente(): boolean {
    return this.userType === 'paciente';
  }

  // Getters para validaciones del formulario
  get f() {
    return this.datosPersonalesForm.controls;
  }
}
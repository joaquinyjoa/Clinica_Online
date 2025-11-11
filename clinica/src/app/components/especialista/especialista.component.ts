import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { EmpleadosService, Empleado } from '../../services/empleados.service';
import { HistoriaClinicaService, HistoriaClinicaCompleta } from '../../services/historia-clinica.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-especialista',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './especialista.component.html',
  styleUrls: ['./especialista.component.scss']
})
export class EspecialistaComponent {

  // Indicador global de carga para este componente (por ejemplo, cuando se envía el formulario)
  loading = false;

  // Navegación de secciones
  seccionActiva: 'registro' | 'pacientes' = 'registro';

  // Datos para sección Pacientes
  historiaSeleccionada: HistoriaClinicaCompleta[] = [];
  mostrandoHistoria = false;
  loadingPacientes = false;
  loadingHistoria = false;

  fb = new FormBuilder();
  especialidadesDisponibles = ['Cardiología', 'Dermatología', 'Odontología'];
  mostrarInputNueva = false; // Solo para mostrar/ocultar el input
  imagenPreview: string | null = null;

  // Key para localStorage
  private readonly ESPECIALIDADES_KEY = 'especialidades_disponibles';

  especialistaForm = this.fb.group({
    nombre: ['', Validators.required],
    apellido: ['', Validators.required],
    edad: ['', [Validators.required, Validators.min(18), Validators.max(120)]],
    dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
    especialidad: ['', Validators.required],
    nuevaEspecialidad: [''], // Campo separado para nueva especialidad
    email: ['', [Validators.required, Validators.email]],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(10),
        Validators.pattern(/^(?=.*[A-Z])(?=.*\d).+$/)
      ]
    ],
    imagenPerfil: [null as File | null, Validators.required]
  });

  constructor(
    private empleadoService: EmpleadosService,
    private historiaClinicaService: HistoriaClinicaService,
    private toastService: ToastService
  ) {
    this.cargarEspecialidades();
  }

  // Cargar especialidades desde localStorage
  private cargarEspecialidades() {
    const especialidadesGuardadas = localStorage.getItem(this.ESPECIALIDADES_KEY);
    if (especialidadesGuardadas) {
      this.especialidadesDisponibles = JSON.parse(especialidadesGuardadas);
    }
  }

  // Guardar nueva especialidad en localStorage
  private guardarEspecialidad(nuevaEspecialidad: string) {
    const especialidadTrimmed = nuevaEspecialidad.trim();
    
    // Verificar que no exista ya (case insensitive)
    const existe = this.especialidadesDisponibles.some(
      esp => esp.toLowerCase() === especialidadTrimmed.toLowerCase()
    );
    
    if (!existe && especialidadTrimmed !== '') {
      this.especialidadesDisponibles.push(especialidadTrimmed);
      // Ordenar alfabéticamente
      this.especialidadesDisponibles.sort();
      // Guardar en localStorage
      localStorage.setItem(this.ESPECIALIDADES_KEY, JSON.stringify(this.especialidadesDisponibles));
      console.log(`✅ Nueva especialidad agregada: ${especialidadTrimmed}`);
      return true;
    }
    return false;
  }

  get f() { return this.especialistaForm.controls; }

  // Método público para validar desde el componente padre
  validarFormulario(): boolean {
    // Determinar qué especialidad usar
    const especialidadSeleccionada = this.especialistaForm.value.especialidad;
    const nuevaEspecialidad = this.especialistaForm.value.nuevaEspecialidad;
    
    if (especialidadSeleccionada === 'agregar') {
      if (!nuevaEspecialidad || !nuevaEspecialidad.trim()) {
        this.toastService.error('⚠️ Debes escribir la nueva especialidad.');
        return false;
      }
      // Usar la nueva especialidad
      this.especialistaForm.patchValue({ especialidad: nuevaEspecialidad.trim() });
    }

    if (this.especialistaForm.invalid) {
      this.especialistaForm.markAllAsTouched();
      return false;
    }
    
    return true;
  }

  // Cambiar especialidad
  onEspecialidadChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.mostrarInputNueva = select.value === 'agregar';
    if (!this.mostrarInputNueva) {
      this.especialistaForm.patchValue({ nuevaEspecialidad: '' });
      // Remover validación requerida
      this.especialistaForm.get('nuevaEspecialidad')?.clearValidators();
    } else {
      // Agregar validación requerida
      this.especialistaForm.get('nuevaEspecialidad')?.setValidators([Validators.required]);
    }
    this.especialistaForm.get('nuevaEspecialidad')?.updateValueAndValidity();
  }

  subirImagen(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      const file = input.files[0];
      this.especialistaForm.patchValue({ imagenPerfil: file });
      const reader = new FileReader();
      reader.onload = () => this.imagenPreview = reader.result as string;
      reader.readAsDataURL(file);
    }
  }

 async onSubmit() {
   this.loading = true;
   try {
     const id = await this.crearEspecialista();
     if (id === 0) return; // ❌ Detener la ejecución si hubo error

     // ✅ Si id es válido, continuar con la lógica, por ejemplo:
     alert('Especialista creado correctamente, ID: ' + id);
     // aquí podrías navegar al login solo si id != 0
   } catch (error) {
     console.error(error);
   } finally {
      this.loading = false;
    }
  }

  obtenerCamposDinamicos(historia: HistoriaClinicaCompleta): { clave: string, valor: string }[] {
    const campos: { clave: string, valor: string }[] = [];
    
    if (historia.campo_dinamico_1_clave && historia.campo_dinamico_1_valor) {
      campos.push({ clave: historia.campo_dinamico_1_clave, valor: historia.campo_dinamico_1_valor });
    }
    if (historia.campo_dinamico_2_clave && historia.campo_dinamico_2_valor) {
      campos.push({ clave: historia.campo_dinamico_2_clave, valor: historia.campo_dinamico_2_valor });
    }
    if (historia.campo_dinamico_3_clave && historia.campo_dinamico_3_valor) {
      campos.push({ clave: historia.campo_dinamico_3_clave, valor: historia.campo_dinamico_3_valor });
    }
    
    return campos;
  }

  formatearFecha(fecha: string): string {
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return fecha;
    }
  }  async crearEspecialista(): Promise<number> {

    // Validación edad
    const edad = Number(this.especialistaForm.value.edad);
    if (edad < 18) {
      alert('⚠️ La edad debe ser mayor o igual a 18 años.');
      return 0;
    }

    // Validación email/DNI duplicados
    const email = this.especialistaForm.value.email;
    const dni = Number(this.especialistaForm.value.dni);
    const contraseña = this.especialistaForm.value.password;
    const duplicados = await this.empleadoService.validarDuplicados(email, dni, contraseña);

      if (duplicados.dni) {
          this.toastService.dniDuplicado();
          this.loading = false;
          return 0;
        }

      if (duplicados.email) {
        this.toastService.emailDuplicado();
        this.loading = false;
        return 0;
      }
      
      if (duplicados.contraseña) {
        this.toastService.passwordDuplicado();
        this.loading = false;
        return 0;
      }

    // Validación: no permitir registro como administrador
    const especialidadFinal = this.especialistaForm.value.especialidad?.toLowerCase();
    
    if (especialidadFinal === 'administrador' || especialidadFinal === 'admin') {
      this.toastService.especialidadAdministrador();
      this.loading = false;
      return 0;
    }

    if (this.especialistaForm.invalid) {
      this.especialistaForm.markAllAsTouched();
      alert('⚠️ Por favor, completá todos los campos correctamente.');
      return 0;
    }

    const formValues = this.especialistaForm.value;
    const imagenFile = formValues.imagenPerfil as File;
    let fotoUrl = '';
    if (imagenFile) {
      // Eliminamos caracteres problemáticos del nombre del archivo
      const nombreArchivo = `perfil-${Date.now()}-${imagenFile.name.replace(/\s/g, '_')}`;
      fotoUrl = await this.empleadoService.subirImagen(imagenFile, nombreArchivo);
    }

    const nuevoEspecialista: Empleado = {
    nombre: formValues.nombre || '',        // nunca será undefined
    apellido: formValues.apellido || null,  // opcional
    edad: Number(formValues.edad) || null,
    dni: Number(formValues.dni) || null,
    especialidad: formValues.especialidad || '',
    email: formValues.email || '',
    contraseña: formValues.password || '',
    imagenPerfil: fotoUrl || null
  };


    try {
      
      const especialistaCreado = await this.empleadoService.crearEmpleado(nuevoEspecialista);
      
      // Toast de éxito médico
      this.toastService.cuentaCreada('especialista', `${nuevoEspecialista.nombre} ${nuevoEspecialista.apellido}`);
      
      // Si se agregó una nueva especialidad, guardarla en la lista
      const nuevaEspec = this.especialistaForm.value.nuevaEspecialidad;
      if (nuevaEspec && nuevaEspec.trim()) {
        const especialidadGuardada = this.guardarEspecialidad(nuevaEspec);
        if (especialidadGuardada) {
          this.toastService.success(`🆕 Nueva especialidad "${nuevaEspec.trim()}" agregada a la lista`);
        }
      }
      
      // Reset completo del formulario
      this.especialistaForm.reset();
      this.imagenPreview = null;
      this.mostrarInputNueva = false;
      return especialistaCreado.id || 0;
    } catch (error) {
      console.error(error);
      this.toastService.error('❌ Error al crear la cuenta de especialista. Intente nuevamente.');
      this.loading = false;
      throw error;
    }
  }
}

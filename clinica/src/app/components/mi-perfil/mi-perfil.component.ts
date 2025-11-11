import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { EmpleadosService } from '../../services/empleados.service';
import { PacientesService } from '../../services/pacientes.service';
import { ExportService } from '../../services/export.service';
import { ToastService } from '../../services/toast.service';
import { HorariosService } from '../../services/horarios.service';
import { HistoriaClinicaService, HistoriaClinicaCompleta } from '../../services/historia-clinica.service';
import { supabase } from '../../services/supabase.service';
import { Empleado } from '../../services/empleados.service';
import { Paciente } from '../../services/pacientes.service';
import { fadeInAnimation, fadeIn, slideUpAnimation } from '../../animations/animations';
import { NavigationService } from '../../services/navigation.service';

// Interfaces para horarios
interface HorarioDia {
  activo: boolean;
  manana: boolean;
  tarde: boolean;
}

interface HorariosEspecialista {
  lunes: HorarioDia;
  martes: HorarioDia;
  miercoles: HorarioDia;
  jueves: HorarioDia;
  viernes: HorarioDia;
  sabado: HorarioDia;
}

// Interfaces para pacientes atendidos
interface PacienteAtendido {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  foto1?: string;
  foto2?: string;
  ultimos3Turnos: TurnoAtendido[];
  totalTurnos: number;
}

interface TurnoAtendido {
  id: string;
  fecha: string;
  hora: string;
  especialidad: string;
  estado: string;
}

type DiaSemana = keyof HorariosEspecialista;

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './mi-perfil.component.html',
  styleUrls: ['./mi-perfil.component.scss'],
  animations: [fadeInAnimation, fadeIn, slideUpAnimation]
})
export class MiPerfilComponent implements OnInit {
  private empleadosService = inject(EmpleadosService);
  private pacientesService = inject(PacientesService);
  private exportService = inject(ExportService);
  private toastService = inject(ToastService);
  private horariosService = inject(HorariosService);
  private historiaClinicaService = inject(HistoriaClinicaService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private navigationService = inject(NavigationService);

  userType: 'admin' | 'especialista' | 'paciente' | null = null;
  currentUser: Empleado | Paciente | null = null;
  isLoading = true;
  isEditing = false;
  isSaving = false;
  descargandoPDF = false;

  // Historia clínica del paciente
  historiaClinica: HistoriaClinicaCompleta[] = [];
  loadingHistoria = false;
  mostrarHistoria = false;

  // Formulario de datos personales
  datosPersonalesForm: FormGroup;

  // Preview de imágenes
  imagen1Preview: string | null = null;
  imagen2Preview: string | null = null;

  // ========== HORARIOS (Solo para especialistas) ==========
  isEditingHorarios = false;
  isSavingHorarios = false;
  
  // Estructura de horarios
  horarios: HorariosEspecialista = {
    lunes: { activo: false, manana: false, tarde: false },
    martes: { activo: false, manana: false, tarde: false },
    miercoles: { activo: false, manana: false, tarde: false },
    jueves: { activo: false, manana: false, tarde: false },
    viernes: { activo: false, manana: false, tarde: false },
    sabado: { activo: false, manana: false, tarde: false }
  };

  // Días de la semana para mostrar
  diasSemana: Array<{key: DiaSemana, label: string}> = [
    { key: 'lunes', label: 'Lunes' },
    { key: 'martes', label: 'Martes' },
    { key: 'miercoles', label: 'Miércoles' },
    { key: 'jueves', label: 'Jueves' },
    { key: 'viernes', label: 'Viernes' },
    { key: 'sabado', label: 'Sábado' }
  ];

  // ========== PACIENTES ATENDIDOS (Solo para especialistas) ==========
  pacientesAtendidos: PacienteAtendido[] = [];
  loadingPacientes = false;
  mostrarPacientes = false;
  pacienteSeleccionado: PacienteAtendido | null = null;
  
  // ========== VISTA ESPECÍFICA DE HISTORIA CLÍNICA ==========
  mostrarHistoriaEspecifica = false;
  historiaEspecificaPaciente: any = null;
  historiaClinicaEspecifica: HistoriaClinicaCompleta[] = [];
  loadingHistoriaEspecifica = false;

  // ========== USUARIOS (Solo para admin) ==========
  todosLosUsuarios: any[] = [];
  loadingUsuarios = false;
  mostrarUsuarios = false;

  // ========== PDF HISTORIA CLÍNICA (Solo para pacientes) ==========
  especialidadesDisponibles: string[] = [];
  especialidadSeleccionada: string = '';

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
        
        // Cargar horarios si es especialista
        if (this.userType === 'especialista') {
          await this.cargarHorariosEspecialista();
        }
        
        // Cargar historia clínica si es paciente
        if (this.userType === 'paciente') {
          await this.cargarEspecialidadesDisponibles();
        }
        if (this.userType === 'paciente') {
          await this.cargarHistoriaClinica();
        }
        
        // Procesar queryParams para acciones específicas
        await this.procesarQueryParams();
      }
    } catch (error) {
      console.error('Error al cargar perfil:', error);
      this.toastService.error('Error al cargar el perfil');
      this.router.navigate(['/welcome']);
    }
  }

  // ========== PROCESAMIENTO DE QUERY PARAMS ==========
  private async procesarQueryParams() {
    this.route.queryParams.subscribe(async (params) => {
      const pacienteId = params['pacienteId'];
      const action = params['action'];
      
      if (pacienteId && action === 'verHistoria') {
        await this.mostrarHistoriaClinicaEspecifica(Number(pacienteId));
      }
    });
  }

  private async detectUserType() {
    this.isLoading = true;

    try {
      // Obtener datos del localStorage para verificar el tipo real
      const userDataString = localStorage.getItem('currentUser');
      if (!userDataString) {
        this.toastService.warning('Debes iniciar sesión para acceder a tu perfil');
        this.router.navigate(['/login']);
        return;
      }

      const userData = JSON.parse(userDataString);
      
      // Verificar si tiene campo 'obraSocial' (solo pacientes lo tienen)
      if (userData.obraSocial !== undefined) {
        // Es un paciente
        let paciente = this.pacientesService.usuarioActual;
        
        // Si el servicio no tiene el usuario cargado, cargarlo desde localStorage
        if (!paciente) {
          this.pacientesService.usuarioActual = userData as Paciente;
          paciente = userData as Paciente;
        }
        
        this.currentUser = paciente;
        this.userType = 'paciente';
        this.isLoading = false;
        return;
      } else {
        // Es un empleado (admin o especialista)
        let empleado = this.empleadosService.usuarioActual;
        
        // Si el servicio no tiene el usuario cargado, cargarlo desde localStorage
        if (!empleado) {
          this.empleadosService.usuarioActual = userData as any;
          empleado = userData as any;
        }
        
        if (empleado) {
          this.currentUser = empleado;
          this.userType = empleado.especialidad?.toLowerCase() === 'administrador' ? 'admin' : 'especialista';
          this.isLoading = false;
          return;
        }
      }
    } catch (error) {
      console.error('Error detectando tipo de usuario:', error);
      this.toastService.error('Error al cargar información del usuario');
      localStorage.removeItem('currentUser');
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
    this.toastService.info('📅 Regresando a mis turnos...');
    this.navigationService.navigateWithSpinner('/mis-turnos', (loading) => {
      this.isLoading = loading;
    });
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

  // ========== MÉTODOS PARA HORARIOS ==========

  toggleEditingHorarios() {
    this.isEditingHorarios = !this.isEditingHorarios;
    if (!this.isEditingHorarios) {
      // Si cancela la edición, recargar horarios originales
      this.cargarHorariosEspecialista();
    }
  }

  async guardarHorarios() {
    if (!this.isEspecialista()) {
      this.toastService.warning('Solo los especialistas pueden configurar horarios');
      return;
    }

    if (!this.currentUser?.id) {
      this.toastService.error('Error: No se encontró el ID del especialista');
      return;
    }

    this.isSavingHorarios = true;

    try {
      // Guardar horarios en la base de datos
      await this.horariosService.guardarHorarios(this.currentUser.id, this.horarios);
      
      this.toastService.success('Horarios actualizados correctamente');
      this.isEditingHorarios = false;
    } catch (error) {
      console.error('Error al guardar horarios:', error);
      this.toastService.error('Error al guardar los horarios');
    } finally {
      this.isSavingHorarios = false;
    }
  }

  async cargarHorariosEspecialista() {
    if (!this.currentUser?.id || !this.isEspecialista()) return;

    try {
      const horariosDB = await this.horariosService.obtenerHorariosPorEspecialista(this.currentUser.id);
      
      // Resetear horarios a estado inicial
      Object.keys(this.horarios).forEach(dia => {
        const diaKey = dia as DiaSemana;
        this.horarios[diaKey] = { activo: false, manana: false, tarde: false };
      });

      // Cargar horarios desde la base de datos
      horariosDB.forEach(horario => {
        const diaKey = horario.dia_semana as DiaSemana;
        if (this.horarios[diaKey]) {
          this.horarios[diaKey] = {
            activo: horario.activo,
            manana: horario.turno_manana,
            tarde: horario.turno_tarde
          };
        }
      });

      console.log('Horarios cargados:', this.horarios);
    } catch (error) {
      console.error('Error cargando horarios:', error);
      // No mostrar error al usuario ya que puede ser la primera vez que configura horarios
    }
  }

  toggleDiaCompleto(dia: DiaSemana) {
    if (!this.isEditingHorarios) return;
    
    const horarioDia = this.horarios[dia];
    horarioDia.activo = !horarioDia.activo;
    
    // Si se desactiva el día, también desactivar mañana y tarde
    if (!horarioDia.activo) {
      horarioDia.manana = false;
      horarioDia.tarde = false;
    }
  }

  toggleTurno(dia: DiaSemana, turno: 'manana' | 'tarde') {
    if (!this.isEditingHorarios) return;
    
    const horarioDia = this.horarios[dia];
    horarioDia[turno] = !horarioDia[turno];
    
    // Si se activa un turno, activar el día automáticamente
    if (horarioDia[turno]) {
      horarioDia.activo = true;
    }
    
    // Si se desactivan ambos turnos, desactivar el día
    if (!horarioDia.manana && !horarioDia.tarde) {
      horarioDia.activo = false;
    }
  }

  isEspecialista(): boolean {
    return this.userType === 'especialista';
  }

  getHorarioTexto(dia: DiaSemana): string {
    const horarioDia = this.horarios[dia];
    
    if (!horarioDia.activo) {
      return 'No disponible';
    }
    
    const turnos = [];
    if (horarioDia.manana) turnos.push('Mañana (8:00-12:00)');
    if (horarioDia.tarde) turnos.push('Tarde (14:00-18:00)');
    
    return turnos.length > 0 ? turnos.join(', ') : 'Día activo sin turnos';
  }

  contarDiasActivos(): number {
    return Object.values(this.horarios).filter(dia => dia.activo).length;
  }

  contarTurnosActivos(): number {
    return Object.values(this.horarios).reduce((count, dia) => {
      return count + (dia.manana ? 1 : 0) + (dia.tarde ? 1 : 0);
    }, 0);
  }

  // Método para descargar historia clínica (solo pacientes)
  async descargarPDFHistoriaClinica() {
    if (this.userType !== 'paciente' || !this.currentUser?.id) {
      this.toastService.error('❌ No tienes permisos para esta acción');
      return;
    }

    this.descargandoPDF = true;
    try {
      this.toastService.info('📄 Generando tu historia clínica...');
      
      // Si hay especialidad seleccionada, usar el nuevo método con filtro
      if (this.especialidadSeleccionada) {
        await this.exportService.exportarHistoriaClinicaPorEspecialidadPDF(
          this.currentUser.id, 
          this.especialidadSeleccionada
        );
      } else {
        // Si no hay filtro, usar el método original
        await this.exportService.exportarHistoriaClinicaPDF(this.currentUser.id);
      }
      
      this.toastService.success('✅ Historia clínica descargada exitosamente');
    } catch (error) {
      console.error('Error al descargar historia clínica:', error);
      this.toastService.error('❌ Error al generar el PDF de historia clínica');
    } finally {
      this.descargandoPDF = false;
    }
  }

  // Métodos para historia clínica
  async cargarHistoriaClinica() {
    if (this.userType !== 'paciente' || !this.currentUser?.id) {
      return;
    }

    this.loadingHistoria = true;
    try {
      this.historiaClinica = await this.historiaClinicaService.obtenerHistoriaPaciente(this.currentUser.id);
      console.log('Historia clínica cargada:', this.historiaClinica);
    } catch (error) {
      console.error('Error al cargar historia clínica:', error);
      this.toastService.error('❌ Error al cargar la historia clínica');
    } finally {
      this.loadingHistoria = false;
    }
  }

  toggleHistoriaClinica() {
    this.mostrarHistoria = !this.mostrarHistoria;
    if (this.mostrarHistoria && this.historiaClinica.length === 0) {
      this.cargarHistoriaClinica();
    }
  }

  obtenerCamposDinamicos(historia: HistoriaClinicaCompleta): Array<{clave: string, valor: string}> {
    const campos = [];
    
    if (historia.campo_dinamico_1_clave && historia.campo_dinamico_1_valor) {
      campos.push({
        clave: historia.campo_dinamico_1_clave,
        valor: historia.campo_dinamico_1_valor
      });
    }
    
    if (historia.campo_dinamico_2_clave && historia.campo_dinamico_2_valor) {
      campos.push({
        clave: historia.campo_dinamico_2_clave,
        valor: historia.campo_dinamico_2_valor
      });
    }
    
    if (historia.campo_dinamico_3_clave && historia.campo_dinamico_3_valor) {
      campos.push({
        clave: historia.campo_dinamico_3_clave,
        valor: historia.campo_dinamico_3_valor
      });
    }
    
    return campos;
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // ========== MÉTODOS PARA PACIENTES ATENDIDOS ==========
  async cargarPacientesAtendidos() {
    if (!this.currentUser || this.userType !== 'especialista') return;

    this.loadingPacientes = true;
    try {
      // Obtener turnos finalizados del especialista
      const { data: turnos, error } = await supabase
        .from('turnos')
        .select(`
          id,
          fecha,
          horario,
          especialidad,
          estado,
          pacienteid,
          pacientes!pacienteid (
            id,
            nombre,
            apellido,
            email,
            foto1,
            foto2
          )
        `)
        .eq('especialistaid', this.currentUser.id)
        .eq('estado', 'realizado')
        .order('fecha', { ascending: false });

      if (error) throw error;

      // Agrupar por paciente y obtener últimos 3 turnos
      const pacientesMap = new Map<string, any>();
      
      turnos?.forEach((turno: any) => {
        const pacienteId = turno.pacienteid;
        if (!pacientesMap.has(pacienteId)) {
          pacientesMap.set(pacienteId, {
            id: turno.pacientes.id,
            nombre: turno.pacientes.nombre,
            apellido: turno.pacientes.apellido,
            email: turno.pacientes.email,
            foto1: turno.pacientes.foto1,
            foto2: turno.pacientes.foto2,
            ultimos3Turnos: [],
            totalTurnos: 0
          });
        }
        
        const paciente = pacientesMap.get(pacienteId);
        if (paciente.ultimos3Turnos.length < 3) {
          paciente.ultimos3Turnos.push({
            id: turno.id,
            fecha: turno.fecha,
            hora: turno.horario,
            especialidad: turno.especialidad,
            estado: turno.estado
          });
        }
        paciente.totalTurnos++;
      });

      this.pacientesAtendidos = Array.from(pacientesMap.values());
      console.log('Pacientes atendidos cargados:', this.pacientesAtendidos);
    } catch (error) {
      console.error('Error al cargar pacientes atendidos:', error);
      this.toastService.error('❌ Error al cargar pacientes atendidos');
    } finally {
      this.loadingPacientes = false;
    }
  }

  togglePacientesAtendidos() {
    this.mostrarPacientes = !this.mostrarPacientes;
    if (this.mostrarPacientes && this.pacientesAtendidos.length === 0) {
      this.cargarPacientesAtendidos();
    }
  }

  verHistoriaClinicaPaciente(paciente: PacienteAtendido) {
    this.pacienteSeleccionado = paciente;
    // Aquí podrías abrir un modal o navegar a una vista detallada
    this.router.navigate(['/mi-perfil'], { 
      queryParams: { 
        pacienteId: paciente.id,
        action: 'verHistoria' 
      } 
    });
  }

  // ========== VISTA ESPECÍFICA DE HISTORIA CLÍNICA ==========
  async mostrarHistoriaClinicaEspecifica(pacienteId: number) {
    if (!this.currentUser || this.userType !== 'especialista') return;

    this.loadingHistoriaEspecifica = true;
    this.mostrarHistoriaEspecifica = true;
    
    try {
      // Obtener información del paciente
      const { data: paciente, error: errorPaciente } = await supabase
        .from('pacientes')
        .select('*')
        .eq('id', pacienteId)
        .single();

      if (errorPaciente || !paciente) {
        throw new Error('Paciente no encontrado');
      }

      this.historiaEspecificaPaciente = paciente;

      // Obtener historia clínica del paciente con el especialista actual
      const historias = await this.historiaClinicaService.obtenerHistoriaPaciente(pacienteId);
      
      // Filtrar solo las historias del especialista actual
      this.historiaClinicaEspecifica = historias.filter(
        (historia: HistoriaClinicaCompleta) => historia.especialista_id === this.currentUser?.id
      );

      this.toastService.success(`Historia clínica de ${paciente.nombre} ${paciente.apellido} cargada`);
      
      // Scroll hacia la sección específica
      setTimeout(() => {
        const element = document.getElementById('historia-especifica');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);

    } catch (error) {
      console.error('Error al cargar historia específica:', error);
      this.toastService.error('Error al cargar la historia clínica del paciente');
      this.cerrarHistoriaEspecifica();
    } finally {
      this.loadingHistoriaEspecifica = false;
    }
  }

  cerrarHistoriaEspecifica() {
    this.mostrarHistoriaEspecifica = false;
    this.historiaEspecificaPaciente = null;
    this.historiaClinicaEspecifica = [];
    this.pacienteSeleccionado = null;
    
    // Limpiar queryParams
    this.router.navigate(['/mi-perfil']);
  }

  // ========== MÉTODOS PARA USUARIOS (ADMIN) ==========
  async cargarTodosLosUsuarios() {
    if (!this.currentUser || this.userType !== 'admin') return;

    this.loadingUsuarios = true;
    try {
      // Cargar empleados
      const { data: empleados, error: errorEmpleados } = await supabase
        .from('empleados')
        .select('*');

      // Cargar pacientes
      const { data: pacientes, error: errorPacientes } = await supabase
        .from('pacientes')
        .select('*');

      if (errorEmpleados) throw errorEmpleados;
      if (errorPacientes) throw errorPacientes;

      // Combinar y marcar tipo
      const usuarios = [
        ...(empleados?.map((emp: any) => ({ ...emp, tipo: 'empleado' })) || []),
        ...(pacientes?.map((pac: any) => ({ ...pac, tipo: 'paciente' })) || [])
      ];

      this.todosLosUsuarios = usuarios;
      console.log('Usuarios cargados:', this.todosLosUsuarios);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      this.toastService.error('❌ Error al cargar usuarios');
    } finally {
      this.loadingUsuarios = false;
    }
  }

  toggleUsuarios() {
    this.mostrarUsuarios = !this.mostrarUsuarios;
    if (this.mostrarUsuarios && this.todosLosUsuarios.length === 0) {
      this.cargarTodosLosUsuarios();
    }
  }

  async descargarExcelUsuario(usuario: any) {
    try {
      // Obtener turnos del usuario
      const { data: turnos, error } = await supabase
        .from('turnos')
        .select(`
          id,
          fecha,
          horario,
          especialidad,
          estado,
          especialistaid,
          empleados!especialistaid (
            nombre,
            apellido,
            especialidad
          )
        `)
        .eq(usuario.tipo === 'paciente' ? 'pacienteid' : 'especialistaid', usuario.id)
        .order('fecha', { ascending: false });

      if (error) throw error;

      // Preparar datos para Excel
      const datosExcel = turnos?.map((turno: any) => ({
        'Fecha': turno.fecha,
        'Hora': turno.horario,
        'Especialidad': turno.especialidad,
        'Estado': turno.estado,
        'Profesional': turno.empleados ? `${turno.empleados.nombre} ${turno.empleados.apellido}` : 'N/A'
      })) || [];

      // Usar el servicio de exportación
      await this.exportService.exportarTurnosUsuarioExcel(
        usuario.nombre + ' ' + usuario.apellido,
        datosExcel
      );

      this.toastService.success('✅ Excel descargado correctamente');
    } catch (error) {
      console.error('Error al descargar Excel:', error);
      this.toastService.error('❌ Error al descargar Excel');
    }
  }

  // ========== MÉTODOS PARA PDF HISTORIA CLÍNICA ==========
  async cargarEspecialidadesDisponibles() {
    if (!this.currentUser || this.userType !== 'paciente') return;

    try {
      // Obtener especialidades únicas de los turnos del paciente
      const { data: turnos, error } = await supabase
        .from('turnos')
        .select('especialidad')
        .eq('pacienteid', this.currentUser.id)
        .eq('estado', 'realizado');

      if (error) throw error;

      // Extraer especialidades únicas
      const especialidadesSet = new Set<string>();
      turnos?.forEach((turno: any) => {
        if (turno.especialidad) {
          especialidadesSet.add(turno.especialidad);
        }
      });

      this.especialidadesDisponibles = Array.from(especialidadesSet).sort();
      console.log('Especialidades disponibles:', this.especialidadesDisponibles);
    } catch (error) {
      console.error('Error al cargar especialidades:', error);
    }
  }

  // ========== MÉTODOS AUXILIARES ==========
  calcularEdad(fechaNacimiento: string): number {
    if (!fechaNacimiento) return 0;
    
    const nacimiento = new Date(fechaNacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    
    return edad;
  }
}
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TurnosService, Turno } from '../../services/turnos.service';
import { PacientesService } from '../../services/pacientes.service';
import { EmpleadosService } from '../../services/empleados.service';
import { HistoriaClinicaService } from '../../services/historia-clinica.service';
import { ToastService } from '../../services/toast.service';
import { ToastComponent } from '../toast/toast.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NavigationService } from '../../services/navigation.service';

@Component({
  selector: 'app-mis-turnos',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastComponent, MatProgressSpinnerModule],
  templateUrl: './mis-turnos.component.html',
  styleUrls: ['./mis-turnos.component.scss']
})
export class MisTurnosComponent implements OnInit {

  turnos: Turno[] = [];
  turnosFiltrados: Turno[] = [];
  loading = false;
  
  // Propiedades para detectar tipo de usuario
  esPaciente = false;
  esEspecialista = false;
  usuarioActual: any = null;
  
  // Filtros
  filtroEspecialidad = '';
  filtroEspecialista = '';
  
  // Filtros avanzados de historia clínica
  filtroHistoriaClinica = '';
  mostrarFiltrosAvanzados = false;
  
  // Datos para filtros
  especialidades: string[] = [];
  especialistas: {id: number, nombre: string, especialidad: string}[] = [];
  
  // Modales/Acciones
  mostrarModalCancelar = false;
  mostrarModalCalificar = false;
  mostrarModalEncuesta = false;
  mostrarModalResena = false;
  mostrarModalHistoria = false;
  
  turnoSeleccionado: Turno | null = null;
  comentarioCancelacion = '';
  comentarioCalificacion = '';
  calificacionSeleccionada = 5;
  
  // Propiedades para la encuesta
  encuesta = {
    atencionGeneral: 5,
    tiempoEspera: 5,
    profesionalismo: 5,
    instalaciones: 5,
    recomendaria: true,
    comentarios: '',
    sugerencias: ''
  };

  // Encuesta para especialistas
  encuestaEspecialista = {
    experienciaPaciente: 5,
    complejidadCaso: 5,
    recursosDisponibles: 5,
    colaboracionEquipo: 5,
    seguimientoAdecuado: true,
    observacionesCaso: '',
    recomendacionesTratamiento: ''
  };

  constructor(
    private turnosService: TurnosService,
    private pacientesService: PacientesService,
    private empleadosService: EmpleadosService,
    private historiaClinicaService: HistoriaClinicaService,
    private toastService: ToastService,
    private router: Router,
    private navigationService: NavigationService
  ) { }

  ngOnInit(): void {
    this.cargarDatos();
  }

  async cargarDatos() {
    this.loading = true;
    try {
      // Detectar tipo de usuario logueado
      await this.detectarTipoUsuario();
      
      if (!this.usuarioActual) {
        this.toastService.error('❌ Debes iniciar sesión para ver tus turnos');
        this.router.navigate(['/login']);
        return;
      }

      // Cargar datos para filtros en paralelo
      const [especialidades, especialistas] = await Promise.all([
        this.turnosService.obtenerEspecialidades(),
        this.turnosService.obtenerEspecialistas()
      ]);

      // Cargar turnos según el tipo de usuario
      let turnos: Turno[] = [];
      
      if (this.esPaciente) {
        // Cargar turnos del paciente
        console.log('Cargando turnos para paciente ID:', this.usuarioActual.id);
        turnos = await this.cargarTurnosPaciente(this.usuarioActual.id);
      } else if (this.esEspecialista) {
        // Cargar turnos del especialista
        console.log('Cargando turnos para especialista ID:', this.usuarioActual.id);
        turnos = await this.cargarTurnosEspecialista(this.usuarioActual.id);
      }

      console.log('Turnos cargados:', turnos);
      this.turnos = turnos;
      this.turnosFiltrados = turnos;
      this.especialidades = especialidades;
      this.especialistas = especialistas;

      if (turnos.length === 0) {
        const mensaje = this.esPaciente ? 
          'ℹ️ No tienes turnos registrados' : 
          'ℹ️ No tienes turnos asignados en tu especialidad';
        this.toastService.info(mensaje);
      }

    } catch (error) {
      console.error(error);
      this.toastService.error('❌ Error al cargar los turnos');
    } finally {
      this.loading = false;
    }
  }

  // Helper local para enriquecer turno cuando venimos del fallback simple
  private normalizeTurnoEnriquecido(turno: any, paciente: any, empleado: any): Turno {
    return this.turnosService['normalizeTurno']({
      ...turno,
      pacienteNombre: paciente ? `${paciente.nombre} ${paciente.apellido || ''}`.trim() : '',
      especialistaNombre: empleado ? `${empleado.nombre} ${empleado.apellido || ''}`.trim() : '',
      especialidad: empleado?.especialidad || turno.especialidad
    });
  }

  async detectarTipoUsuario() {
    // Verificar si es un empleado/especialista logueado
    const empleado = this.empleadosService.usuarioActual;
    if (empleado) {
      console.log('Empleado detectado:', empleado);
      this.usuarioActual = empleado;
      this.esEspecialista = empleado.especialidad?.toLowerCase() !== 'administrador';
      this.esPaciente = false;
      return;
    }

    // Verificar si es un paciente logueado
    const paciente = this.pacientesService.usuarioActual;
    if (paciente) {
      console.log('Paciente detectado:', paciente);
      this.usuarioActual = paciente;
      this.esPaciente = true;
      this.esEspecialista = false;
      return;
    }

    // No hay usuario logueado
    console.log('No hay usuario logueado');
    this.usuarioActual = null;
    this.esPaciente = false;
    this.esEspecialista = false;
  }

  async cargarTurnosPaciente(pacienteId: number): Promise<Turno[]> {
    try {
      return await this.turnosService.obtenerTurnosPaciente(pacienteId);
    } catch (err: any) {
      console.warn('Consulta con joins fallida, usando fallback simple:', err?.message || err);
      const simple = await this.turnosService.obtenerTurnosPacienteSimple(pacienteId);
      return await Promise.all(simple.map(async (t) => {
        const paciente = await this.pacientesService.obtenerPorId(t.pacienteid);
        const empleado: any = await this.empleadosService.obtenerPorId(t.especialistaid);
        return this.normalizeTurnoEnriquecido(t, paciente, empleado);
      }));
    }
  }

  async cargarTurnosEspecialista(especialistaId: number): Promise<Turno[]> {
    try {
      return await this.turnosService.obtenerTurnosEspecialista(especialistaId);
    } catch (err: any) {
      console.warn('Consulta con joins fallida, usando fallback simple:', err?.message || err);
      const simple = await this.turnosService.obtenerTurnosEspecialistaSimple(especialistaId);
      return await Promise.all(simple.map(async (t: any) => {
        const paciente = await this.pacientesService.obtenerPorId(t.pacienteid);
        const empleado: any = await this.empleadosService.obtenerPorId(t.especialistaid);
        return this.normalizeTurnoEnriquecido(t, paciente, empleado);
      }));
    }
  }

  // Aplicar filtros
  async aplicarFiltros() {
    let resultado = [...this.turnos];

    if (this.filtroEspecialidad) {
      resultado = resultado.filter(t => t.especialidad.toLowerCase().includes(this.filtroEspecialidad.toLowerCase()));
    }

    if (this.filtroEspecialista) {
      resultado = resultado.filter(t => t.especialistaNombre?.toLowerCase().includes(this.filtroEspecialista.toLowerCase()));
    }

    // Filtro avanzado de historia clínica
    if (this.filtroHistoriaClinica && this.filtroHistoriaClinica.trim()) {
      try {
        const terminoBusqueda = this.filtroHistoriaClinica.toLowerCase().trim();
        
        // Buscar en historia clínica usando el servicio
        const historiasEncontradas = await this.historiaClinicaService.buscarHistorias({
          textoBusqueda: terminoBusqueda
        });
        
        // Obtener IDs de turnos que tienen historia clínica coincidente
        const turnoIdsCoincidentes = historiasEncontradas.map(h => h.turno_id);
        
        // Filtrar turnos que tienen historia clínica que coincide con la búsqueda
        resultado = resultado.filter(turno => 
          turno.id && turnoIdsCoincidentes.includes(turno.id)
        );
        
        if (resultado.length === 0 && this.filtroHistoriaClinica.trim()) {
          this.toastService.info('🔍 No se encontraron turnos con historia clínica que coincida con la búsqueda');
        }
      } catch (error) {
        console.error('Error al buscar en historia clínica:', error);
        this.toastService.error('❌ Error al buscar en historia clínica');
      }
    }

    this.turnosFiltrados = resultado;
  }

  // Limpiar filtros
  limpiarFiltros() {
    this.filtroEspecialidad = '';
    this.filtroEspecialista = '';
    this.filtroHistoriaClinica = '';
    this.turnosFiltrados = [...this.turnos];
  }

  // Toggle para mostrar/ocultar filtros avanzados
  toggleFiltrosAvanzados() {
    this.mostrarFiltrosAvanzados = !this.mostrarFiltrosAvanzados;
  }

  // Verificar qué acciones puede realizar según el estado
  puedecancelar(turno: Turno): boolean {
    return turno.estado === 'pendiente' || turno.estado === 'aceptado';
  }

  puedeVerResena(turno: Turno): boolean {
    return !!turno.comentarioEspecialista;
  }

  puedeCompletarEncuesta(turno: Turno): boolean {
    // Para pacientes: pueden completar encuesta si el turno está realizado, tiene comentario del especialista y no han completado encuesta
    if (this.esPaciente) {
      return turno.estado === 'realizado' && !!turno.comentarioEspecialista && !turno.encuestaRealizada;
    }
    
    // Para especialistas: pueden completar encuesta si el turno está realizado y no han completado encuesta
    if (this.esEspecialista) {
      return turno.estado === 'realizado' && !turno.encuestaRealizada;
    }
    
    return false;
  }

  puedeCalificar(turno: Turno): boolean {
    return turno.estado === 'realizado' && !turno.calificacion;
  }

  // Acciones
  abrirModalCancelar(turno: Turno) {
    this.turnoSeleccionado = turno;
    this.comentarioCancelacion = '';
    this.mostrarModalCancelar = true;
  }

  abrirModalCalificar(turno: Turno) {
    this.turnoSeleccionado = turno;
    this.comentarioCalificacion = '';
    this.calificacionSeleccionada = 5;
    this.mostrarModalCalificar = true;
  }

  abrirModalEncuesta(turno: Turno) {
    this.turnoSeleccionado = turno;
    // Resetear valores de la encuesta según el tipo de usuario
    if (this.esPaciente) {
      this.encuesta = {
        atencionGeneral: 5,
        tiempoEspera: 5,
        profesionalismo: 5,
        instalaciones: 5,
        recomendaria: true,
        comentarios: '',
        sugerencias: ''
      };
    } else if (this.esEspecialista) {
      this.encuestaEspecialista = {
        experienciaPaciente: 5,
        complejidadCaso: 5,
        recursosDisponibles: 5,
        colaboracionEquipo: 5,
        seguimientoAdecuado: true,
        observacionesCaso: '',
        recomendacionesTratamiento: ''
      };
    }
    this.mostrarModalEncuesta = true;
  }

  abrirModalResena(turno: Turno) {
    this.turnoSeleccionado = turno;
    this.mostrarModalResena = true;
  }

  abrirModalHistoria(turno: Turno) {
    this.turnoSeleccionado = turno;
    this.mostrarModalHistoria = true;
  }

  cerrarModalHistoria() {
    this.mostrarModalHistoria = false;
    this.turnoSeleccionado = null;
  }

  cerrarModales() {
    this.mostrarModalCancelar = false;
    this.mostrarModalCalificar = false;
    this.mostrarModalEncuesta = false;
    this.mostrarModalResena = false;
    this.mostrarModalHistoria = false;
    this.turnoSeleccionado = null;
  }

  async cancelarTurno() {
    if (!this.turnoSeleccionado || !this.comentarioCancelacion.trim()) {
      this.toastService.warning('⚠️ Debes escribir el motivo de la cancelación');
      return;
    }

    this.loading = true;
    try {
      await this.turnosService.cancelarTurno(this.turnoSeleccionado.id!, this.comentarioCancelacion);
      this.toastService.success('✅ Turno cancelado correctamente');
      this.cerrarModales();
      await this.cargarDatos(); // Recargar lista
    } catch (error) {
      console.error(error);
      this.toastService.error('❌ Error al cancelar el turno');
    } finally {
      this.loading = false;
    }
  }

  async calificarAtencion() {
    if (!this.turnoSeleccionado || !this.comentarioCalificacion.trim()) {
      this.toastService.warning('⚠️ Debes escribir un comentario sobre la atención');
      return;
    }

    this.loading = true;
    try {
      await this.turnosService.calificarAtencion(
        this.turnoSeleccionado.id!, 
        this.calificacionSeleccionada, 
        this.comentarioCalificacion
      );
      this.toastService.success('✅ Atención calificada correctamente');
      this.cerrarModales();
      await this.cargarDatos();
    } catch (error) {
      console.error(error);
      this.toastService.error('❌ Error al calificar la atención');
    } finally {
      this.loading = false;
    }
  }

  async completarEncuesta() {
    if (!this.turnoSeleccionado) return;

    // Validar campos obligatorios según el tipo de usuario
    if (this.esPaciente) {
      if (!this.encuesta.comentarios.trim()) {
        this.toastService.warning('⚠️ Por favor escribí al menos un comentario sobre tu experiencia');
        return;
      }
    } else if (this.esEspecialista) {
      if (!this.encuestaEspecialista.observacionesCaso.trim()) {
        this.toastService.warning('⚠️ Por favor escribí al menos una observación sobre el caso');
        return;
      }
    }

    this.loading = true;
    try {
      // Determinar qué encuesta enviar
      const datosEncuesta = this.esPaciente ? this.encuesta : this.encuestaEspecialista;
      
      // Guardar encuesta completa con todos los datos
      await this.turnosService.completarEncuestaDetallada(
        this.turnoSeleccionado.id!,
        datosEncuesta
      );
      
      const mensaje = this.esPaciente 
        ? '✅ ¡Gracias por completar la encuesta de satisfacción!'
        : '✅ ¡Encuesta profesional completada exitosamente!';
        
      this.toastService.success(mensaje);
      this.cerrarModales();
      await this.cargarDatos();
    } catch (error) {
      console.error(error);
      this.toastService.error('❌ Error al guardar la encuesta');
    } finally {
      this.loading = false;
    }
  }

  // Obtener color del estado
  getEstadoColor(estado: string): string {
    switch (estado) {
      case 'pendiente': return '#ffc107';
      case 'aceptado': return '#17a2b8';
      case 'realizado': return '#28a745';
      case 'rechazado': return '#dc3545';
      case 'cancelado': return '#6c757d';
      default: return '#6c757d';
    }
  }

  // Obtener estrellas para calificación
  getEstrellas(calificacion: number): string {
    return '⭐'.repeat(calificacion);
  }

  // Volver al menú principal
  volver() {
    this.router.navigate(['/login']);
  }

  // Ir a mi perfil
  irAMiPerfil() {
    this.toastService.info('👤 Accediendo a mi perfil...');
    this.navigationService.navigateWithSpinner('/mi-perfil', (loading) => {
      this.loading = loading;
    });
  }

  // Ir a solicitar turno
  irASolicitarTurno() {
    this.toastService.info('📅 Accediendo a solicitar turno...');
    this.navigationService.navigateWithSpinner('/solicitar-turno', (loading) => {
      this.loading = loading;
    });
  }
}
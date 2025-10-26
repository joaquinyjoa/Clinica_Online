import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TurnosService, Turno } from '../../services/turnos.service';
import { PacientesService } from '../../services/pacientes.service';
import { EmpleadosService } from '../../services/empleados.service';
import { ToastService } from '../../services/toast.service';
import { ToastComponent } from '../toast/toast.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

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
  
  // Filtros
  filtroEspecialidad = '';
  filtroEspecialista = '';
  
  // Datos para filtros
  especialidades: string[] = [];
  especialistas: {id: number, nombre: string, especialidad: string}[] = [];
  
  // Modales/Acciones
  mostrarModalCancelar = false;
  mostrarModalCalificar = false;
  mostrarModalEncuesta = false;
  mostrarModalResena = false;
  
  turnoSeleccionado: Turno | null = null;
  comentarioCancelacion = '';
  comentarioCalificacion = '';
  calificacionSeleccionada = 5;

  constructor(
    private turnosService: TurnosService,
    private pacientesService: PacientesService,
    private empleadosService: EmpleadosService,
    private toastService: ToastService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.cargarDatos();
  }

  async cargarDatos() {
    this.loading = true;
    try {
      // Verificar que hay un paciente logueado
      if (!this.pacientesService.usuarioActual) {
        this.toastService.error('❌ Debes iniciar sesión como paciente');
        this.router.navigate(['/login']);
        return;
      }

      const pacienteId = this.pacientesService.usuarioActual.id!;
      
      // Cargar datos para filtros en paralelo
      const [especialidades, especialistas] = await Promise.all([
        this.turnosService.obtenerEspecialidades(),
        this.turnosService.obtenerEspecialistas()
      ]);

      // Intentamos primero la consulta con joins (puede fallar en algunas instancias de PostgREST)
      let turnos: Turno[] = [];
      try {
        turnos = await this.turnosService.obtenerTurnosPaciente(pacienteId);
      } catch (err: any) {
        console.warn('Consulta con joins fallida, usando fallback simple:', err?.message || err);
        // Si falla la consulta con joins, usamos la consulta simple y enriquecemos manualmente
        const simple = await this.turnosService.obtenerTurnosPacienteSimple(pacienteId);
        // Enriquecer: por cada turno, traer paciente y empleado por id
        turnos = await Promise.all(simple.map(async (t) => {
          const paciente = await this.pacientesService.obtenerPorId(t.pacienteid);
          const empleado: any = await this.empleadosService.obtenerPorId(t.especialistaid);
          return this.normalizeTurnoEnriquecido(t, paciente, empleado);
        }));
      }

      this.turnos = turnos;
      this.turnosFiltrados = turnos;
      this.especialidades = especialidades;
      this.especialistas = especialistas;

      if (turnos.length === 0) {
        this.toastService.info('ℹ️ No tienes turnos registrados');
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

  // Aplicar filtros
  aplicarFiltros() {
    let resultado = [...this.turnos];

    if (this.filtroEspecialidad) {
      resultado = resultado.filter(t => t.especialidad.toLowerCase().includes(this.filtroEspecialidad.toLowerCase()));
    }

    if (this.filtroEspecialista) {
      resultado = resultado.filter(t => t.especialistaNombre?.toLowerCase().includes(this.filtroEspecialista.toLowerCase()));
    }

    this.turnosFiltrados = resultado;
  }

  // Limpiar filtros
  limpiarFiltros() {
    this.filtroEspecialidad = '';
    this.filtroEspecialista = '';
    this.turnosFiltrados = [...this.turnos];
  }

  // Verificar qué acciones puede realizar según el estado
  puedecancelar(turno: Turno): boolean {
    return turno.estado === 'pendiente' || turno.estado === 'aceptado';
  }

  puedeVerResena(turno: Turno): boolean {
    return !!turno.comentarioEspecialista;
  }

  puedeCompletarEncuesta(turno: Turno): boolean {
    return turno.estado === 'realizado' && !!turno.comentarioEspecialista && !turno.encuestaRealizada;
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
    this.mostrarModalEncuesta = true;
  }

  abrirModalResena(turno: Turno) {
    this.turnoSeleccionado = turno;
    this.mostrarModalResena = true;
  }

  cerrarModales() {
    this.mostrarModalCancelar = false;
    this.mostrarModalCalificar = false;
    this.mostrarModalEncuesta = false;
    this.mostrarModalResena = false;
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

    this.loading = true;
    try {
      await this.turnosService.completarEncuesta(this.turnoSeleccionado.id!);
      this.toastService.success('✅ Encuesta completada');
      this.cerrarModales();
      await this.cargarDatos();
    } catch (error) {
      console.error(error);
      this.toastService.error('❌ Error al completar la encuesta');
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

  // Ir a solicitar turno
  irASolicitarTurno() {
    this.router.navigate(['/solicitar-turno']);
    this.toastService.info('📅 Accediendo a solicitar turno...');
  }
}
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TurnosService } from '../../services/turnos.service';
import { ToastService } from '../../services/toast.service';
import { ToastComponent } from '../toast/toast.component';
import { EmpleadosService } from '../../services/empleados.service';
import { PacientesService } from '../../services/pacientes.service';
import { HistoriaClinicaService, HistoriaClinica } from '../../services/historia-clinica.service';
import { NavigationService } from '../../services/navigation.service';

import { Turno } from '../../services/turnos.service';

@Component({
  selector: 'app-turnos-especialista',
  standalone: true,
  imports: [CommonModule, FormsModule, MatProgressSpinnerModule, ToastComponent],
  templateUrl: './turnos-especialista.component.html',
  styleUrls: ['./turnos-especialista.component.scss']
})
export class TurnosEspecialistaComponent implements OnInit {
  turnos: Turno[] = [];
  turnosFiltrados: Turno[] = [];
  filtroEstado: string = 'todos';
  filtroFecha: string = '';
  filtroEspecialidad: string = '';
  filtroPaciente: string = '';
  loading = false;

  // Usuario actual
  usuarioActual: any = null;
  esEspecialista = false;

  // Modal properties
  mostrarModalCancelar = false;
  mostrarModalRechazar = false;
  mostrarModalFinalizar = false;
  mostrarModalResena = false;
  mostrarModalHistoriaClinica = false;
  turnoSeleccionado: Turno | null = null;

  // Form properties
  comentarioCancelacion = '';
  comentarioRechazo = '';
  resenaConsulta = '';

  // Historia clínica form properties
  historiaClinica: HistoriaClinica = {
    turno_id: 0,
    paciente_id: 0,
    especialista_id: 0,
    altura: 0,
    peso: 0,
    temperatura: 0,
    presion: ''
  };
  camposDinamicos = [
    { clave: '', valor: '' },
    { clave: '', valor: '' },
    { clave: '', valor: '' }
  ];

  private router = inject(Router);
  private turnosService = inject(TurnosService);
  private toastService = inject(ToastService);
  private empleadosService = inject(EmpleadosService);
  private pacientesService = inject(PacientesService);
  private historiaClinicaService = inject(HistoriaClinicaService);
  private navigationService = inject(NavigationService);

  ngOnInit() {
    this.detectarUsuarioYCargarTurnos();
  }

  async detectarUsuarioYCargarTurnos() {
    // Detectar si es un empleado/especialista logueado
    const empleado = this.empleadosService.usuarioActual;
    if (empleado) {
      console.log('Empleado detectado en turnos-especialista:', empleado);
      this.usuarioActual = empleado;
      this.esEspecialista = empleado.especialidad?.toLowerCase() !== 'administrador';
      
      if (this.esEspecialista) {
        await this.cargarTurnos();
      } else {
        this.toastService.warning('⚠️ Solo los especialistas pueden ver esta sección');
        this.router.navigate(['/']);
      }
    } else {
      this.toastService.error('❌ Debes estar logueado como especialista');
      this.router.navigate(['/login']);
    }
  }

  async cargarTurnos() {
    this.loading = true;
    try {
      console.log('Cargando turnos para especialista ID:', this.usuarioActual.id);
      
      // Usar el servicio real para obtener turnos del especialista
      this.turnos = await this.cargarTurnosEspecialista(this.usuarioActual.id);
      
      console.log('Turnos cargados:', this.turnos);
      this.aplicarFiltros();
    } catch (error) {
      console.error('Error cargando turnos:', error);
      this.toastService.error('Error al cargar los turnos');
    } finally {
      this.loading = false;
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

  normalizeTurnoEnriquecido(turno: any, paciente: any, empleado: any): Turno {
    return {
      id: turno.id,
      pacienteid: turno.pacienteid,
      especialistaid: turno.especialistaid,
      pacienteNombre: paciente ? `${paciente.nombre} ${paciente.apellido || ''}`.trim() : 'Sin datos',
      especialistaNombre: empleado ? `${empleado.nombre} ${empleado.apellido || ''}`.trim() : 'Sin datos',
      especialidad: empleado?.especialidad || turno.especialidad || 'Sin especialidad',
      fecha: turno.fecha,
      horario: turno.horario,
      estado: turno.estado,
      comentariopaciente: turno.comentariopaciente || '',
      comentarioespecialista: turno.comentarioespecialista || '',
      comentarioEspecialista: turno.comentarioespecialista || ''
    };
  }

  aplicarFiltros() {
    this.turnosFiltrados = this.turnos.filter(turno => {
      let pasaFiltroEstado = this.filtroEstado === 'todos' || turno.estado === this.filtroEstado;
      let pasaFiltroFecha = !this.filtroFecha || turno.fecha === this.filtroFecha;
      let pasaFiltroEspecialidad = !this.filtroEspecialidad || 
        turno.especialidad?.toLowerCase().includes(this.filtroEspecialidad.toLowerCase());
      let pasaFiltroPaciente = !this.filtroPaciente || 
        turno.pacienteNombre?.toLowerCase().includes(this.filtroPaciente.toLowerCase());
      
      return pasaFiltroEstado && pasaFiltroFecha && pasaFiltroEspecialidad && pasaFiltroPaciente;
    });
  }

  irAMiPerfil() {
    this.toastService.info('👤 Accediendo a mi perfil...');
    this.navigationService.navigateWithSpinner('/mi-perfil', (loading) => {
      this.loading = loading;
    });
  }

  volver() {
    this.router.navigate(['/']);
  }

  onFiltroEstadoChange(evento: any) {
    this.filtroEstado = evento.target.value;
    this.aplicarFiltros();
  }

  onFiltroFechaChange(evento: any) {
    this.filtroFecha = evento.target.value;
    this.aplicarFiltros();
  }

  limpiarFiltros() {
    this.filtroEstado = 'todos';
    this.filtroFecha = '';
    this.filtroEspecialidad = '';
    this.filtroPaciente = '';
    this.aplicarFiltros();
  }

  getEstadoColor(estado: string): string {
    const colores = {
      'pendiente': '#ffc107',
      'aceptado': '#28a745', 
      'realizado': '#17a2b8',
      'rechazado': '#dc3545',
      'cancelado': '#6c757d'
    };
    return colores[estado as keyof typeof colores] || '#6c757d';
  }

  async aceptarTurno(turno: Turno) {
    this.loading = true;
    try {
      await this.turnosService.actualizarEstado(turno.id!, 'aceptado');
      turno.estado = 'aceptado';
      this.toastService.success('✅ Turno aceptado correctamente');
      this.aplicarFiltros();
    } catch (error) {
      console.error('Error aceptando turno:', error);
      this.toastService.error('❌ Error al aceptar el turno');
    } finally {
      this.loading = false;
    }
  }

  async rechazarTurno() {
    if (!this.comentarioRechazo.trim()) {
      this.toastService.warning('⚠️ Debes proporcionar un motivo para rechazar el turno');
      return;
    }

    if (this.turnoSeleccionado) {
      this.loading = true;
      try {
        await this.turnosService.actualizarEstadoConComentario(
          this.turnoSeleccionado.id!, 
          'rechazado', 
          this.comentarioRechazo
        );
        
        this.turnoSeleccionado.estado = 'rechazado';
        this.turnoSeleccionado.comentarioEspecialista = this.comentarioRechazo;
        this.toastService.success('❌ Turno rechazado');
        this.cerrarModales();
        this.aplicarFiltros();
      } catch (error) {
        console.error('Error rechazando turno:', error);
        this.toastService.error('❌ Error al rechazar el turno');
      } finally {
        this.loading = false;
      }
    }
  }

  async cancelarTurno() {
    if (!this.comentarioCancelacion.trim()) {
      this.toastService.warning('⚠️ Debes proporcionar un motivo para cancelar el turno');
      return;
    }

    if (this.turnoSeleccionado) {
      this.loading = true;
      try {
        await this.turnosService.actualizarEstadoConComentario(
          this.turnoSeleccionado.id!, 
          'cancelado', 
          this.comentarioCancelacion
        );
        
        this.turnoSeleccionado.estado = 'cancelado';
        this.turnoSeleccionado.comentarioEspecialista = this.comentarioCancelacion;
        this.toastService.success('🚫 Turno cancelado');
        this.cerrarModales();
        this.aplicarFiltros();
      } catch (error) {
        console.error('Error cancelando turno:', error);
        this.toastService.error('❌ Error al cancelar el turno');
      } finally {
        this.loading = false;
      }
    }
  }

  async finalizarTurno() {
    if (!this.resenaConsulta.trim()) {
      this.toastService.warning('⚠️ Debes proporcionar una reseña de la consulta para finalizar el turno');
      return;
    }

    if (this.turnoSeleccionado) {
      this.loading = true;
      try {
        await this.turnosService.finalizarTurno(
          this.turnoSeleccionado.id!, 
          this.resenaConsulta
        );
        
        this.turnoSeleccionado.estado = 'realizado';
        this.turnoSeleccionado.comentarioEspecialista = this.resenaConsulta;
        this.toastService.success('✅ Turno finalizado correctamente');
        
        // Abrir modal de historia clínica después de finalizar
        this.abrirModalHistoriaClinica(this.turnoSeleccionado);
        this.cerrarModales();
        this.aplicarFiltros();
      } catch (error) {
        console.error('Error finalizando turno:', error);
        this.toastService.error('❌ Error al finalizar el turno');
      } finally {
        this.loading = false;
      }
    }
  }

  // Métodos para validar qué acciones puede realizar el especialista
  puedeAceptar(turno: Turno): boolean {
    // Solo visible si el turno NO fue Realizado, Cancelado o Rechazado
    return turno.estado === 'pendiente';
  }

  puedeRechazar(turno: Turno): boolean {
    // Solo visible si el turno NO fue Aceptado, Realizado o Cancelado
    return turno.estado === 'pendiente';
  }

  puedeCancelar(turno: Turno): boolean {
    // Solo visible si el turno NO fue Aceptado, Realizado o Rechazado
    return turno.estado === 'pendiente';
  }

  puedeFinalizar(turno: Turno): boolean {
    // Solo visible si el turno fue Aceptado
    return turno.estado === 'aceptado';
  }

  puedeVerResena(turno: Turno): boolean {
    // Solo visible si el turno tiene un comentario o reseña cargado
    return !!turno.comentarioEspecialista && turno.comentarioEspecialista.trim() !== '';
  }

  // Métodos para abrir modales
  abrirModalRechazar(turno: Turno) {
    this.turnoSeleccionado = turno;
    this.comentarioRechazo = '';
    this.mostrarModalRechazar = true;
  }

  abrirModalCancelar(turno: Turno) {
    this.turnoSeleccionado = turno;
    this.comentarioCancelacion = '';
    this.mostrarModalCancelar = true;
  }

  abrirModalFinalizar(turno: Turno) {
    this.turnoSeleccionado = turno;
    this.resenaConsulta = '';
    this.mostrarModalFinalizar = true;
  }

  abrirModalResena(turno: Turno) {
    this.turnoSeleccionado = turno;
    this.mostrarModalResena = true;
  }

  abrirModalHistoriaClinica(turno: Turno) {
    this.turnoSeleccionado = turno;
    this.resetearFormularioHistoria();
    this.historiaClinica.turno_id = turno.id!;
    this.historiaClinica.paciente_id = turno.pacienteid!;
    this.historiaClinica.especialista_id = this.usuarioActual.id;
    this.mostrarModalHistoriaClinica = true;
  }

  resetearFormularioHistoria() {
    this.historiaClinica = {
      turno_id: 0,
      paciente_id: 0,
      especialista_id: 0,
      altura: 0,
      peso: 0,
      temperatura: 0,
      presion: ''
    };
    this.camposDinamicos = [
      { clave: '', valor: '' },
      { clave: '', valor: '' },
      { clave: '', valor: '' }
    ];
  }

  async guardarHistoriaClinica() {
    // Validaciones básicas
    if (!this.historiaClinica.altura || this.historiaClinica.altura <= 0) {
      this.toastService.warning('⚠️ La altura debe ser mayor a 0');
      return;
    }

    if (!this.historiaClinica.peso || this.historiaClinica.peso <= 0) {
      this.toastService.warning('⚠️ El peso debe ser mayor a 0');
      return;
    }

    if (!this.historiaClinica.temperatura || this.historiaClinica.temperatura <= 0) {
      this.toastService.warning('⚠️ La temperatura debe ser mayor a 0');
      return;
    }

    if (!this.historiaClinica.presion || !this.historiaClinica.presion.match(/^\d{2,3}\/\d{2,3}$/)) {
      this.toastService.warning('⚠️ La presión debe tener formato XXX/XX (ej: 120/80)');
      return;
    }

    this.loading = true;
    try {
      // Preparar campos dinámicos
      const camposCompletos = this.camposDinamicos.filter(campo => 
        campo.clave.trim() && campo.valor.trim()
      );

      const historiaCompleta: HistoriaClinica = {
        ...this.historiaClinica,
        campo_dinamico_1_clave: camposCompletos[0]?.clave || undefined,
        campo_dinamico_1_valor: camposCompletos[0]?.valor || undefined,
        campo_dinamico_2_clave: camposCompletos[1]?.clave || undefined,
        campo_dinamico_2_valor: camposCompletos[1]?.valor || undefined,
        campo_dinamico_3_clave: camposCompletos[2]?.clave || undefined,
        campo_dinamico_3_valor: camposCompletos[2]?.valor || undefined
      };

      await this.historiaClinicaService.crearHistoriaClinica(historiaCompleta);
      this.toastService.success('✅ Historia clínica guardada correctamente');
      this.cerrarModales();
    } catch (error) {
      console.error('Error guardando historia clínica:', error);
      this.toastService.error('❌ Error al guardar la historia clínica');
    } finally {
      this.loading = false;
    }
  }

  // Verificar si un turno ya tiene historia clínica
  async verificarHistoriaExistente(turno: Turno): Promise<boolean> {
    try {
      return await this.historiaClinicaService.existeHistoriaParaTurno(turno.id!);
    } catch (error) {
      console.error('Error verificando historia:', error);
      return false;
    }
  }

  // Mostrar botón de historia clínica solo para turnos realizados
  puedeAgregarHistoria(turno: Turno): boolean {
    return turno.estado === 'realizado';
  }

  // Método para cerrar todos los modales
  cerrarModales() {
    this.mostrarModalCancelar = false;
    this.mostrarModalRechazar = false;
    this.mostrarModalFinalizar = false;
    this.mostrarModalResena = false;
    this.mostrarModalHistoriaClinica = false;
    this.turnoSeleccionado = null;
    this.comentarioCancelacion = '';
    this.comentarioRechazo = '';
    this.resenaConsulta = '';
    this.resetearFormularioHistoria();
  }
}
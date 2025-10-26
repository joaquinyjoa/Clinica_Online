import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TurnosService } from '../../services/turnos.service';
import { ToastService } from '../../services/toast.service';
import { ToastComponent } from '../toast/toast.component';

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

  // Modal properties
  mostrarModalCancelar = false;
  mostrarModalRechazar = false;
  mostrarModalFinalizar = false;
  mostrarModalResena = false;
  turnoSeleccionado: Turno | null = null;

  // Form properties
  comentarioCancelacion = '';
  comentarioRechazo = '';
  resenaConsulta = '';

  private router = inject(Router);
  private turnosService = inject(TurnosService);
  private toastService = inject(ToastService);

  ngOnInit() {
    this.cargarTurnos();
  }

  async cargarTurnos() {
    this.loading = true;
    try {
      // Datos de ejemplo para prueba - reemplazar con llamada real al servicio
      this.turnos = [
        {
          id: 1,
          pacienteid: 101,
          especialistaid: 201,
          pacienteNombre: 'Juan Pérez',
          especialidad: 'Cardiología',
          fecha: '2025-10-27',
          horario: '09:00',
          estado: 'pendiente',
          comentarioEspecialista: ''
        },
        {
          id: 2,
          pacienteid: 102,
          especialistaid: 202,
          pacienteNombre: 'María García',
          especialidad: 'Dermatología',
          fecha: '2025-10-27',
          horario: '10:30',
          estado: 'aceptado',
          comentarioEspecialista: ''
        },
        {
          id: 3,
          pacienteid: 103,
          especialistaid: 201,
          pacienteNombre: 'Carlos López',
          especialidad: 'Cardiología',
          fecha: '2025-10-28',
          horario: '14:00',
          estado: 'realizado',
          comentarioEspecialista: 'Consulta realizada exitosamente. Paciente presenta mejoría notable.'
        },
        {
          id: 4,
          pacienteid: 104,
          especialistaid: 203,
          pacienteNombre: 'Ana Rodríguez',
          especialidad: 'Neurología',
          fecha: '2025-10-29',
          horario: '11:15',
          estado: 'cancelado',
          comentarioEspecialista: 'Cancelado por emergencia médica del especialista.'
        }
      ];
      
      // Comentar las líneas de arriba y descomentar la siguiente para usar el servicio real:
      // this.turnos = await this.turnosService.obtenerTurnosEspecialista();
      this.aplicarFiltros();
    } catch (error) {
      console.error('Error cargando turnos:', error);
      this.toastService.error('Error al cargar los turnos');
    } finally {
      this.loading = false;
    }
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

  aceptarTurno(turno: Turno) {
    this.loading = true;
    turno.estado = 'aceptado';
    this.toastService.success('✅ Turno aceptado correctamente');
    this.loading = false;
    // Aquí podrías agregar la lógica para actualizar en la base de datos
  }

  rechazarTurno() {
    if (!this.comentarioRechazo.trim()) {
      this.toastService.warning('⚠️ Debes proporcionar un motivo para rechazar el turno');
      return;
    }

    if (this.turnoSeleccionado) {
      this.loading = true;
      this.turnoSeleccionado.estado = 'rechazado';
      this.turnoSeleccionado.comentarioEspecialista = this.comentarioRechazo;
      this.toastService.success('❌ Turno rechazado');
      this.cerrarModales();
      this.loading = false;
      // Aquí podrías agregar la lógica para actualizar en la base de datos
    }
  }

  cancelarTurno() {
    if (!this.comentarioCancelacion.trim()) {
      this.toastService.warning('⚠️ Debes proporcionar un motivo para cancelar el turno');
      return;
    }

    if (this.turnoSeleccionado) {
      this.loading = true;
      this.turnoSeleccionado.estado = 'cancelado';
      this.turnoSeleccionado.comentarioEspecialista = this.comentarioCancelacion;
      this.toastService.success('🚫 Turno cancelado');
      this.cerrarModales();
      this.loading = false;
      // Aquí podrías agregar la lógica para actualizar en la base de datos
    }
  }

  finalizarTurno() {
    if (!this.resenaConsulta.trim()) {
      this.toastService.warning('⚠️ Debes proporcionar una reseña de la consulta para finalizar el turno');
      return;
    }

    if (this.turnoSeleccionado) {
      this.loading = true;
      this.turnoSeleccionado.estado = 'realizado';
      this.turnoSeleccionado.comentarioEspecialista = this.resenaConsulta;
      this.toastService.success('✅ Turno finalizado correctamente');
      this.cerrarModales();
      this.loading = false;
      // Aquí podrías agregar la lógica para actualizar en la base de datos
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

  // Método para cerrar todos los modales
  cerrarModales() {
    this.mostrarModalCancelar = false;
    this.mostrarModalRechazar = false;
    this.mostrarModalFinalizar = false;
    this.mostrarModalResena = false;
    this.turnoSeleccionado = null;
    this.comentarioCancelacion = '';
    this.comentarioRechazo = '';
    this.resenaConsulta = '';
  }
}
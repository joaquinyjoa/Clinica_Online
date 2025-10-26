import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { ToastService } from '../../services/toast.service';
import { ToastComponent } from '../toast/toast.component';
import { TurnosService } from '../../services/turnos.service';

interface Turno {
  id: number;
  pacienteid: number;
  especialistaid: number;
  pacienteNombre: string;
  especialistaNombre: string;
  especialidad: string;
  fecha: string;
  horario: string;
  estado: 'pendiente' | 'aceptado' | 'realizado' | 'rechazado' | 'cancelado';
  comentarioEspecialista?: string;
}

@Component({
  selector: 'app-turnos-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, MatProgressSpinnerModule, ToastComponent],
  templateUrl: './turnos-admin.component.html',
  styleUrls: ['./turnos-admin.component.scss']
})
export class TurnosAdminComponent implements OnInit {
  turnos: Turno[] = [];
  turnosFiltrados: Turno[] = [];
  loading = false;

  // Filtros
  filtroEspecialidad = '';
  filtroEspecialista = '';

  // Modal properties
  mostrarModalCancelar = false;
  turnoSeleccionado: Turno | null = null;
  comentarioCancelacion = '';

  private router = inject(Router);
  private turnosService = inject(TurnosService);
  private toastService = inject(ToastService);

  ngOnInit() {
    this.cargarTurnos();
  }

  async cargarTurnos() {
    this.loading = true;
    try {
      // Datos de ejemplo para administrador - reemplazar con llamada real al servicio
      this.turnos = [
        {
          id: 1,
          pacienteid: 101,
          especialistaid: 201,
          pacienteNombre: 'Juan Pérez',
          especialistaNombre: 'Dr. García',
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
          especialistaNombre: 'Dra. Martínez',
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
          especialistaNombre: 'Dr. García',
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
          especialistaNombre: 'Dr. Fernández',
          especialidad: 'Neurología',
          fecha: '2025-10-29',
          horario: '11:15',
          estado: 'rechazado',
          comentarioEspecialista: 'Rechazado por incompatibilidad de horarios.'
        },
        {
          id: 5,
          pacienteid: 105,
          especialistaid: 202,
          pacienteNombre: 'Luis Morales',
          especialistaNombre: 'Dra. Martínez',
          especialidad: 'Dermatología',
          fecha: '2025-10-30',
          horario: '16:00',
          estado: 'pendiente',
          comentarioEspecialista: ''
        }
      ];
      
      // Comentar las líneas de arriba y descomentar la siguiente para usar el servicio real:
      // this.turnos = await this.turnosService.obtenerTodosTurnos();
      this.aplicarFiltros();
    } catch (error) {
      console.error('Error cargando turnos:', error);
      this.toastService.error('Error al cargar los turnos de la clínica');
    } finally {
      this.loading = false;
    }
  }

  aplicarFiltros() {
    this.turnosFiltrados = this.turnos.filter(turno => {
      const pasaFiltroEspecialidad = this.filtroEspecialidad === '' || 
        turno.especialidad.toLowerCase().includes(this.filtroEspecialidad.toLowerCase());
      
      const pasaFiltroEspecialista = this.filtroEspecialista === '' || 
        turno.especialistaNombre.toLowerCase().includes(this.filtroEspecialista.toLowerCase());
      
      return pasaFiltroEspecialidad && pasaFiltroEspecialista;
    });
  }

  limpiarFiltros() {
    this.filtroEspecialidad = '';
    this.filtroEspecialista = '';
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

  // Validaciones para acciones del administrador
  puedeCancelar(turno: Turno): boolean {
    // Solo visible si el turno NO fue Aceptado, Realizado o Rechazado
    return turno.estado === 'pendiente';
  }

  // Métodos para modales
  abrirModalCancelar(turno: Turno) {
    this.turnoSeleccionado = turno;
    this.comentarioCancelacion = '';
    this.mostrarModalCancelar = true;
  }

  cerrarModales() {
    this.mostrarModalCancelar = false;
    this.turnoSeleccionado = null;
    this.comentarioCancelacion = '';
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
      this.toastService.success('🚫 Turno cancelado por administrador');
      this.cerrarModales();
      this.loading = false;
      // Aquí podrías agregar la lógica para actualizar en la base de datos
    }
  }

  volver() {
    this.router.navigate(['/panel-admin']);
  }
}
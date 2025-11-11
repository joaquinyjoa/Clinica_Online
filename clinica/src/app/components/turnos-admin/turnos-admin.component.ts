import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { ToastService } from '../../services/toast.service';
import { ToastComponent } from '../toast/toast.component';
import { TurnosService, Turno } from '../../services/turnos.service';
import { NavigationService } from '../../services/navigation.service';

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
  private navigationService = inject(NavigationService);

  ngOnInit() {
    this.cargarTurnos();
  }

  async cargarTurnos() {
    this.loading = true;
    try {
      // Cargar turnos reales desde la base de datos
      this.turnos = await this.turnosService.obtenerTodosTurnos();
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
        (turno.especialistaNombre || '').toLowerCase().includes(this.filtroEspecialista.toLowerCase());
      
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

  irASolicitarTurno() {
    this.toastService.info('📅 Accediendo a solicitar turno...');
    this.navigationService.navigateWithSpinner('/solicitar-turno', (loading) => {
      this.loading = loading;
    });
  }
}
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { ToastService } from '../../services/toast.service';
import { ToastComponent } from '../toast/toast.component';
import { EmpleadosService } from '../../services/empleados.service';
import { PacientesService } from '../../services/pacientes.service';

@Component({
  selector: 'app-solicitar-turno',
  standalone: true,
  imports: [CommonModule, FormsModule, MatProgressSpinnerModule, ToastComponent],
  templateUrl: './solicitar-turno.component.html',
  styleUrls: ['./solicitar-turno.component.scss']
})
export class SolicitarTurnoComponent implements OnInit {
  loading = false;
  esAdmin = false;
  usuarioActual: any = null;

  // Propiedades del turno
  especialidadSeleccionada = '';
  especialistaSeleccionado = '';
  fechaSeleccionada = '';
  horarioSeleccionado = '';
  pacienteSeleccionado = ''; // Solo para admin

  private router = inject(Router);
  private toastService = inject(ToastService);
  private empleadosService = inject(EmpleadosService);
  private pacientesService = inject(PacientesService);

  ngOnInit() {
    this.detectarTipoUsuario();
  }

  detectarTipoUsuario() {
    // Obtener usuario actual desde el servicio
    this.usuarioActual = this.empleadosService.usuarioActual;
    
    if (this.usuarioActual) {
      // Es un empleado/admin
      this.esAdmin = this.usuarioActual.especialidad?.toLowerCase() === 'administrador';
    } else {
      // Verificar si es paciente (aquí puedes agregar lógica para obtener paciente actual)
      this.esAdmin = false;
    }

    // Mensaje de bienvenida según el tipo de usuario
    if (this.esAdmin) {
      this.toastService.info('👨‍💼 Modo administrador: Puedes solicitar turnos para cualquier paciente');
    } else {
      this.toastService.info('👤 Solicitando turno como paciente');
    }
  }

  volver() {
    if (this.esAdmin) {
      this.router.navigate(['/panel-admin']);
    } else {
      this.router.navigate(['/']);
    }
  }

  // Métodos placeholder que implementaremos en las siguientes tareas
  seleccionarEspecialidad(especialidad: string) {
    this.especialidadSeleccionada = especialidad;
    this.especialistaSeleccionado = '';
    this.fechaSeleccionada = '';
    this.horarioSeleccionado = '';
  }

  seleccionarEspecialista(especialista: string) {
    this.especialistaSeleccionado = especialista;
    this.fechaSeleccionada = '';
    this.horarioSeleccionado = '';
  }

  seleccionarFecha(fecha: string) {
    this.fechaSeleccionada = fecha;
    this.horarioSeleccionado = '';
  }

  seleccionarHorario(horario: string) {
    this.horarioSeleccionado = horario;
  }

  confirmarTurno() {
    // Implementaremos esto en la tarea 8
    this.toastService.info('🚧 Funcionalidad en desarrollo...');
  }
}
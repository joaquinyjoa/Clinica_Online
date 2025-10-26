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

  // Datos disponibles
  especialidades: string[] = [
    'Cardiología',
    'Dermatología',
    'Neurología',
    'Pediatría',
    'Traumatología',
    'Oftalmología',
    'Psiquiatría',
    'Ginecología',
    'Urología',
    'Endocrinología'
  ];
  
  especialistasDisponibles: any[] = [];
  especialistasFiltrados: any[] = [];
  fechasDisponibles: any[] = [];
  horariosDisponibles: any[] = [];
  pacientesDisponibles: any[] = [];

  // Propiedades del turno
  especialidadSeleccionada = '';
  especialistaSeleccionado: any = null;
  fechaSeleccionada = '';
  horarioSeleccionado = '';
  pacienteSeleccionado: any = null; // Solo para admin

  private router = inject(Router);
  private toastService = inject(ToastService);
  private empleadosService = inject(EmpleadosService);
  private pacientesService = inject(PacientesService);

  ngOnInit() {
    this.detectarTipoUsuario();
    this.cargarEspecialistas();
    if (this.esAdmin) {
      this.cargarPacientes();
    }
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

  async cargarEspecialistas() {
    this.loading = true;
    try {
      // Obtener todos los empleados
      const empleados = await this.empleadosService.obtenerTodos();
      // Filtrar solo especialistas aprobados (no administradores)
      this.especialistasDisponibles = empleados.filter(
        emp => emp.especialidad && 
               emp.especialidad.toLowerCase() !== 'administrador' &&
               emp.aprobado === true
      );
    } catch (error) {
      console.error('Error al cargar especialistas:', error);
      this.toastService.error('Error al cargar especialistas disponibles');
    } finally {
      this.loading = false;
    }
  }

  async cargarPacientes() {
    this.loading = true;
    try {
      // Obtener todos los pacientes desde el servicio
      this.pacientesDisponibles = await this.pacientesService.obtenerTodos();
    } catch (error) {
      console.error('Error al cargar pacientes:', error);
      this.toastService.error('Error al cargar pacientes disponibles');
    } finally {
      this.loading = false;
    }
  }

  generarFechasDisponibles() {
    const fechas = [];
    const hoy = new Date();
    
    for (let i = 1; i <= 15; i++) { // Comenzar desde mañana
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + i);
      
      // Excluir domingos (0 = domingo)
      if (fecha.getDay() !== 0) {
        const fechaObj = {
          fecha: fecha,
          fechaString: fecha.toISOString().split('T')[0], // YYYY-MM-DD
          diaSemana: fecha.toLocaleDateString('es-ES', { weekday: 'long' }),
          diaMes: fecha.getDate(),
          mes: fecha.toLocaleDateString('es-ES', { month: 'long' }),
          disponible: true // Por ahora todas disponibles, luego verificaremos con turnos
        };
        fechas.push(fechaObj);
      }
    }
    
    this.fechasDisponibles = fechas;
  }

  generarHorariosDisponibles() {
    const horarios = [];
    
    // Horarios de mañana (8:00 - 12:00)
    for (let hora = 8; hora < 12; hora++) {
      for (let minutos = 0; minutos < 60; minutos += 30) { // Cada 30 minutos
        const horarioString = `${hora.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
        horarios.push({
          hora: horarioString,
          periodo: 'Mañana',
          disponible: true // Por ahora todos disponibles, luego verificaremos con turnos ocupados
        });
      }
    }
    
    // Horarios de tarde (14:00 - 18:00)
    for (let hora = 14; hora < 18; hora++) {
      for (let minutos = 0; minutos < 60; minutos += 30) { // Cada 30 minutos
        const horarioString = `${hora.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
        horarios.push({
          hora: horarioString,
          periodo: 'Tarde',
          disponible: true // Por ahora todos disponibles, luego verificaremos con turnos ocupados
        });
      }
    }
    
    this.horariosDisponibles = horarios;
  }

  volver() {
    if (this.esAdmin) {
      this.router.navigate(['/panel-admin']);
    } else {
      this.router.navigate(['/']);
    }
  }

  // Métodos para selección de turno
  seleccionarEspecialidad(especialidad: string) {
    this.especialidadSeleccionada = especialidad;
    // Resetear selecciones posteriores
    this.especialistaSeleccionado = null;
    this.fechaSeleccionada = '';
    this.horarioSeleccionado = '';
    
    // Filtrar especialistas por especialidad
    this.especialistasFiltrados = this.especialistasDisponibles.filter(
      esp => esp.especialidad === especialidad
    );
    
    this.toastService.success(`✅ Especialidad seleccionada: ${especialidad}`);
    
    if (this.especialistasFiltrados.length === 0) {
      this.toastService.warning(`⚠️ No hay especialistas disponibles para ${especialidad}`);
    } else {
      this.toastService.info(`👨‍⚕️ ${this.especialistasFiltrados.length} especialista(s) disponible(s)`);
    }
  }

  seleccionarEspecialista(especialista: any) {
    this.especialistaSeleccionado = especialista;
    this.fechaSeleccionada = '';
    this.horarioSeleccionado = '';
    
    // Generar fechas disponibles cuando se selecciona especialista
    this.generarFechasDisponibles();
    
    const nombreCompleto = `${especialista.nombre} ${especialista.apellido}`;
    this.toastService.success(`✅ Especialista seleccionado: Dr/a. ${nombreCompleto}`);
    this.toastService.info(`📅 Fechas disponibles generadas (próximos 15 días, sin domingos)`);
  }

  seleccionarFecha(fechaObj: any) {
    this.fechaSeleccionada = fechaObj.fechaString;
    this.horarioSeleccionado = '';
    
    // Generar horarios disponibles cuando se selecciona fecha
    this.generarHorariosDisponibles();
    
    const fechaFormateada = `${fechaObj.diaSemana} ${fechaObj.diaMes} de ${fechaObj.mes}`;
    this.toastService.success(`✅ Fecha seleccionada: ${fechaFormateada}`);
    this.toastService.info(`🕐 Horarios disponibles generados (8:00-12:00 y 14:00-18:00)`);
  }

  obtenerFechaSeleccionadaFormateada(): string {
    if (!this.fechaSeleccionada) return '';
    const fechaObj = this.fechasDisponibles.find(f => f.fechaString === this.fechaSeleccionada);
    if (!fechaObj) return this.fechaSeleccionada;
    return `${fechaObj.diaSemana} ${fechaObj.diaMes} de ${fechaObj.mes}`;
  }

  obtenerHorariosManha(): any[] {
    return this.horariosDisponibles.filter(h => h.periodo === 'Mañana');
  }

  obtenerHorariosTarde(): any[] {
    return this.horariosDisponibles.filter(h => h.periodo === 'Tarde');
  }

  seleccionarHorario(horario: any) {
    this.horarioSeleccionado = horario.hora;
    this.toastService.success(`✅ Horario seleccionado: ${horario.hora} (${horario.periodo})`);
  }

  seleccionarPaciente(paciente: any) {
    this.pacienteSeleccionado = paciente;
    const nombreCompleto = `${paciente.nombre} ${paciente.apellido}`;
    this.toastService.success(`✅ Paciente seleccionado: ${nombreCompleto}`);
  }

  confirmarTurno() {
    // Implementaremos esto en la tarea 8
    this.toastService.info('🚧 Funcionalidad en desarrollo...');
  }
}
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { ToastService } from '../../services/toast.service';
import { ToastComponent } from '../toast/toast.component';
import { EmpleadosService } from '../../services/empleados.service';
import { PacientesService } from '../../services/pacientes.service';
import { TurnosService } from '../../services/turnos.service';

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

  // Flujo paso a paso
  pasoActual = 1;

  // Datos disponibles
  especialidades: string[] = [];
  profesionalesDisponibles: any[] = [];
  pacientesDisponibles: any[] = [];

  // Propiedades del turno
  especialidadSeleccionada = '';
  profesionalSeleccionado: any = null;
  turnosDisponibles: any[] = [];
  turnoSeleccionado: any = null;
  pacienteSeleccionado: any = null; // Solo para admin

  private router = inject(Router);
  private toastService = inject(ToastService);
  private empleadosService = inject(EmpleadosService);
  private pacientesService = inject(PacientesService);
  private turnosService = inject(TurnosService);

  ngOnInit() {
    this.detectarTipoUsuario();
    this.cargarProfesionales();
    if (this.esAdmin) {
      this.cargarPacientes();
    }
  }

  detectarTipoUsuario() {
    // Obtener usuario actual desde el servicio de empleados
    this.usuarioActual = this.empleadosService.usuarioActual;
    
    if (this.usuarioActual) {
      // Es un empleado/admin
      this.esAdmin = this.usuarioActual.especialidad?.toLowerCase() === 'administrador';
    } else {
      // Verificar si es paciente
      const pacienteActual = this.pacientesService.usuarioActual;
      if (pacienteActual) {
        this.usuarioActual = pacienteActual;
        this.esAdmin = false;
      } else {
        // No hay usuario logueado
        this.toastService.error('❌ Debes iniciar sesión para solicitar turnos');
        this.router.navigate(['/login']);
        return;
      }
    }

    // Mensaje de bienvenida según el tipo de usuario
    if (this.esAdmin) {
      this.toastService.info('👨‍💼 Modo administrador: Puedes solicitar turnos para cualquier paciente');
    } else {
      this.toastService.info('👤 Solicitando turno como paciente');
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

  volver() {
    if (this.esAdmin) {
      this.router.navigate(['/panel-admin']);
    } else {
      this.router.navigate(['/']);
    }
  }

  // FUNCIONES DEL NUEVO FLUJO DE 3 PASOS

  seleccionarPaciente(paciente: any) {
    this.pacienteSeleccionado = paciente;
    const nombreCompleto = `${paciente.nombre} ${paciente.apellido}`;
    this.toastService.success(`✅ Paciente seleccionado: ${nombreCompleto}`);
  }

  async confirmarTurno() {
    // Validar que todos los campos estén completos
    if (!this.validarDatosCompletos()) {
      return;
    }

    this.loading = true;
    
    try {
      // Crear objeto turno con los campos exactos de la base de datos
      const pacienteId = this.esAdmin ? this.pacienteSeleccionado.id : this.usuarioActual.id;
      
      // Log de depuración
      console.log('Datos del turno:', {
        esAdmin: this.esAdmin,
        pacienteSeleccionado: this.pacienteSeleccionado,
        usuarioActual: this.usuarioActual,
        pacienteId: pacienteId
      });

      if (!pacienteId) {
        this.toastService.error('❌ Error: No se pudo determinar el ID del paciente');
        this.loading = false;
        return;
      }

      const turno = {
        especialidad: this.especialidadSeleccionada,
        especialistaid: this.profesionalSeleccionado.id,
        fecha: this.turnoSeleccionado.fechaString,
        horario: this.turnoSeleccionado.horaString,
        pacienteid: pacienteId,
        estado: 'pendiente' as const,
        comentariopaciente: '',
        comentarioespecialista: ''
      };

      console.log('Objeto turno a enviar:', turno);

      // Guardar turno usando el servicio
      await this.turnosService.crearTurno(turno);
      
      this.toastService.success('✅ Turno creado exitosamente');
      this.toastService.info('� Se ha enviado una confirmación por email');
      
      // Resetear formulario
      this.resetearFormulario();
      
      // Redirigir según el tipo de usuario
      setTimeout(() => {
        if (this.esAdmin) {
          this.router.navigate(['/panel-admin']);
        } else {
          this.router.navigate(['/mis-turnos']);
        }
      }, 2000);
      
    } catch (error) {
      console.error('Error al crear turno:', error);
      this.toastService.error('❌ Error al crear el turno. Intenta nuevamente.');
    } finally {
      this.loading = false;
    }
  }

  private validarDatosCompletos(): boolean {
    if (!this.profesionalSeleccionado) {
      this.toastService.warning('⚠️ Selecciona un profesional');
      return false;
    }
    
    if (!this.especialidadSeleccionada) {
      this.toastService.warning('⚠️ Selecciona una especialidad');
      return false;
    }
    
    if (!this.turnoSeleccionado) {
      this.toastService.warning('⚠️ Selecciona una fecha y horario');
      return false;
    }
    
    if (this.esAdmin && !this.pacienteSeleccionado) {
      this.toastService.warning('⚠️ Selecciona un paciente');
      return false;
    }

    if (!this.esAdmin && !this.usuarioActual?.id) {
      this.toastService.error('❌ No se puede identificar el paciente. Inicia sesión nuevamente.');
      return false;
    }
    
    return true;
  }

  private resetearFormulario() {
    this.pasoActual = 1;
    this.profesionalSeleccionado = null;
    this.especialidadSeleccionada = '';
    this.turnoSeleccionado = null;
    this.turnosDisponibles = [];
    if (this.esAdmin) {
      this.pacienteSeleccionado = null;
    }
  }

  // MÉTODOS PARA EL NUEVO FLUJO
  async cargarProfesionales() {
    this.loading = true;
    try {
      const empleados = await this.empleadosService.obtenerTodos();
      this.profesionalesDisponibles = empleados.filter(
        emp => emp.especialidad && 
               emp.especialidad.toLowerCase() !== 'administrador' &&
               emp.aprobado === true
      );
    } catch (error) {
      console.error('Error al cargar profesionales:', error);
      this.toastService.error('Error al cargar profesionales disponibles');
    } finally {
      this.loading = false;
    }
  }

  seleccionarProfesional(profesional: any) {
    this.profesionalSeleccionado = profesional;
    this.pasoActual = 2;
    
    // Cargar especialidades del profesional
    this.especialidades = this.profesionalSeleccionado.especialidades || [this.profesionalSeleccionado.especialidad];
    
    const nombreCompleto = `${profesional.nombre} ${profesional.apellido}`;
    this.toastService.success(`✅ Profesional seleccionado: Dr/a. ${nombreCompleto}`);
    this.toastService.info(`🔧 Cargando especialidades disponibles...`);
  }

  seleccionarEspecialidad(especialidad: string) {
    this.especialidadSeleccionada = especialidad;
    this.pasoActual = 3;
    this.cargarTurnosDisponibles();
    this.toastService.success(`✅ Especialidad seleccionada: ${especialidad}`);
  }

  volverPasoAnterior() {
    if (this.pasoActual > 1) {
      this.pasoActual--;
      if (this.pasoActual === 1) {
        this.profesionalSeleccionado = null;
      } else if (this.pasoActual === 2) {
        this.especialidadSeleccionada = '';
        this.turnoSeleccionado = null;
      }
    }
  }

  // Paso 2: Ir a especialidad
  // Cargar turnos disponibles
  async cargarTurnosDisponibles() {
    this.loading = true;
    try {
      // Obtener horarios del especialista desde la base de datos
      const horariosEspecialista = await this.turnosService.obtenerHorariosEspecialista(
        this.profesionalSeleccionado.id
      );

      // Obtener turnos existentes del profesional para filtrar disponibilidad
      const turnosExistentes = await this.turnosService.obtenerTurnosEspecialista(
        this.profesionalSeleccionado.id
      );

      // Generar todos los turnos posibles basados en los horarios reales del especialista
      const turnosPosibles = this.generarTurnosDisponibles(horariosEspecialista);

      // Filtrar turnos que no estén ocupados
      this.turnosDisponibles = this.filtrarTurnosDisponibles(turnosPosibles, turnosExistentes);

      console.log('Horarios especialista:', horariosEspecialista);
      console.log('Turnos existentes:', turnosExistentes);
      console.log('Turnos posibles generados:', turnosPosibles.length);
      console.log('Turnos filtrados disponibles:', this.turnosDisponibles.length);

      if (this.turnosDisponibles.length === 0) {
        if (turnosPosibles.length === 0) {
          this.toastService.warning('⚠️ El especialista no tiene horarios configurados');
        } else {
          const turnosOcupados = turnosPosibles.length - this.turnosDisponibles.length;
          this.toastService.warning(`⚠️ No hay turnos disponibles. ${turnosOcupados} horarios ya están ocupados o confirmados`);
        }
      } else {
        const turnosOcupados = turnosPosibles.length - this.turnosDisponibles.length;
        this.toastService.info(`📅 ${this.turnosDisponibles.length} turnos disponibles (${turnosOcupados} ocupados)`);
      }
    } catch (error) {
      console.error('Error al cargar turnos disponibles:', error);
      this.toastService.error('❌ Error al cargar turnos disponibles');
      this.turnosDisponibles = [];
    } finally {
      this.loading = false;
    }
  }

  generarTurnosDisponibles(horariosEspecialista: any[]) {
    const turnos = [];
    const hoy = new Date();
    
    // Si no hay horarios configurados, retornar array vacío
    if (!horariosEspecialista || horariosEspecialista.length === 0) {
      console.warn('No hay horarios configurados para este especialista');
      return [];
    }

    // Mapear los días de la semana
    const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    
    for (let i = 1; i <= 15; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + i);
      
      const diaSemana = diasSemana[fecha.getDay()];
      
      // Buscar si el especialista trabaja este día
      const horarioDia = horariosEspecialista.find(h => h.dia_semana === diaSemana);
      
      if (horarioDia && horarioDia.activo) {
        // Generar turnos de mañana si está habilitado
        if (horarioDia.turno_manana) {
          for (let hora = 8; hora < 12; hora++) {
            for (let minutos = 0; minutos < 60; minutos += 30) {
              const fechaTurno = new Date(fecha);
              fechaTurno.setHours(hora, minutos, 0, 0);
              
              turnos.push({
                fechaString: fecha.toISOString().split('T')[0],
                horaString: `${hora.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`,
                formatoCompleto: this.formatearFechaTurno(fechaTurno)
              });
            }
          }
        }
        
        // Generar turnos de tarde si está habilitado
        if (horarioDia.turno_tarde) {
          for (let hora = 14; hora < 18; hora++) {
            for (let minutos = 0; minutos < 60; minutos += 30) {
              const fechaTurno = new Date(fecha);
              fechaTurno.setHours(hora, minutos, 0, 0);
              
              turnos.push({
                fechaString: fecha.toISOString().split('T')[0],
                horaString: `${hora.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`,
                formatoCompleto: this.formatearFechaTurno(fechaTurno)
              });
            }
          }
        }
      }
    }
    
    return turnos;
  }

  filtrarTurnosDisponibles(turnosPosibles: any[], turnosExistentes: any[]): any[] {
    console.log('=== FILTRADO DE TURNOS ===');
    console.log('Especialidad seleccionada:', this.especialidadSeleccionada);
    console.log('Turnos existentes encontrados:', turnosExistentes);
    console.log('Total turnos posibles:', turnosPosibles.length);

    return turnosPosibles.filter(turno => {
      // Buscar si existe un turno en la misma fecha, horario y especialidad
      const turnoOcupado = turnosExistentes.find(existente => {
        const mismafecha = existente.fecha === turno.fechaString;
        // Normalizar horarios para comparación (algunos vienen con :00 segundos)
        const horarioExistente = existente.horario.includes(':') ? existente.horario.substring(0, 5) : existente.horario;
        const horarioTurno = turno.horaString;
        const mismoHorario = horarioExistente === horarioTurno;
        
        // Normalizar especialidades para comparación (quitar espacios y convertir a minúsculas)
        const especialidadSeleccionada = this.especialidadSeleccionada.trim().toLowerCase();
        const especialidadExistente = existente.especialidad.trim().toLowerCase();
        const mismaEspecialidad = especialidadSeleccionada === especialidadExistente;
        
        // Solo considerar como ocupado si el turno está:
        // - pendiente (esperando confirmación del especialista)
        // - aceptado (confirmado por el especialista)
        // Los turnos cancelados, rechazados o realizados liberan el horario
        const estadosQueBloquean = ['pendiente', 'aceptado'];
        const bloqueaHorario = estadosQueBloquean.includes(existente.estado);
        
        // Debug log para verificar el filtrado
        if (mismafecha && mismoHorario) {
          console.log(`🔍 COMPARANDO TURNO:
            Fecha: ${turno.fechaString} vs ${existente.fecha} ✓
            Horario: ${horarioTurno} vs ${horarioExistente} ✓
            Especialidad Original: "${this.especialidadSeleccionada}" vs "${existente.especialidad}"
            Especialidad Normalizada: "${especialidadSeleccionada}" vs "${especialidadExistente}" ${mismaEspecialidad ? '✓' : '❌'}
            Estado: ${existente.estado} - Bloquea: ${bloqueaHorario}
            RESULTADO: ${mismaEspecialidad && bloqueaHorario ? 'BLOQUEADO' : 'DISPONIBLE'}
            `);
        }
        
        return mismafecha && mismoHorario && mismaEspecialidad && bloqueaHorario;
      });

      // Solo incluir el turno si no está ocupado
      return !turnoOcupado;
    });
  }

  obtenerImagenEspecialidad(especialidad: string): string {
    const imagenesEspecialidades: { [key: string]: string } = {
      'cardiologia': 'assets/especialidades/cardiologia.svg',
      'dermatologia': 'assets/especialidades/dermatologia.svg',
      'neurologia': 'assets/especialidades/neurologia.svg',
      'pediatria': 'assets/especialidades/pediatria.svg',
      'traumatologia': 'assets/especialidades/traumatologia.svg',
      'ginecologia': 'assets/especialidades/ginecologia.svg',
      'oftalmologia': 'assets/especialidades/oftalmologia.svg',
      'psiquiatria': 'assets/especialidades/psiquiatria.svg',
      'medicina general': 'assets/especialidades/medicina-general.svg',
      'urologia': 'assets/especialidades/urologia.svg'
    };
    
    return imagenesEspecialidades[especialidad.toLowerCase()] || 'assets/especialidades/default.svg';
  }

  formatearFechaTurno(fechaTurno: Date): string {
    const year = fechaTurno.getFullYear();
    const month = (fechaTurno.getMonth() + 1).toString().padStart(2, '0');
    const day = fechaTurno.getDate().toString().padStart(2, '0');
    const hours = fechaTurno.getHours();
    const minutes = fechaTurno.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    
    return `${year}-${month}-${day} ${displayHours}:${minutes} ${ampm}`;
  }

  // Seleccionar turno completo
  seleccionarTurnoCompleto(turno: any) {
    this.turnoSeleccionado = turno;
    this.toastService.success(`✅ Turno seleccionado: ${turno.formatoCompleto}`);
    console.log('Turno seleccionado:', {
      fecha: turno.fechaString,
      hora: turno.horaString,
      formato: turno.formatoCompleto,
      profesional: this.profesionalSeleccionado.nombre,
      especialidad: this.especialidadSeleccionada
    });
  }
}
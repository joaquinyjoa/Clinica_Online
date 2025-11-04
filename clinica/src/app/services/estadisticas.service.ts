import { Injectable } from '@angular/core';
import { supabase } from './supabase.service';
import { Observable, from, map, forkJoin } from 'rxjs';

export interface LogIngreso {
  id?: number;
  usuario_id: string;
  usuario_email: string;
  usuario_nombre: string;
  usuario_tipo: 'administrador' | 'especialista' | 'paciente';
  fecha_ingreso: string;
  hora_ingreso: string;
  created_at?: string;
}

export interface EstadisticaTurnos {
  especialidad: string;
  cantidad: number;
  porcentaje?: number;
}

export interface TurnosPorDia {
  fecha: string;
  cantidad: number;
}

export interface TurnosPorMedico {
  medico_id: string;
  medico_nombre: string;
  especialidad: string;
  cantidad_solicitados?: number;
  cantidad_finalizados?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EstadisticasService {

  constructor() {}

  // ========== LOG DE INGRESOS ==========
  
  /**
   * Registra el ingreso de un usuario al sistema
   */
  registrarIngreso(usuario: any): Observable<any> {
    const logIngreso: LogIngreso = {
      usuario_id: usuario.id,
      usuario_email: usuario.email,
      usuario_nombre: usuario.nombre || usuario.email,
      usuario_tipo: usuario.tipo || 'paciente',
      fecha_ingreso: new Date().toISOString().split('T')[0],
      hora_ingreso: new Date().toLocaleTimeString('es-ES'),
      created_at: new Date().toISOString()
    };

    return from(
      supabase
        .from('logs_ingresos')
        .insert([logIngreso])
    ).pipe(
      map(response => {
        if (response.error) {
          console.error('Error al registrar ingreso:', response.error);
          throw response.error;
        }
        return response.data;
      })
    );
  }

  /**
   * Obtiene el log completo de ingresos al sistema
   */
  obtenerLogIngresos(fechaInicio?: string, fechaFin?: string): Observable<LogIngreso[]> {
    let query = supabase
      .from('logs_ingresos')
      .select('*')
      .order('created_at', { ascending: false });

    if (fechaInicio) {
      query = query.gte('fecha_ingreso', fechaInicio);
    }
    if (fechaFin) {
      query = query.lte('fecha_ingreso', fechaFin);
    }

    return from(query).pipe(
      map(response => {
        if (response.error) {
          console.error('Error al obtener log de ingresos:', response.error);
          throw response.error;
        }
        return response.data || [];
      })
    );
  }

  // ========== ESTADÍSTICAS DE TURNOS ==========

  /**
   * Obtiene la cantidad de turnos por especialidad
   */
  obtenerTurnosPorEspecialidad(): Observable<EstadisticaTurnos[]> {
    return from(
      supabase
        .from('turnos')
        .select('especialidad')
    ).pipe(
      map(response => {
        if (response.error) {
          console.error('Error al obtener turnos por especialidad:', response.error);
          throw response.error;
        }

        const turnos = response.data || [];
        const especialidadesCount: { [key: string]: number } = {};

        // Contar turnos por especialidad
        turnos.forEach((turno: any) => {
          const especialidad = turno.especialidad || 'Sin especialidad';
          especialidadesCount[especialidad] = (especialidadesCount[especialidad] || 0) + 1;
        });

        const total = turnos.length;
        
        // Convertir a array con porcentajes
        return Object.entries(especialidadesCount).map(([especialidad, cantidad]) => ({
          especialidad,
          cantidad,
          porcentaje: total > 0 ? Math.round((cantidad / total) * 100) : 0
        }));
      })
    );
  }

  /**
   * Obtiene la cantidad de turnos por día
   */
  obtenerTurnosPorDia(fechaInicio?: string, fechaFin?: string): Observable<TurnosPorDia[]> {
    let query = supabase
      .from('turnos')
      .select('fecha');

    if (fechaInicio) {
      query = query.gte('fecha', fechaInicio);
    }
    if (fechaFin) {
      query = query.lte('fecha', fechaFin);
    }

    return from(query).pipe(
      map(response => {
        if (response.error) {
          console.error('Error al obtener turnos por día:', response.error);
          throw response.error;
        }

        const turnos = response.data || [];
        const turnosPorFecha: { [key: string]: number } = {};

        // Contar turnos por fecha
        turnos.forEach((turno: any) => {
          const fecha = turno.fecha || 'Sin fecha';
          turnosPorFecha[fecha] = (turnosPorFecha[fecha] || 0) + 1;
        });

        // Convertir a array ordenado por fecha
        return Object.entries(turnosPorFecha)
          .map(([fecha, cantidad]) => ({ fecha, cantidad }))
          .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
      })
    );
  }

  /**
   * Obtiene turnos solicitados por médico en un período
   */
  obtenerTurnosSolicitadosPorMedico(fechaInicio: string, fechaFin: string): Observable<TurnosPorMedico[]> {
    return from(
      supabase
        .from('turnos')
        .select(`
          especialista_id,
          especialista_nombre,
          especialidad,
          fecha,
          created_at
        `)
        .gte('created_at', fechaInicio)
        .lte('created_at', fechaFin)
    ).pipe(
      map(response => {
        if (response.error) {
          console.error('Error al obtener turnos solicitados por médico:', response.error);
          throw response.error;
        }

        const turnos = response.data || [];
        const medicoStats: { [key: string]: TurnosPorMedico } = {};

        // Agrupar y contar por médico
        turnos.forEach((turno: any) => {
          const medicoId = turno.especialista_id;
          if (!medicoStats[medicoId]) {
            medicoStats[medicoId] = {
              medico_id: medicoId,
              medico_nombre: turno.especialista_nombre || 'Sin nombre',
              especialidad: turno.especialidad || 'Sin especialidad',
              cantidad_solicitados: 0,
              fecha_inicio: fechaInicio,
              fecha_fin: fechaFin
            };
          }
          medicoStats[medicoId].cantidad_solicitados!++;
        });

        return Object.values(medicoStats);
      })
    );
  }

  /**
   * Obtiene turnos finalizados por médico en un período
   */
  obtenerTurnosFinalizadosPorMedico(fechaInicio: string, fechaFin: string): Observable<TurnosPorMedico[]> {
    return from(
      supabase
        .from('turnos')
        .select(`
          especialista_id,
          especialista_nombre,
          especialidad,
          fecha,
          estado,
          updated_at
        `)
        .eq('estado', 'realizado')
        .gte('updated_at', fechaInicio)
        .lte('updated_at', fechaFin)
    ).pipe(
      map(response => {
        if (response.error) {
          console.error('Error al obtener turnos finalizados por médico:', response.error);
          throw response.error;
        }

        const turnos = response.data || [];
        const medicoStats: { [key: string]: TurnosPorMedico } = {};

        // Agrupar y contar por médico
        turnos.forEach((turno: any) => {
          const medicoId = turno.especialista_id;
          if (!medicoStats[medicoId]) {
            medicoStats[medicoId] = {
              medico_id: medicoId,
              medico_nombre: turno.especialista_nombre || 'Sin nombre',
              especialidad: turno.especialidad || 'Sin especialidad',
              cantidad_finalizados: 0,
              fecha_inicio: fechaInicio,
              fecha_fin: fechaFin
            };
          }
          medicoStats[medicoId].cantidad_finalizados!++;
        });

        return Object.values(medicoStats);
      })
    );
  }

  // ========== MÉTODOS AUXILIARES ==========

  /**
   * Obtiene todas las estadísticas en un solo llamado
   */
  obtenerTodasLasEstadisticas(fechaInicio?: string, fechaFin?: string): Observable<any> {
    const ahora = new Date();
    const inicioMes = fechaInicio || new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString().split('T')[0];
    const finMes = fechaFin || new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0).toISOString().split('T')[0];

    return forkJoin({
      logIngresos: this.obtenerLogIngresos(inicioMes, finMes),
      turnosPorEspecialidad: this.obtenerTurnosPorEspecialidad(),
      turnosPorDia: this.obtenerTurnosPorDia(inicioMes, finMes),
      turnosSolicitadosPorMedico: this.obtenerTurnosSolicitadosPorMedico(inicioMes, finMes),
      turnosFinalizadosPorMedico: this.obtenerTurnosFinalizadosPorMedico(inicioMes, finMes)
    });
  }

  /**
   * Crea la tabla de logs si no existe
   */
  async inicializarTablasEstadisticas(): Promise<void> {
    try {
      // Verificar si la tabla logs_ingresos existe, si no, crearla
      const { data, error } = await supabase
        .from('logs_ingresos')
        .select('id')
        .limit(1);

      if (error && error.message.includes('relation "logs_ingresos" does not exist')) {
        console.log('Tabla logs_ingresos no existe, se debe crear manualmente en Supabase');
        // En un entorno real, esto se haría a través de migraciones SQL
      }
    } catch (error) {
      console.error('Error al verificar tablas de estadísticas:', error);
    }
  }
}
import { Injectable } from '@angular/core';
import { supabase } from './supabase.service';

export interface HorarioEspecialista {
  id?: number;
  especialista_id: number;
  dia_semana: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado';
  activo: boolean;
  turno_manana: boolean;
  turno_tarde: boolean;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class HorariosService {
  private table = 'horarios_especialistas';

  constructor() { }

  // Obtener horarios de un especialista
  async obtenerHorariosPorEspecialista(especialistaId: number): Promise<HorarioEspecialista[]> {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('especialista_id', especialistaId);

    if (error) {
      console.error('Error obteniendo horarios:', error);
      throw error;
    }

    return data || [];
  }

  // Guardar/actualizar horarios completos de un especialista
  async guardarHorarios(especialistaId: number, horarios: any): Promise<void> {
    try {
      // Primero eliminar horarios existentes del especialista
      await this.eliminarHorariosPorEspecialista(especialistaId);

      // Convertir estructura de horarios a array de registros
      const horariosArray: Omit<HorarioEspecialista, 'id'>[] = [];
      
      Object.entries(horarios).forEach(([dia, horario]: [string, any]) => {
        if (horario.activo || horario.manana || horario.tarde) {
          horariosArray.push({
            especialista_id: especialistaId,
            dia_semana: dia as any,
            activo: horario.activo,
            turno_manana: horario.manana,
            turno_tarde: horario.tarde
          });
        }
      });

      // Insertar nuevos horarios si hay alguno
      if (horariosArray.length > 0) {
        const { error } = await supabase
          .from(this.table)
          .insert(horariosArray);

        if (error) {
          console.error('Error insertando horarios:', error);
          throw error;
        }
      }

      console.log(`Horarios guardados para especialista ${especialistaId}:`, horariosArray);
    } catch (error) {
      console.error('Error en guardarHorarios:', error);
      throw error;
    }
  }

  // Eliminar horarios de un especialista
  private async eliminarHorariosPorEspecialista(especialistaId: number): Promise<void> {
    const { error } = await supabase
      .from(this.table)
      .delete()
      .eq('especialista_id', especialistaId);

    if (error) {
      console.error('Error eliminando horarios:', error);
      throw error;
    }
  }

  // Verificar si un especialista tiene horarios configurados
  async tieneHorariosConfigurados(especialistaId: number): Promise<boolean> {
    const { data, error } = await supabase
      .from(this.table)
      .select('id')
      .eq('especialista_id', especialistaId)
      .limit(1);

    if (error) {
      console.error('Error verificando horarios:', error);
      return false;
    }

    return (data && data.length > 0) || false;
  }

  // Obtener días disponibles de un especialista (para solicitar turnos)
  async obtenerDiasDisponibles(especialistaId: number): Promise<string[]> {
    const { data, error } = await supabase
      .from(this.table)
      .select('dia_semana')
      .eq('especialista_id', especialistaId)
      .eq('activo', true);

    if (error) {
      console.error('Error obteniendo días disponibles:', error);
      return [];
    }

    return data?.map(h => h.dia_semana) || [];
  }

  // Obtener turnos disponibles de un especialista para un día específico
  async obtenerTurnosDisponibles(especialistaId: number, diaSemana: string): Promise<{ manana: boolean, tarde: boolean }> {
    const { data, error } = await supabase
      .from(this.table)
      .select('turno_manana, turno_tarde')
      .eq('especialista_id', especialistaId)
      .eq('dia_semana', diaSemana)
      .eq('activo', true)
      .single();

    if (error) {
      console.error('Error obteniendo turnos disponibles:', error);
      return { manana: false, tarde: false };
    }

    return {
      manana: data?.turno_manana || false,
      tarde: data?.turno_tarde || false
    };
  }
}
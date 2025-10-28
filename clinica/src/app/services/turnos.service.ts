import { Injectable } from '@angular/core';
import { supabase } from './supabase.service';

export interface Turno {
  id?: number;
  pacienteid: number;
  pacienteNombre?: string; // Campo calculado para la interfaz
  especialistaid: number;
  especialistaNombre?: string; // Campo calculado para la interfaz
  especialidad: string;
  fecha: string; // 'YYYY-MM-DD'
  horario: string; // 'HH:MM'
  estado: 'pendiente' | 'aceptado' | 'realizado' | 'rechazado' | 'cancelado';
  // Campos compatibles con la interfaz existente
  comentarioPaciente?: string; // Alias para comentariopaciente
  comentarioEspecialista?: string; // Alias para comentarioespecialista
  encuestaRealizada?: boolean; // Alias para encuestarealizada
  // Campos reales de la base de datos
  comentariopaciente?: string; 
  comentarioespecialista?: string; 
  encuestarealizada?: boolean; 
  calificacion?: number; // 1-5 estrellas
}

@Injectable({
  providedIn: 'root'
})
export class TurnosService {

  private table = 'turnos';

  constructor() { }

  // Normalizar turnos con información adicional y compatibilidad de campos
  private normalizeTurno(data: any): Turno {
    if (!data) return data;
    
    const normalized = {
      ...data,
      // Mapear campos de DB a interfaz para compatibilidad
      comentarioPaciente: data.comentariopaciente || data.comentarioPaciente || '',
      comentarioEspecialista: data.comentarioespecialista || data.comentarioEspecialista || '',
      encuestaRealizada: data.encuestarealizada || data.encuestaRealizada || false,
      // Mantener los campos originales de DB
      comentariopaciente: data.comentariopaciente || data.comentarioPaciente || '',
      comentarioespecialista: data.comentarioespecialista || data.comentarioEspecialista || '',
      encuestarealizada: data.encuestarealizada || data.encuestaRealizada || false
    } as Turno;
    
    return normalized;
  }

  // Obtener turnos de un paciente específico
  async obtenerTurnosPaciente(pacienteId: number): Promise<Turno[]> {
    // Intento original con nombres de columna corregidos
    const { data, error } = await supabase
      .from(this.table)
      .select(`
        *,
        pacientes:pacienteid (nombre, apellido),
        empleados:especialistaid (nombre, apellido, especialidad)
      `)
      .eq('pacienteid', pacienteId)
      .order('fecha', { ascending: false });

    if (error) throw error;
    
    if (!data) return [];
    
    // Enriquecer con nombres completos
    return data.map((turno: any) => this.normalizeTurno({
      ...turno,
      pacienteNombre: turno.pacientes ? `${turno.pacientes.nombre} ${turno.pacientes.apellido}` : '',
      especialistaNombre: turno.empleados ? `${turno.empleados.nombre} ${turno.empleados.apellido}` : '',
      especialidad: turno.empleados?.especialidad || turno.especialidad
    }));
  }

  // Fallback: consulta simple sin joins para diagnosticar problemas de relación
  async obtenerTurnosPacienteSimple(pacienteId: number): Promise<Turno[]> {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('pacienteid', pacienteId)
      .order('fecha', { ascending: false });

    if (error) throw error;
    if (!data) return [];

    // No podemos enriquecer con nombres (sin join), devolver tal cual
    return data.map((t: any) => this.normalizeTurno(t));
  }

  // Obtener todas las especialidades disponibles (para filtros)
  async obtenerEspecialidades(): Promise<string[]> {
    const { data, error } = await supabase
      .from('empleados')
      .select('especialidad')
      .neq('especialidad', 'administrador');

    if (error) throw error;
    
    if (!data) return [];
    
    const especialidades = [...new Set(data.map(emp => emp.especialidad))];
    return especialidades.filter(Boolean);
  }

  // Obtener especialistas disponibles (para filtros)
  async obtenerEspecialistas(): Promise<{id: number, nombre: string, especialidad: string}[]> {
    const { data, error } = await supabase
      .from('empleados')
      .select('id, nombre, apellido, especialidad')
      .neq('especialidad', 'administrador')
      .eq('aprobado', true)
      .eq('emailVerificado', true);

    if (error) throw error;
    
    if (!data) return [];
    
    return data.map(emp => ({
      id: emp.id,
      nombre: `${emp.nombre} ${emp.apellido}`,
      especialidad: emp.especialidad
    }));
  }

  // Obtener turnos de un especialista específico
  async obtenerTurnosEspecialista(especialistaId?: number): Promise<Turno[]> {
    // Si no se proporciona ID, retorna array vacío
    if (!especialistaId) {
      console.warn('obtenerTurnosEspecialista: No se proporcionó especialistaId');
      return [];
    }

    const { data, error } = await supabase
      .from(this.table)
      .select(`
        *,
        pacientes:pacienteid (nombre, apellido, email, "obraSocial"),
        empleados:especialistaid (nombre, apellido, especialidad)
      `)
      .eq('especialistaid', especialistaId)
      .order('fecha', { ascending: true });

    if (error) throw error;
    
    if (!data) return [];
    
    // Enriquecer con información completa
    return data.map((turno: any) => this.normalizeTurno({
      ...turno,
      pacienteNombre: turno.pacientes ? `${turno.pacientes.nombre} ${turno.pacientes.apellido}` : '',
      especialistaNombre: turno.empleados ? `${turno.empleados.nombre} ${turno.empleados.apellido}` : '',
      especialidad: turno.empleados?.especialidad || turno.especialidad
    }));
  }

  // Método simple para especialistas (fallback)
  async obtenerTurnosEspecialistaSimple(especialistaId: number): Promise<Turno[]> {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('especialistaid', especialistaId)
      .order('fecha', { ascending: false });

    if (error) throw error;
    return data.map(turno => this.normalizeTurno(turno));
  }

  // Cancelar turno (solo si no fue realizado)
  async cancelarTurno(turnoId: number, comentario: string): Promise<Turno> {
    const { data, error } = await supabase
      .from(this.table)
      .update({ 
        estado: 'cancelado',
        comentariopaciente: comentario
      })
      .eq('id', turnoId)
      .select()
      .single();

    if (error) throw error;
    return this.normalizeTurno(data);
  }

  // Completar encuesta
  async completarEncuesta(turnoId: number): Promise<Turno> {
    const { data, error } = await supabase
      .from(this.table)
      .update({ encuestarealizada: true })
      .eq('id', turnoId)
      .select()
      .single();

    if (error) throw error;
    return this.normalizeTurno(data);
  }

  // Calificar atención
  async calificarAtencion(turnoId: number, calificacion: number, comentario: string): Promise<Turno> {
    const { data, error } = await supabase
      .from(this.table)
      .update({ 
        calificacion,
        comentariopaciente: comentario
      })
      .eq('id', turnoId)
      .select()
      .single();

    if (error) throw error;
    return this.normalizeTurno(data);
  }

  // Preparar datos para envío a la base de datos (solo campos válidos)
  private prepararParaDB(turno: any): any {
    const {
      pacienteNombre,
      especialistaNombre,
      comentarioPaciente,
      comentarioEspecialista,
      encuestaRealizada,
      ...turnoLimpio
    } = turno;
    
    // Mapear campos de interfaz a campos de DB si existen
    if (comentarioPaciente !== undefined) {
      turnoLimpio.comentariopaciente = comentarioPaciente;
    }
    if (comentarioEspecialista !== undefined) {
      turnoLimpio.comentarioespecialista = comentarioEspecialista;
    }
    if (encuestaRealizada !== undefined) {
      turnoLimpio.encuestarealizada = encuestaRealizada;
    }
    
    return turnoLimpio;
  }

  // Crear turno (método auxiliar para testing)
  async crearTurno(turno: Turno): Promise<Turno> {
    const turnoParaDB = this.prepararParaDB(turno);
    
    const { data, error } = await supabase
      .from(this.table)
      .insert(turnoParaDB)
      .select()
      .single();

    if (error) throw error;
    return this.normalizeTurno(data[0]);
  }

  // Actualizar solo el estado de un turno
  async actualizarEstado(turnoId: number, nuevoEstado: string): Promise<Turno> {
    const { data, error } = await supabase
      .from(this.table)
      .update({ estado: nuevoEstado })
      .eq('id', turnoId)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('No se pudo actualizar el turno');

    return this.normalizeTurno(data);
  }

  // Actualizar estado con comentario del especialista
  async actualizarEstadoConComentario(turnoId: number, nuevoEstado: string, comentario: string): Promise<Turno> {
    const { data, error } = await supabase
      .from(this.table)
      .update({ 
        estado: nuevoEstado,
        comentarioespecialista: comentario
      })
      .eq('id', turnoId)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('No se pudo actualizar el turno');

    return this.normalizeTurno(data);
  }

  // Finalizar turno con reseña
  async finalizarTurno(turnoId: number, resena: string): Promise<Turno> {
    const { data, error } = await supabase
      .from(this.table)
      .update({ 
        estado: 'realizado',
        comentarioespecialista: resena
      })
      .eq('id', turnoId)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('No se pudo finalizar el turno');

    return this.normalizeTurno(data);
  }

  // Obtener horarios de un especialista desde la tabla horarios_especialistas
  async obtenerHorariosEspecialista(especialistaId: number): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('horarios_especialistas')
        .select('*')
        .eq('especialista_id', especialistaId)
        .eq('activo', true);

      if (error) {
        console.error('Error al obtener horarios del especialista:', error);
        return [];
      }

      console.log(`Horarios encontrados para especialista ${especialistaId}:`, data);
      return data || [];
    } catch (error) {
      console.error('Error en obtenerHorariosEspecialista:', error);
      return [];
    }
  }
}
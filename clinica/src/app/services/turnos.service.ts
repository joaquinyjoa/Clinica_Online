import { Injectable } from '@angular/core';
import { supabase } from './supabase.service';

export interface Turno {
  id?: number;
  pacienteid: number;
  pacienteNombre?: string;
  especialistaid: number;
  especialistaNombre?: string;
  especialidad: string;
  fecha: string; // 'YYYY-MM-DD'
  horario: string; // 'HH:MM'
  estado: 'pendiente' | 'aceptado' | 'realizado' | 'rechazado' | 'cancelado';
  comentarioPaciente?: string; // Para cancelar turno o calificar atención
  comentarioEspecialista?: string; // Reseña del especialista
  encuestaRealizada?: boolean;
  calificacion?: number; // 1-5 estrellas
}

@Injectable({
  providedIn: 'root'
})
export class TurnosService {

  private table = 'turnos';

  constructor() { }

  // Normalizar turnos con información adicional
  private normalizeTurno(data: any): Turno {
    if (!data) return data;
    return {
      ...data,
      encuestaRealizada: data.encuestaRealizada || false
    } as Turno;
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
    // Si no se proporciona ID, retorna datos de prueba
    if (!especialistaId) {
      return [
        {
          id: 1,
          pacienteid: 1,
          pacienteNombre: 'Juan Pérez',
          especialistaid: 1,
          especialistaNombre: 'Dr. García',
          especialidad: 'Cardiología',
          fecha: '2025-10-22',
          horario: '10:00',
          estado: 'pendiente',
          comentarioPaciente: '',
          comentarioEspecialista: ''
        },
        {
          id: 2,
          pacienteid: 2,
          especialistaid: 1,
          pacienteNombre: 'María López',
          especialistaNombre: 'Dr. García',
          especialidad: 'Cardiología',
          fecha: '2025-10-23',
          horario: '11:00',
          estado: 'aceptado'
        }
      ];
    }

    const { data, error } = await supabase
      .from(this.table)
      .select(`
        *,
        pacientes:pacienteid (nombre, apellido, email, edad, obraSocial),
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

  // Cancelar turno (solo si no fue realizado)
  async cancelarTurno(turnoId: number, comentario: string): Promise<Turno> {
    const { data, error } = await supabase
      .from(this.table)
      .update({ 
        estado: 'cancelado',
        comentarioPaciente: comentario
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
      .update({ encuestaRealizada: true })
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
        comentarioPaciente: comentario
      })
      .eq('id', turnoId)
      .select()
      .single();

    if (error) throw error;
    return this.normalizeTurno(data);
  }

  // Crear turno (método auxiliar para testing)
  async crearTurno(turno: Turno): Promise<Turno> {
    const { data, error } = await supabase
      .from(this.table)
      .insert(turno)
      .select()
      .single();

    if (error) throw error;
    return this.normalizeTurno(data);
  }
}
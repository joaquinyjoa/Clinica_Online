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
  // Historia clínica (solo para turnos realizados)
  historiaClinica?: {
    id?: number;
    altura?: number;
    peso?: number;
    temperatura?: number;
    presion?: string;
    campo_dinamico_1_clave?: string;
    campo_dinamico_1_valor?: string;
    campo_dinamico_2_clave?: string;
    campo_dinamico_2_valor?: string;
    campo_dinamico_3_clave?: string;
    campo_dinamico_3_valor?: string;
    created_at?: string;
    updated_at?: string;
  } | null;
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

  // Obtener todos los turnos (para administradores)
  async obtenerTodosTurnos(): Promise<Turno[]> {
    const { data, error } = await supabase
      .from(this.table)
      .select(`
        *,
        pacientes:pacienteid (nombre, apellido),
        empleados:especialistaid (nombre, apellido, especialidad)
      `)
      .order('fecha', { ascending: false });

    if (error) throw error;
    
    if (!data) return [];
    
    // Enriquecer con nombres completos
    return data.map((turno: any) => {
      const normalizedTurno = this.normalizeTurno(turno);
      normalizedTurno.pacienteNombre = `${turno.pacientes?.nombre || ''} ${turno.pacientes?.apellido || ''}`.trim();
      normalizedTurno.especialistaNombre = `Dr./Dra. ${turno.empleados?.nombre || ''} ${turno.empleados?.apellido || ''}`.trim();
      return normalizedTurno;
    });
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
    
    // Enriquecer con nombres completos y historia clínica
    const turnosEnriquecidos = await Promise.all(data.map(async (turno: any) => {
      const turnoNormalizado = this.normalizeTurno({
        ...turno,
        pacienteNombre: turno.pacientes ? `${turno.pacientes.nombre} ${turno.pacientes.apellido}` : '',
        especialistaNombre: turno.empleados ? `${turno.empleados.nombre} ${turno.empleados.apellido}` : '',
        especialidad: turno.empleados?.especialidad || turno.especialidad
      });

      // Cargar historia clínica si el turno está realizado
      if (turno.estado === 'realizado' && turno.id) {
        try {
          // Obtener todos los campos de historia clínica según la estructura real
          const { data: historiaData, error: historiaError } = await supabase
            .from('historia_clinica')
            .select('id, altura, peso, temperatura, presion, campo_dinamico_1_clave, campo_dinamico_1_valor, campo_dinamico_2_clave, campo_dinamico_2_valor, campo_dinamico_3_clave, campo_dinamico_3_valor, created_at, updated_at')
            .eq('turno_id', turno.id)
            .limit(1);

          if (!historiaError && historiaData && historiaData.length > 0) {
            turnoNormalizado.historiaClinica = historiaData[0];
          } else if (historiaError) {
            console.warn('Error al cargar historia clínica para turno:', turno.id, historiaError.message);
          }
        } catch (error) {
          console.warn('No se pudo cargar historia clínica para turno:', turno.id, error);
        }
      }

      return turnoNormalizado;
    }));

    return turnosEnriquecidos;
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
    
    // Enriquecer con información completa e historia clínica
    const turnosEnriquecidos = await Promise.all(data.map(async (turno: any) => {
      const turnoNormalizado = this.normalizeTurno({
        ...turno,
        pacienteNombre: turno.pacientes ? `${turno.pacientes.nombre} ${turno.pacientes.apellido}` : '',
        especialistaNombre: turno.empleados ? `${turno.empleados.nombre} ${turno.empleados.apellido}` : '',
        especialidad: turno.empleados?.especialidad || turno.especialidad
      });

      // Cargar historia clínica si el turno está realizado
      if (turno.estado === 'realizado' && turno.id) {
        try {
          // Obtener todos los campos de historia clínica según la estructura real
          const { data: historiaData, error: historiaError } = await supabase
            .from('historia_clinica')
            .select('id, altura, peso, temperatura, presion, campo_dinamico_1_clave, campo_dinamico_1_valor, campo_dinamico_2_clave, campo_dinamico_2_valor, campo_dinamico_3_clave, campo_dinamico_3_valor, created_at, updated_at')
            .eq('turno_id', turno.id)
            .limit(1);

          if (!historiaError && historiaData && historiaData.length > 0) {
            turnoNormalizado.historiaClinica = historiaData[0];
          } else if (historiaError) {
            console.warn('Error al cargar historia clínica para turno:', turno.id, historiaError.message);
          }
        } catch (error) {
          console.warn('No se pudo cargar historia clínica para turno:', turno.id, error);
        }
      }

      return turnoNormalizado;
    }));

    return turnosEnriquecidos;
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

  // Completar encuesta detallada con todos los datos
  async completarEncuestaDetallada(turnoId: number, encuesta: any): Promise<Turno> {
    // Crear un comentario estructurado con toda la información de la encuesta
    const comentarioEncuesta = `
📊 ENCUESTA DE SATISFACCIÓN
════════════════════════════
🌟 Calidad de atención: ${encuesta.atencionGeneral}/5
⏰ Tiempo de espera: ${encuesta.tiempoEspera}/5
👨‍⚕️ Profesionalismo: ${encuesta.profesionalismo}/5
🏥 Instalaciones: ${encuesta.instalaciones}/5
💯 Recomendaría: ${encuesta.recomendaria ? 'Sí' : 'No'}

💬 COMENTARIOS:
${encuesta.comentarios}

💡 SUGERENCIAS:
${encuesta.sugerencias || 'Ninguna'}

════════════════════════════
📅 Fecha de encuesta: ${new Date().toLocaleString('es-AR')}
    `.trim();

    // Calcular puntuación promedio
    const puntuacionPromedio = Math.round(
      (encuesta.atencionGeneral + encuesta.tiempoEspera + encuesta.profesionalismo + encuesta.instalaciones) / 4
    );

    const { data, error } = await supabase
      .from(this.table)
      .update({ 
        encuestarealizada: true,
        comentariopaciente: comentarioEncuesta,
        calificacion: puntuacionPromedio
      })
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
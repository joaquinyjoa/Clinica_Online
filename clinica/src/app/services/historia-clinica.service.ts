import { Injectable } from '@angular/core';
import { supabase } from './supabase.service';

export interface HistoriaClinica {
  id?: number;
  turno_id: number;
  paciente_id: number;
  especialista_id: number;
  altura: number;
  peso: number;
  temperatura: number;
  presion: string;
  campo_dinamico_1_clave?: string;
  campo_dinamico_1_valor?: string;
  campo_dinamico_2_clave?: string;
  campo_dinamico_2_valor?: string;
  campo_dinamico_3_clave?: string;
  campo_dinamico_3_valor?: string;
  created_at?: string;
  updated_at?: string;
}

export interface HistoriaClinicaCompleta extends HistoriaClinica {
  paciente_nombre?: string;
  paciente_apellido?: string;
  especialista_nombre?: string;
  especialista_apellido?: string;
  turno_fecha?: string;
  turno_especialidad?: string;
}

@Injectable({
  providedIn: 'root'
})
export class HistoriaClinicaService {

  constructor() { }

  /**
   * Crear nueva historia clínica
   */
  async crearHistoriaClinica(historia: HistoriaClinica): Promise<HistoriaClinica> {
    const { data, error } = await supabase
      .from('historia_clinica')
      .insert([historia])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Obtener historia clínica por ID de turno
   */
  async obtenerPorTurno(turnoId: number): Promise<HistoriaClinica | null> {
    const { data, error } = await supabase
      .from('historia_clinica')
      .select('*')
      .eq('turno_id', turnoId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No encontrado
      throw error;
    }
    return data;
  }

  /**
   * Obtener toda la historia clínica de un paciente con información completa
   */
  async obtenerHistoriaPaciente(pacienteId: number): Promise<HistoriaClinicaCompleta[]> {
    const { data, error } = await supabase
      .from('historia_clinica')
      .select(`
        *,
        pacientes!historia_clinica_paciente_id_fkey (
          nombre,
          apellido
        ),
        empleados!historia_clinica_especialista_id_fkey (
          nombre,
          apellido
        ),
        turnos!historia_clinica_turno_id_fkey (
          fecha,
          especialidad
        )
      `)
      .eq('paciente_id', pacienteId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transformar datos para facilitar el uso
    return data?.map(item => ({
      ...item,
      paciente_nombre: item.pacientes?.nombre,
      paciente_apellido: item.pacientes?.apellido,
      especialista_nombre: item.empleados?.nombre,
      especialista_apellido: item.empleados?.apellido,
      turno_fecha: item.turnos?.fecha,
      turno_especialidad: item.turnos?.especialidad
    })) || [];
  }

  /**
   * Obtener pacientes atendidos por un especialista con su historia clínica
   */
  async obtenerPacientesAtendidos(especialistaId: number): Promise<any[]> {
    const { data, error } = await supabase
      .from('historia_clinica')
      .select(`
        paciente_id,
        pacientes!historia_clinica_paciente_id_fkey (
          id,
          nombre,
          apellido,
          dni,
          obraSocial
        )
      `)
      .eq('especialista_id', especialistaId);

    if (error) throw error;

    // Eliminar duplicados de pacientes y obtener información única
    const pacientesUnicos = data?.reduce((acc, item) => {
      const pacienteId = item.paciente_id;
      if (!acc.find(p => p.id === pacienteId)) {
        acc.push({
          id: pacienteId,
          ...item.pacientes
        });
      }
      return acc;
    }, [] as any[]) || [];

    return pacientesUnicos;
  }

  /**
   * Obtener historias clínicas con filtros avanzados para búsquedas
   */
  async buscarHistorias(filtros: {
    pacienteId?: number;
    especialistaId?: number;
    fechaDesde?: string;
    fechaHasta?: string;
    textoBusqueda?: string;
  }): Promise<HistoriaClinicaCompleta[]> {
    let query = supabase
      .from('historia_clinica')
      .select(`
        *,
        pacientes!historia_clinica_paciente_id_fkey (
          nombre,
          apellido,
          dni
        ),
        empleados!historia_clinica_especialista_id_fkey (
          nombre,
          apellido,
          especialidad
        ),
        turnos!historia_clinica_turno_id_fkey (
          fecha,
          especialidad,
          comentarioespecialista
        )
      `);

    // Aplicar filtros
    if (filtros.pacienteId) {
      query = query.eq('paciente_id', filtros.pacienteId);
    }

    if (filtros.especialistaId) {
      query = query.eq('especialista_id', filtros.especialistaId);
    }

    if (filtros.fechaDesde) {
      query = query.gte('created_at', filtros.fechaDesde);
    }

    if (filtros.fechaHasta) {
      query = query.lte('created_at', filtros.fechaHasta);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    let resultados = data?.map(item => ({
      ...item,
      paciente_nombre: item.pacientes?.nombre,
      paciente_apellido: item.pacientes?.apellido,
      paciente_dni: item.pacientes?.dni,
      especialista_nombre: item.empleados?.nombre,
      especialista_apellido: item.empleados?.apellido,
      especialista_especialidad: item.empleados?.especialidad,
      turno_fecha: item.turnos?.fecha,
      turno_especialidad: item.turnos?.especialidad,
      turno_comentarios: item.turnos?.comentarioespecialista
    })) || [];

    // Filtro de texto (búsqueda en múltiples campos)
    if (filtros.textoBusqueda && filtros.textoBusqueda.trim()) {
      const texto = filtros.textoBusqueda.toLowerCase().trim();
      resultados = resultados.filter(historia => {
        const buscarEn = [
          historia.paciente_nombre,
          historia.paciente_apellido,
          historia.especialista_nombre,
          historia.especialista_apellido,
          historia.especialista_especialidad,
          historia.turno_especialidad,
          historia.turno_comentarios,
          historia.presion,
          historia.altura?.toString(),
          historia.peso?.toString(),
          historia.temperatura?.toString(),
          historia.campo_dinamico_1_clave,
          historia.campo_dinamico_1_valor,
          historia.campo_dinamico_2_clave,
          historia.campo_dinamico_2_valor,
          historia.campo_dinamico_3_clave,
          historia.campo_dinamico_3_valor
        ].join(' ').toLowerCase();

        return buscarEn.includes(texto);
      });
    }

    return resultados;
  }

  /**
   * Actualizar historia clínica existente
   */
  async actualizarHistoriaClinica(id: number, historia: Partial<HistoriaClinica>): Promise<HistoriaClinica> {
    const { data, error } = await supabase
      .from('historia_clinica')
      .update(historia)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Verificar si un turno ya tiene historia clínica
   */
  async existeHistoriaParaTurno(turnoId: number): Promise<boolean> {
    const historia = await this.obtenerPorTurno(turnoId);
    return historia !== null;
  }

  /**
   * Obtener estadísticas básicas de un paciente
   */
  async obtenerEstadisticasPaciente(pacienteId: number): Promise<any> {
    const historias = await this.obtenerHistoriaPaciente(pacienteId);
    
    if (historias.length === 0) {
      return {
        totalConsultas: 0,
        ultimaConsulta: null,
        promedios: null
      };
    }

    const promedios = {
      altura: historias.reduce((sum, h) => sum + (h.altura || 0), 0) / historias.length,
      peso: historias.reduce((sum, h) => sum + (h.peso || 0), 0) / historias.length,
      temperatura: historias.reduce((sum, h) => sum + (h.temperatura || 0), 0) / historias.length
    };

    return {
      totalConsultas: historias.length,
      ultimaConsulta: historias[0]?.created_at,
      promedios: {
        altura: Math.round(promedios.altura * 100) / 100,
        peso: Math.round(promedios.peso * 100) / 100,
        temperatura: Math.round(promedios.temperatura * 100) / 100
      }
    };
  }
}
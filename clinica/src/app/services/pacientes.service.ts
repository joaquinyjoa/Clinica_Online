import { Injectable } from '@angular/core';
import { supabase } from './supabase.service';

export interface Paciente {
  id?: number;
  nombre: string;
  apellido?: string;
  dni?: number;
  obraSocial?: string;
  email?: string;
  contraseña?: string;
  foto1?: string;
  foto2?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PacientesService {

  private table = 'pacientes';
  private storageBucket = 'pacientes-images'; // nombre del bucket en Supabase Storage

  constructor() { }

    // Subir una imagen a Supabase Storage y devolver la URL pública
  async subirImagen(file: File, nombreArchivo: string): Promise<string> {
    // Reemplazamos espacios en el nombre
    nombreArchivo = nombreArchivo.replace(/\s/g, '_');

    // Subimos
    const { error: uploadError } = await supabase
      .storage
      .from(this.storageBucket)
      .upload(`foto1-${Date.now()}-${file.name}`, file, { upsert: true });

    if (uploadError) throw uploadError;

    // Obtenemos URL pública
    const { data } = supabase.storage.from(this.storageBucket).getPublicUrl(nombreArchivo);
    return data?.publicUrl || '';
  }


  // Crear un nuevo paciente
  async crearPaciente(paciente: Paciente): Promise<Paciente> {
    const { data, error } = await supabase
      .from(this.table)
      .insert(paciente)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Métodos auxiliares para buscar usuario en Supabase
  async buscarPaciente(email: string | null, password: string): Promise<Paciente | null> {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('email', email)
      .eq('contraseña', password)
      .single();

    if (error) return null;
    return data || null;
  }

}

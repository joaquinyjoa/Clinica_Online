import { Injectable } from '@angular/core';
import { supabase } from './supabase.service';

export interface Especialista {
  id?: number;
  nombre: string;          // obligatorio
  apellido?: string | null;
  edad?: number | null;
  dni?: number | null;
  especialidad: string;    // obligatorio
  email: string;           // obligatorio
  contraseña: string;      // obligatorio
  imagenPerfil?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class EspecialistasService {
    private table = 'especialistas';
    private storageBucket = 'especialistas-images'; // nombre del bucket en Supabase Storage
    constructor() { }

    // Subir una imagen a Supabase Storage y devolver la URL pública
  async subirImagen(file: File, nombreArchivo: string): Promise<string> {
    // Reemplazamos espacios en el nombre
    nombreArchivo = nombreArchivo.replace(/\s/g, '_');
    // Subimos
    const { error: uploadError } = await supabase
      .storage
      .from(this.storageBucket)
      .upload(`foto-${Date.now()}-${file.name}`, file, { upsert: true });
    if (uploadError) throw uploadError;
    // Obtenemos URL pública
    const { data } = supabase.storage.from(this.storageBucket).getPublicUrl(nombreArchivo);
    return data?.publicUrl || '';
  }
    // Crear un nuevo especialista
    async crearEspecialista(especialista: Especialista): Promise<Especialista> {
    const { data, error } = await supabase
        .from(this.table)
        .insert(especialista)
        .select()
        .single();
    if (error) throw error;
    return data;
  }

  async buscarEspecialista(email: string, password: string): Promise<Especialista | null> {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('email', email)
      .eq('contraseña', password)
      .single();

    if (error) return null;
    return data || null;
  }
  
  async existeEspecialista(email: string | null | undefined, dni: number): Promise<boolean> {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .or(`email.eq.${email},dni.eq.${dni}`);
    if (error) throw error;
    return (data && data.length > 0);
  }
}
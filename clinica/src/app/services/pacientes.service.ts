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
  emailVerificado?: boolean;
  foto1?: string;
  foto2?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PacientesService {

  private table = 'pacientes';
  private storageBucket = 'pacientes-images'; // nombre del bucket en Supabase Storage
  public usuarioActual: Paciente | null = null;

  constructor() { }

    // Subir una imagen a Supabase Storage y devolver la URL pública
  async subirImagen(file: File, nombreArchivo: string): Promise<string> {
    // Reemplazamos espacios en el nombre
    nombreArchivo = nombreArchivo.replace(/\s/g, '_');
    const archivoCompleto = `foto-${Date.now()}-${nombreArchivo}`;

    // Subimos
    const { data, error: uploadError } = await supabase
      .storage
      .from(this.storageBucket)
      .upload(archivoCompleto, file, { upsert: true });

    if (uploadError) {
      console.error('Error subiendo imagen:', uploadError);
      throw uploadError;
    }

    // Intentar primero URL pública
    const { data: urlData } = supabase.storage
      .from(this.storageBucket)
      .getPublicUrl(archivoCompleto);
    
    // Si falla, usar URL firmada (válida por 1 año)
    const { data: signedData, error: signedError } = await supabase.storage
      .from(this.storageBucket)
      .createSignedUrl(archivoCompleto, 31536000); // 1 año en segundos
    
    const finalUrl = urlData.publicUrl || signedData?.signedUrl || '';
    return finalUrl;
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

 // ✅ Validación de duplicados por campo
  async validarDuplicados(email: string | null | undefined,
    dni: number, contraseña: string | null | undefined) : 
    Promise<{ email?: boolean, dni?: boolean, contraseña?: boolean }> {
    
    const result: { email?: boolean, dni?: boolean, contraseña?: boolean } = {};

    if (email) {
      const { data: dataEmail, error: errorEmail } = await supabase
        .from(this.table)
        .select('id')
        .eq('email', email);

      if (errorEmail) throw errorEmail;
      result.email = (dataEmail && dataEmail.length > 0);
    }

    if (dni) {
      const { data: dataDni, error: errorDni } = await supabase
        .from(this.table)
        .select('id')
        .eq('dni', dni);

      if (errorDni) throw errorDni;
      result.dni = (dataDni && dataDni.length > 0);
    }

    if (contraseña) {
      const { data: dataPassword, error: errorPassword } = await supabase
        .from(this.table)
        .select('id')
        .eq('contraseña', contraseña);

      if (errorPassword) throw errorPassword;
      result.contraseña = (dataPassword && dataPassword.length > 0);
    }

    return result;
  }

  // 🔹 Login de paciente
  async login(email: string, password: string): Promise<Paciente | null> {
    const paciente = await this.buscarPaciente(email, password);
    if (paciente) {
      this.usuarioActual = paciente; // guardamos el paciente logueado
      return paciente;
    }
    this.usuarioActual = null;
    return null;
  }

  // 🔹 Logout
  logout() {
    this.usuarioActual = null;
  }

  // 🔹 Obtener todos los pacientes
  async obtenerTodos(): Promise<Paciente[]> {
    const { data, error } = await supabase
      .from(this.table)
      .select('*');
    
    if (error) throw error;
    return data || [];
  }


}

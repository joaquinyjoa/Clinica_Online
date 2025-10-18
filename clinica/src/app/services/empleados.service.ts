import { Injectable } from '@angular/core';
import { supabase } from './supabase.service';

export interface Empleado {
  id?: number;
  nombre?: string | null;
  apellido?: string | null;
  edad?: number | null;
  dni?: number | null;
  especialidad?: string | null;
  email?: string | null;
  contraseña?: string | null;
  imagenPerfil?: string | null;
  emailVerificado?: boolean;
  aprobado?: boolean;
}


@Injectable({
  providedIn: 'root'
})
export class EmpleadosService {

  private table = 'empleados';
  private storageBucket = 'especialistas-images';
  public usuarioActual: Empleado | null = null;

  constructor() { }

  // 🔹 Login y guarda el usuario actual
  async login(email: string, password: string): Promise<Empleado | null> {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('email', email)
      .eq('contraseña', password)
      .single();

    if (data) this.usuarioActual = data;
    return data || null;
  }

  logout() {
    this.usuarioActual = null;
  }

  // 🔹 Subir imagen
  async subirImagen(file: File, nombreArchivo: string): Promise<string> {
    nombreArchivo = nombreArchivo.replace(/\s/g, '_');
    const archivoCompleto = `foto-${Date.now()}-${nombreArchivo}`;
    
    const { data, error } = await supabase
      .storage.from(this.storageBucket)
      .upload(archivoCompleto, file, { upsert: true });
      
    if (error) {
      console.error('Error subiendo imagen:', error);
      throw error;
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

  async crearAdmin(admin: Empleado): Promise<Empleado> {
    // Forzamos que la especialidad sea "administrador"
    admin.especialidad = 'administrador';

    const { data, error } = await supabase
      .from(this.table)
      .insert(admin)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // 🔹 Crear un empleado
  async crearEmpleado(empleado: Empleado): Promise<Empleado> {
    const { data, error } = await supabase
      .from(this.table)
      .insert(empleado)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // 🔹 Actualizar un empleado (por ejemplo para aprobar/desaprobar)
  async actualizarEmpleado(empleado: Empleado): Promise<Empleado> {
    if (!empleado.id) throw new Error('Empleado sin ID');
    const { data, error } = await supabase
      .from(this.table)
      .update(empleado)
      .eq('id', empleado.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // 🔹 Traer todos los empleados
  async obtenerTodos(): Promise<Empleado[]> {
    const { data, error } = await supabase
      .from(this.table)
      .select('*');
    if (error) throw error;
    return data || [];
  }

  // 🔹 Buscar por email y contraseña (para validar duplicados en registro)
  async buscarEspecialista(email: string, password: string): Promise<Empleado | null> {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('email', email)
      .eq('contraseña', password)
      .single();
    return data || null;
  }

  // 🔹 Validar duplicados por email, dni o contraseña
  async validarDuplicados(email?: string | null | undefined, dni?: number, contraseña?: string | null | undefined): Promise<{email?: boolean, dni?: boolean, contraseña?: boolean}> {
    const result: {email?: boolean, dni?: boolean, contraseña?: boolean} = {};

    if (email) {
      const { data } = await supabase.from(this.table).select('id').eq('email', email);
      result.email = !!(data && data.length);
    }

    if (dni) {
      const { data } = await supabase.from(this.table).select('id').eq('dni', dni);
      result.dni = !!(data && data.length);
    }

    if (contraseña) {
      const { data } = await supabase.from(this.table).select('id').eq('contraseña', contraseña);
      result.contraseña = !!(data && data.length);
    }

    return result;
  }
}

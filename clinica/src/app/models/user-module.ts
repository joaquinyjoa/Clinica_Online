import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface User {
  uid?: string;
  nombre: string;
  apellido: string;
  edad: number;
  dni: string;
  mail: string;
  password?: string; // solo para registro
  perfil: 'Paciente' | 'Especialista' | 'Administrador';
  especialidades?: string[]; // solo especialistas
  obraSocial?: string;       // solo pacientes
  imagenes?: string[];       // urls en Storage
  activo: boolean;           // para habilitar/deshabilitar acceso
  verificado: boolean;       // mail verificado
  aprobado?: boolean;        // aprobado por Admin (solo especialistas)
}


@NgModule({
  declarations: [],
  imports: [
    CommonModule
  ]
})
export class UserModule { }

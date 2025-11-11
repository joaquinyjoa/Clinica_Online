import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { EmpleadosService } from '../services/empleados.service';
import { ToastService } from '../services/toast.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(
    private empleadosService: EmpleadosService,
    private router: Router,
    private toastService: ToastService
  ) {}

  canActivate(): boolean {
    // Intentar obtener usuario del servicio primero
    let usuario = this.empleadosService.usuarioActual;
    
    // Si no hay usuario en el servicio, intentar desde localStorage
    if (!usuario) {
      const usuarioLocalStorage = localStorage.getItem('currentUser');
      if (usuarioLocalStorage) {
        try {
          usuario = JSON.parse(usuarioLocalStorage);
          // Si encontramos usuario en localStorage, actualizamos el servicio
          if (usuario) {
            this.empleadosService.usuarioActual = usuario;
          }
        } catch (error) {
          console.error('Error parsing user from localStorage:', error);
        }
      }
    }

    if (!usuario) {
      // No hay usuario logueado → redirigir al login
      this.toastService.warning('🔒 Debes iniciar sesión para acceder a esta sección');
      this.router.navigate(['/login']);
      return false;
    }

    if (usuario.especialidad?.toLowerCase() !== 'administrador') {
      // No es admin → redirigir al home con mensaje
      this.toastService.error('❌ Acceso denegado: Esta sección es solo para administradores');
      this.router.navigate(['/']);
      return false;
    }

    return true; // Es admin → puede acceder
  }
}

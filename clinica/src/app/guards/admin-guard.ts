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
    const usuario = this.empleadosService.usuarioActual; // guardá en el servicio el usuario logueado

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

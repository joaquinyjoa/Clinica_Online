import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { EmpleadosService } from '../services/empleados.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(
    private empleadosService: EmpleadosService,
    private router: Router
  ) {}

  canActivate(): boolean {
    const usuario = this.empleadosService.usuarioActual; // guardá en el servicio el usuario logueado

    if (!usuario) {
      // No hay usuario logueado → redirigir al login
      this.router.navigate(['/login']);
      return false;
    }

    if (usuario.especialidad?.toLowerCase() !== 'administrador') {
      // No es admin → redirigir al login o a home
      alert('❌ No tenés permisos para acceder a esta sección.');
      this.router.navigate(['/login']);
      return false;
    }

    return true; // Es admin → puede acceder
  }
}

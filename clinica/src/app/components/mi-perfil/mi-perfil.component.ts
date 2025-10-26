import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EmpleadosService } from '../../services/empleados.service';
import { PacientesService } from '../../services/pacientes.service';
import { ToastService } from '../../services/toast.service';
import { Empleado } from '../../services/empleados.service';
import { Paciente } from '../../services/pacientes.service';

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mi-perfil.component.html',
  styleUrls: ['./mi-perfil.component.scss']
})
export class MiPerfilComponent implements OnInit {
  private empleadosService = inject(EmpleadosService);
  private pacientesService = inject(PacientesService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  userType: 'admin' | 'especialista' | 'paciente' | null = null;
  currentUser: Empleado | Paciente | null = null;
  isLoading = true;

  async ngOnInit() {
    try {
      await this.detectUserType();
    } catch (error) {
      console.error('Error al cargar perfil:', error);
      this.toastService.error('Error al cargar el perfil');
      this.router.navigate(['/welcome']);
    }
  }

  private async detectUserType() {
    this.isLoading = true;

    try {
      // Intentar obtener usuario actual desde empleados
      const empleado = this.empleadosService.usuarioActual;
      if (empleado) {
        this.currentUser = empleado;
        this.userType = empleado.especialidad?.toLowerCase() === 'administrador' ? 'admin' : 'especialista';
        this.isLoading = false;
        return;
      }

      // Si no es empleado, intentar desde pacientes
      const paciente = this.pacientesService.usuarioActual;
      if (paciente) {
        this.currentUser = paciente;
        this.userType = 'paciente';
        this.isLoading = false;
        return;
      }

      // Si no encontró usuario, redirigir al login
      this.toastService.warning('Debes iniciar sesión para acceder a tu perfil');
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error detectando tipo de usuario:', error);
      this.toastService.error('Error al cargar información del usuario');
      this.router.navigate(['/welcome']);
    } finally {
      this.isLoading = false;
    }
  }

  getUserDisplayName(): string {
    if (!this.currentUser) return '';
    
    if ('nombre' in this.currentUser && 'apellido' in this.currentUser) {
      return `${this.currentUser.nombre} ${this.currentUser.apellido}`;
    }
    
    return this.currentUser.email || 'Usuario';
  }

  getUserTypeLabel(): string {
    switch (this.userType) {
      case 'admin': return 'Administrador';
      case 'especialista': return 'Especialista';
      case 'paciente': return 'Paciente';
      default: return '';
    }
  }

  volver() {
    this.router.navigate(['/welcome']);
  }
}
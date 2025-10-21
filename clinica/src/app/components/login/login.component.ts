import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { PacientesService, Paciente } from '../../services/pacientes.service';
import { EmpleadosService, Empleado } from '../../services/empleados.service';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { ToastService } from '../../services/toast.service';
import { ToastComponent } from '../toast/toast.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatProgressSpinnerModule, ToastComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  fb = new FormBuilder();

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  get f() { return this.loginForm.controls; }

  constructor(
    private pacientesService: PacientesService,
    private empleadosService: EmpleadosService,
    private router: Router,
    private toastService: ToastService
  ) {}
  loading = false;

  private async navigateWithSpinner(target: string): Promise<void> {
    this.loading = true;
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        void this.router.navigate([target]).finally(() => {
          this.loading = false;
          resolve();
        });
      }, 3000);
    });
  }

  async onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.toastService.error('⚠️ Por favor, completá todos los campos correctamente.');
      return;
    }
    
    this.loading = true;

    const { email: rawEmail, password: rawPassword } = this.loginForm.value;
    const email: string = rawEmail || '';
    const password: string = rawPassword || '';

    try {
      // Buscar en pacientes
      const paciente: Paciente | null = await this.pacientesService.login(email, password);

      if (paciente) {
        // Verifico que el mail esté verificado
        if (paciente.emailVerificado == null) {
          this.toastService.warning('📧 Tu cuenta no fue verificada por mail. Revisá tu correo.');
          this.loading = false;
          return;
        }

        this.toastService.success(`🏥 Bienvenido paciente ${paciente.nombre}`);
        // Redirigir al panel de turnos del paciente
        await this.navigateWithSpinner('/mis-turnos');
        return;
      }

      // Buscar en especialistas
      const empleado: Empleado | null = await this.empleadosService.login(email, password);

      if (empleado) {
        // Validar ambas condiciones
        if (empleado.emailVerificado == null) {
          this.toastService.warning('📧 Tu cuenta de especialista no fue verificada por mail.');
          this.loading = false;
          return;
        }

        if (!empleado.aprobado) {
          this.toastService.warning('⏳ Tu cuenta aún no fue aprobada por el administrador.');
          this.loading = false;
          return;
        }

        if (empleado.especialidad?.toLowerCase() === 'administrador') {
            this.toastService.success(`👨‍💼 Bienvenido administrador ${empleado.nombre}`);
            await this.navigateWithSpinner('/panel-admin');
        } else {
            this.toastService.success(`👨‍⚕️ Bienvenido especialista ${empleado.nombre}`);
            this.loading = false;
        }
       
        return;
      }

      this.toastService.error('🔐 Usuario o contraseña incorrecta');

    } catch (error) {
      console.error(error);
      this.toastService.error('⚠️ Error al iniciar sesión');
    } finally {
      this.loading = false;
    }
  }


  // Acceso rápido
  loginRapido(email: string, password: string) {
    this.loginForm.patchValue({ email, password });
  }

  // Método para manejar errores de imagen
  onImageError(event: any, fallbackText: string) {
    const img = event.target;
    img.style.display = 'none';
    
    // Crear div de fallback si no existe
    let fallback = img.nextElementSibling;
    if (!fallback || !fallback.classList.contains('avatar-fallback')) {
      fallback = document.createElement('div');
      fallback.classList.add('avatar-fallback');
      fallback.textContent = fallbackText;
      img.parentNode?.insertBefore(fallback, img.nextSibling);
    }
  }

  // Método para volver al welcome
  async volver() {
    await this.navigateWithSpinner('/welcome');
  }

}

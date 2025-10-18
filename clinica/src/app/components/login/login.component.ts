import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { PacientesService, Paciente } from '../../services/pacientes.service';
import { EmpleadosService, Empleado } from '../../services/empleados.service';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatProgressSpinnerModule],
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
    private router: Router
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
    alert('⚠️ Por favor, completá todos los campos correctamente.');
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
      if (!paciente.emailVerificado) {
        alert('⚠️ Tu cuenta no fue verificada por mail. Revisá tu correo.');
        return;
      }

      alert(`✅ Bienvenido paciente ${paciente.nombre}`);
      // Aquí podrías redirigir al home de pacientes
      return;
    }

    // Buscar en especialistas
    const empleado: Empleado | null = await this.empleadosService.login(email, password);

    if (empleado) {
      // Validar ambas condiciones
      if (!empleado.emailVerificado) {
        alert('⚠️ Tu cuenta de especialista no fue verificada por mail.');
        return;
      }

      if (!empleado.aprobado) {
        alert('⚠️ Tu cuenta aún no fue aprobada por el administrador.');
        return;
      }

      if (empleado.especialidad?.toLowerCase() === 'administrador') {
          alert (`✅ Bienvenido administrador ${empleado.nombre}`);
          await this.navigateWithSpinner('/panel-admin');
      }
      else
        {
          alert(`✅ Bienvenido especialista ${empleado.nombre}`);
        }
     
      return;
    }

    alert('❌ Usuario o contraseña incorrecta');

  } catch (error) {
    console.error(error);
    alert('Error al iniciar sesión');
    } finally {
      this.loading = false;
  }
}


  // Acceso rápido
  loginRapido(email: string, password: string) {
    this.loginForm.patchValue({ email, password });
  }

}

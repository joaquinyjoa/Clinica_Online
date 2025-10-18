import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { PacienteComponent } from '../paciente/paciente.component';
import { EspecialistaComponent } from '../especialista/especialista.component';
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { NgIf } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule,
     FormsModule,
     NgIf,
      RouterModule, PacienteComponent, EspecialistaComponent, MatProgressSpinnerModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class Register {
  tipoUsuario: 'paciente' | 'especialista' = 'paciente';
  aceptoCondiciones = false;
  loading = false;

  // 🔹 Referencia al componente hijo
  @ViewChild(PacienteComponent) pacienteComp!: PacienteComponent;
   @ViewChild(EspecialistaComponent) especialistaComp!: EspecialistaComponent;

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);

  // Getter para verificar si el formulario actual es válido
  get formularioValido(): boolean {
    if (this.tipoUsuario === 'paciente' && this.pacienteComp) {
      return this.pacienteComp.pacienteForm.valid;
    } else if (this.tipoUsuario === 'especialista' && this.especialistaComp) {
      return this.especialistaComp.especialistaForm.valid;
    }
    return false;
  }

  // Getter para verificar si se puede registrar (formulario válido + condiciones aceptadas)
  get puedeRegistrarse(): boolean {
    return this.formularioValido && this.aceptoCondiciones && !this.loading;
  }

  volver() {
    this.router.navigate(['/']); // Navega al home
  }

  async registrar() {
    if (!this.aceptoCondiciones) {
      this.toastService.warning('⚠️ Debes aceptar las condiciones para registrarte');
      return;
    }

    if (!this.formularioValido) {
      this.toastService.warning('⚠️ Por favor, completa todos los campos correctamente antes de registrarte');
      return;
    }

    this.loading = true;
    try {
      if (this.tipoUsuario === 'paciente') {
        if (!this.pacienteComp.validarFormulario()) {
          this.loading = false;
          return;
        }
        const pacienteCreado = await this.pacienteComp.crearPaciente();
        if (pacienteCreado === 0) {
          this.loading = false;
          return; // ❌ Validación fallida
        }
        // El toast ya se muestra desde el componente paciente
      } else if (this.tipoUsuario === 'especialista') {
        const especialistaCreado = await this.especialistaComp.crearEspecialista();
        if (especialistaCreado === 0) {
          this.loading = false;
          return; // ❌ Validación fallida
        }
        // El toast ya se muestra desde el componente especialista
      }

      // Navegar mostrando spinner
      await this.navigateWithSpinner('/login');
    } catch (error) {
      console.error(error);
      this.toastService.error('❌ Error al crear el usuario. Intente nuevamente.');
      this.loading = false;
    }
  }
  
  // Reutiliza el mismo patrón que en welcome: muestra spinner y navega después de un pequeño delay
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
    
}

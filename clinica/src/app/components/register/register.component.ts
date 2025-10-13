import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { PacienteComponent } from '../paciente/paciente.component';
import { EspecialistaComponent } from '../especialista/especialista.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PacienteComponent, EspecialistaComponent],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class Register {
  tipoUsuario: 'paciente' | 'especialista' = 'paciente';
  aceptoCondiciones = false;

  // 🔹 Referencia al componente hijo
  @ViewChild(PacienteComponent) pacienteComp!: PacienteComponent;
   @ViewChild(EspecialistaComponent) especialistaComp!: EspecialistaComponent;

  private router = inject(Router);
  private route = inject(ActivatedRoute);

  async registrar() {
    if (!this.aceptoCondiciones) {
      alert('Debes aceptar las condiciones para registrarte');
      return;
    }

    try {
      if (this.tipoUsuario === 'paciente') {
        if (!this.pacienteComp.validarFormulario()) return;
        const pacienteCreado = await this.pacienteComp.crearPaciente();
        alert(`Paciente creado con ID: ${pacienteCreado}`);
      } else if (this.tipoUsuario === 'especialista') {
        if (!this.especialistaComp.especialistaForm.valid) {
          this.especialistaComp.especialistaForm.markAllAsTouched();
          alert(`Por favor completa todos los campos correctamente`);
          return;
        }
        const especialistaCreado = await this.especialistaComp.crearEspecialista();
        alert(`Especialista creado con ID: ${especialistaCreado}`);
      }

      this.router.navigate(['/login']); // o donde quieras redirigir
    } catch (error) {
      console.error(error);
      alert('Error al crear el usuario');
    }
  }
    
}

import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Paciente } from '../paciente/paciente';
import { Especialista } from '../especialista/especialista';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, Paciente, Especialista],
  templateUrl: './register.html',
  styleUrls: ['./register.scss']
})
export class Register {
  tipoUsuario: 'paciente' | 'especialista' | '' = '';
  aceptoCondiciones = false;

  // 🔹 Referencia al componente hijo
  @ViewChild(Paciente) pacienteComp!: Paciente;
   @ViewChild(Especialista) especialistaComp!: Especialista;

  private router = inject(Router);
  private route = inject(ActivatedRoute);

  registrar() {
    if (!this.tipoUsuario) {
      alert('Por favor selecciona un tipo de usuario');
      return;
    }

    if (!this.aceptoCondiciones) {
      alert('Debes aceptar las condiciones para registrarte');
      return;
    }

    // Validar el hijo paciente usando ViewChild
    if (this.tipoUsuario === 'paciente') {
      if (this.pacienteComp && !this.pacienteComp.validarFormulario()) {
        return; // no continuar si el formulario es inválido
      }
    }
   

    // Aquí podrías agregar especialista de manera similar
    this.router.navigate([this.tipoUsuario], { relativeTo: this.route });
  }
}

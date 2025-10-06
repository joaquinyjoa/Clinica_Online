import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.html',
  styleUrls: ['./register.scss']
})
export class Register {
  tipoUsuario: 'paciente' | 'especialista' | null = null;

  registrar() {
    if (!this.tipoUsuario) {
      alert('Por favor, selecciona Paciente o Especialista');
      return;
    }

    alert(`Registrando como ${this.tipoUsuario}`);
    // Aquí podés agregar la lógica de registro
  }
}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { PacientesService, Paciente } from '../../services/pacientes.service';
import { EspecialistasService, Especialista } from '../../services/especialistas.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './login.component.html'
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
    private especialistasService: EspecialistasService
  ) {}

  async onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      alert('⚠️ Por favor, completá todos los campos correctamente.');
      return;
    }

    const { email: rawEmail, password: rawPassword } = this.loginForm.value;
    const email: string = rawEmail || '';
    const password: string = rawPassword || '';

    try {
      // Primero busco en pacientes
      const paciente: Paciente | null = await this.pacientesService.buscarPaciente(email, password);
      if (paciente) {
        alert(`✅ Login paciente: ${paciente.nombre}`);
        return;
      }

      // Si no está, busco en especialistas
      const especialista: Especialista | null = await this.especialistasService.buscarEspecialista(email, password);
      if (especialista) {
        alert(`✅ Login especialista: ${especialista.nombre}`);
        return;
      }

      alert('❌ Usuario o contraseña incorrecta');

    } catch (error) {
      console.error(error);
      alert('Error al iniciar sesión');
    }
  }

  // Acceso rápido
  loginRapido(email: string, password: string) {
    this.loginForm.patchValue({ email, password });
  }

}

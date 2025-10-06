import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-paciente',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './paciente.html',
})
export class Paciente {
  fb = new FormBuilder();

  pacienteForm = this.fb.group({
    nombre: ['', Validators.required],
    apellido: ['', Validators.required],
    edad: ['', [Validators.required, Validators.min(0), Validators.max(120)]],
    dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
    obraSocial: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [
      Validators.required,
      Validators.minLength(6),
      Validators.maxLength(10),
      Validators.pattern(/^(?=.*[A-Z])(?=.*\d).+$/)
    ]],
    imagen1: [null, Validators.required],
    imagen2: [null, Validators.required]
  });

  // Para mostrar errores de forma simple
  get f() {
    return this.pacienteForm.controls;
  }

  // Método para subir imágenes
  subirImagen(event: Event, controlName: 'imagen1' | 'imagen2') {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.pacienteForm.patchValue({ [controlName]: input.files[0] });
    }
  }

  // Validación completa antes de enviar
  validarFormulario(): boolean {
    if (this.pacienteForm.invalid) {
      this.pacienteForm.markAllAsTouched();
      alert('Por favor completa todos los campos correctamente');
      return false;
    }
    return true;
  }
}

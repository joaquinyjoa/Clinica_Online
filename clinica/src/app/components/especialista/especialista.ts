import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-especialista',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './especialista.html',
  styleUrls: ['./especialista.scss']
})
export class Especialista {
  fb = new FormBuilder();

  especialidadesDisponibles = ['Cardiología', 'Dermatología', 'Odontología'];
  nuevaEspecialidad = '';
  imagenPreview: string | null = null; // ✅ para mostrar la vista previa

  especialistaForm = this.fb.group({
    nombre: ['', Validators.required],
    apellido: ['', Validators.required],
    edad: ['', [Validators.required, Validators.min(18), Validators.max(120)]],
    dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
    especialidad: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [
      Validators.required,
      Validators.minLength(6),
      Validators.maxLength(10),
      Validators.pattern(/^(?=.*[A-Z])(?=.*\d).+$/)
    ]],
    imagenPerfil: [null, Validators.required]
  });

  get f() {
    return this.especialistaForm.controls;
  }

  agregarEspecialidad() {
    const nueva = this.nuevaEspecialidad.trim();
    if (nueva && !this.especialidadesDisponibles.includes(nueva)) {
      this.especialidadesDisponibles.push(nueva);
      this.especialistaForm.patchValue({ especialidad: nueva });
      this.nuevaEspecialidad = '';
    }
  }

  // ✅ Mostrar vista previa de la imagen seleccionada
  subirImagen(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      const file = input.files[0];
     this.especialistaForm.patchValue({ imagenPerfil: input.files[0] as unknown as null });

      const reader = new FileReader();
      reader.onload = () => {
        this.imagenPreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  validarFormulario(): boolean {
    if (this.especialistaForm.invalid) {
      this.especialistaForm.markAllAsTouched();
      alert('Por favor completa todos los campos correctamente');
      return false;
    }
    return true;
  }
}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { EspecialistasService, Especialista } from '../../services/especialistas.service';

@Component({
  selector: 'app-especialista',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './especialista.component.html',
  styleUrls: ['./especialista.component.scss']
})
export class EspecialistaComponent {

  fb = new FormBuilder();
  especialidadesDisponibles = ['Cardiología', 'Dermatología', 'Odontología'];
  nuevaEspecialidad = '';
  agregarNuevaEspecialidad = false; // controla si mostramos el input
  imagenPreview: string | null = null;

  especialistaForm = this.fb.group({
    nombre: ['', Validators.required],
    apellido: ['', Validators.required],
    edad: ['', [Validators.required, Validators.min(18), Validators.max(120)]],
    dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
    especialidad: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(10),
        Validators.pattern(/^(?=.*[A-Z])(?=.*\d).+$/)
      ]
    ],
    imagenPerfil: [null as File | null, Validators.required]
  });

  constructor(private especialistasService: EspecialistasService) {}

  get f() { return this.especialistaForm.controls; }

  // Cambiar especialidad
  onEspecialidadChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.agregarNuevaEspecialidad = select.value === 'agregar';
    if (!this.agregarNuevaEspecialidad) {
      this.nuevaEspecialidad = '';
      this.especialistaForm.patchValue({ especialidad: select.value });
    }
  }

  subirImagen(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      const file = input.files[0];
      this.especialistaForm.patchValue({ imagenPerfil: file });
      const reader = new FileReader();
      reader.onload = () => this.imagenPreview = reader.result as string;
      reader.readAsDataURL(file);
    }
  }

  async onSubmit() {
    try {
      await this.crearEspecialista();
    } catch (error) {
      console.error(error);
    }
  }

  async crearEspecialista(): Promise<number> {

    // Validación edad
    const edad = Number(this.especialistaForm.value.edad);
    if (edad < 18) {
      alert('⚠️ La edad debe ser mayor o igual a 18 años.');
      return 0;
    }

    // Validación email/DNI duplicados
    const email = this.especialistaForm.value.email;
    const dni = Number(this.especialistaForm.value.dni);
    const yaExiste = await this.especialistasService.existeEspecialista(email, dni);
    if (yaExiste) {
      alert('❌ Ya existe un especialista con el mismo email o DNI.');
      return 0;
    }

    // Validación: si se eligió agregar nueva especialidad, asegurarnos que no esté vacía
    if (this.agregarNuevaEspecialidad) {
      if (!this.nuevaEspecialidad.trim()) {
        alert('⚠️ Debes escribir la nueva especialidad antes de enviar.');
        return 0;
      }
      // Actualizamos el FormControl para que Angular lo considere válido
      this.especialistaForm.patchValue({ especialidad: this.nuevaEspecialidad.trim() });
    }

    if (this.especialistaForm.invalid) {
      this.especialistaForm.markAllAsTouched();
      alert('⚠️ Por favor, completá todos los campos correctamente.');
      return 0;
    }

    const formValues = this.especialistaForm.value;
    const imagenFile = formValues.imagenPerfil as File;
    let fotoUrl = '';
    if (imagenFile) {
      // Eliminamos caracteres problemáticos del nombre del archivo
      const nombreArchivo = `perfil-${Date.now()}-${imagenFile.name.replace(/\s/g, '_')}`;
      fotoUrl = await this.especialistasService.subirImagen(imagenFile, nombreArchivo);
    }

    const nuevoEspecialista: Especialista = {
    nombre: formValues.nombre || '',        // nunca será undefined
    apellido: formValues.apellido || null,  // opcional
    edad: Number(formValues.edad) || null,
    dni: Number(formValues.dni) || null,
    especialidad: formValues.especialidad || '',
    email: formValues.email || '',
    contraseña: formValues.password || '',
    imagenPerfil: fotoUrl || null
  };


    try {
      
      const especialistaCreado = await this.especialistasService.crearEspecialista(nuevoEspecialista);
      alert(`✅ Especialista creado con ID: ${especialistaCreado.id}`);
      // Reset completo del formulario
      this.especialistaForm.reset();
      this.imagenPreview = null;
      this.nuevaEspecialidad = '';
      this.agregarNuevaEspecialidad = false;
      return especialistaCreado.id || 0;
    } catch (error) {
      console.error(error);
      alert('❌ Error al crear el especialista');
      throw error;
    }
  }
}

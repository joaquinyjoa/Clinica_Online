import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { PacientesService, Paciente } from '../../services/pacientes.service';

@Component({
  selector: 'app-paciente',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './paciente.component.html',
  styleUrls: ['./paciente.component.scss']
})
export class PacienteComponent {
  fb = new FormBuilder();
  loading = false;
  imagen1Preview: string | null = null;
  imagen2Preview: string | null = null;

  constructor(private pacientesService: PacientesService) { }

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

  // Método para subir imágenes desde input
  subirImagen(event: Event, controlName: 'imagen1' | 'imagen2') {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      const file = input.files[0];
      this.pacienteForm.patchValue({ [controlName]: file });
      
      // Generar preview
      const reader = new FileReader();
      reader.onload = () => {
        if (controlName === 'imagen1') {
          this.imagen1Preview = reader.result as string;
        } else {
          this.imagen2Preview = reader.result as string;
        }
      };
      reader.readAsDataURL(file);
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

  // Crear paciente y subir imágenes
  async crearPaciente() {
    if (!this.validarFormulario()) return 0; // ❌ Detener si no es válido
    this.loading = true;

    const email = this.pacienteForm.value.email ;
    const dni = Number(this.pacienteForm.value.dni) ;
    const contraseña = this.pacienteForm.value.password;

    const duplicados = await this.pacientesService.validarDuplicados(email, dni, contraseña);

     if (duplicados.dni) {
      alert('❌ Ya existe un paciente con este DNI.');
      return 0;
    }

    if (duplicados.email) {
      alert('❌ Ya existe un paciente con este email.');
      return 0;
    }
   
    if (duplicados.contraseña) {
      alert('❌ Ya existe un paciente con esta contraseña.');
      return 0;
    }

    const formValues = this.pacienteForm.value;

    // Convertimos a File
    const imagen1File = formValues.imagen1 as File | null;
    const imagen2File = formValues.imagen2 as File | null;

    // Subimos imágenes a Supabase Storage y obtenemos URLs públicas
    const foto1Url = imagen1File
      ? await this.pacientesService.subirImagen(imagen1File, `foto1-${Date.now()}-${imagen1File.name}`)
      : '';

    const foto2Url = imagen2File
      ? await this.pacientesService.subirImagen(imagen2File, `foto2-${Date.now()}-${imagen2File.name}`)
      : '';

    // Creamos objeto Paciente
    const nuevoPaciente: Paciente = {
      nombre: formValues.nombre || "",
      apellido: formValues.apellido || "",
      dni: Number(formValues.dni),
      obraSocial: formValues.obraSocial || "",
      email: formValues.email || "",
      contraseña: formValues.password || "",
      foto1: foto1Url,
      foto2: foto2Url
    };

    try {
      const pacienteCreado = await this.pacientesService.crearPaciente(nuevoPaciente);
      alert(`Paciente creado con ID: ${pacienteCreado.id}`);
      this.pacienteForm.reset();
      return pacienteCreado.id || 0;
    } catch (error) {
      console.error(error);
      alert('Error al crear el paciente');
      return 0;
    } finally {
      this.loading = false;
    }
  }

}

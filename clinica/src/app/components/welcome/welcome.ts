import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgIf } from '@angular/common';
import { EmpleadosService, Empleado } from '../../services/empleados.service';
import { PacientesService, Paciente } from '../../services/pacientes.service';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, NgIf],
  templateUrl: './welcome.html',
  styleUrls: ['./welcome.scss']
})
export class Welcome implements OnInit {

  loading = false;
  empleadosRecientes: Empleado[] = [];
  pacientesRecientes: Paciente[] = [];

  constructor(
    private router: Router,
    private empleadosService: EmpleadosService,
    private pacientesService: PacientesService
  ) { }

  async ngOnInit() {
    await this.cargarImagenesRecientes();
  }

  async cargarImagenesRecientes() {
    try {
      // Cargar empleados recientes con imágenes
      const empleados = await this.empleadosService.obtenerTodos();
      this.empleadosRecientes = empleados
        .filter((emp: Empleado) => emp.imagenPerfil && emp.imagenPerfil.trim() !== '')
        .slice(0, 3); // Máximo 3 empleados

      // Cargar pacientes recientes con imágenes
      const pacientes = await this.pacientesService.obtenerTodos();
      this.pacientesRecientes = pacientes
        .filter((pac: Paciente) => (pac.foto1 && pac.foto1.trim() !== '') || (pac.foto2 && pac.foto2.trim() !== ''))
        .slice(0, 3); // Máximo 3 pacientes

    } catch (error) {
      console.error('Error cargando imágenes:', error);
    }
  }

  private async navigateWithSpinner(target: string) {
    this.loading = true;
    // Espera un pequeño tiempo para que el spinner se muestre
    setTimeout(() => {
      this.router.navigate([target]).finally(() => {
        this.loading = false;
      });
    }, 3000);
  }

  NavegarLogin() {
    void this.navigateWithSpinner('/login');
  }

  NavegarRegistro() {
    void this.navigateWithSpinner('/register');
  }

}

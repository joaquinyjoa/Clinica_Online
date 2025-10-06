import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-welcome',
  imports: [MatProgressSpinnerModule, CommonModule],
  templateUrl: './welcome.html',
  styleUrl: './welcome.scss'
})
export class Welcome {
  loading: boolean = false; // controla si se muestra el spinner

  constructor(private router : Router) { }

  mostrarSpinner(callback: Function) {
    this.loading = true; // mostrar spinner
    setTimeout(() => {   // simula carga de datos
      this.loading = false;
      callback();
    }, 1500); // 1.5 segundos de simulación
  }

  NavegarLogin() {
   this.mostrarSpinner(() => this.router.navigate(['/login']))  ;
  }
  NavegarRegistro() {
    this.mostrarSpinner(() => this.router.navigate(['/register']))  ;
  }
}

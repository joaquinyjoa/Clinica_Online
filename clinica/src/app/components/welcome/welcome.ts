import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgIf } from '@angular/common';
import { fadeInAnimation, bounceInAnimation, slideUpFromBottom, bounceEnterAnimation } from '../../animations/animations';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, NgIf],
  templateUrl: './welcome.html',
  styleUrls: ['./welcome.scss'],
  animations: [fadeInAnimation, bounceInAnimation, slideUpFromBottom, bounceEnterAnimation]
})
export class Welcome {

  constructor(private router: Router) { }
  loading = false;
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

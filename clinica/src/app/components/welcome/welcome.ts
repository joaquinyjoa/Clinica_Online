import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgIf } from '@angular/common';
import { fadeInAnimation, bounceInAnimation, slideUpFromBottom, bounceEnterAnimation } from '../../animations/animations';
import { NavigationService } from '../../services/navigation.service';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, NgIf],
  templateUrl: './welcome.html',
  styleUrls: ['./welcome.scss'],
  animations: [fadeInAnimation, bounceInAnimation, slideUpFromBottom, bounceEnterAnimation]
})
export class Welcome {
  loading = false;

  constructor(
    private router: Router,
    private navigationService: NavigationService
  ) { }

  NavegarLogin() {
    this.navigationService.navigateWithSpinner('/login', (loading) => {
      this.loading = loading;
    });
  }

  NavegarRegistro() {
    this.navigationService.navigateWithSpinner('/register', (loading) => {
      this.loading = loading;
    });
  }
}

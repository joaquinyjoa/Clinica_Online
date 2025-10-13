import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-welcome',
  imports: [CommonModule],
  templateUrl: './welcome.html',
  styleUrls: ['./welcome.scss']
})
export class Welcome {

  constructor(private router: Router) { }

  NavegarLogin() {
    this.router.navigate(['/login']);
  }

  NavegarRegistro() {
    this.router.navigate(['/register']);
  }
}

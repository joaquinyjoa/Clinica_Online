import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./components/welcome/welcome').then(m => m.Welcome) },
  { path: 'login', loadComponent: () => import('./components/login/login').then(m => m.Login) },
  { path: 'register', loadComponent: () => import('./components/register/register').then(m => m.Register),
    children: [
      {path: 'paciente', loadComponent: () => import('./components/paciente/paciente').then(m => m.Paciente)},
      {path: 'especialista', loadComponent: () => import('./components/especialista/especialista').then(m => m.Especialista)}
    ],
   },
];

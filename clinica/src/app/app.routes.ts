import { Routes } from '@angular/router';
import { AdminGuard } from './guards/admin-guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./components/welcome/welcome').then(m => m.Welcome) },
  { path: 'login', loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./components/register/register.component').then(m => m.Register),
    children: [
      {path: 'paciente', loadComponent: () => import('./components/paciente/paciente.component').then(m => m.PacienteComponent)},
      {path: 'especialista', loadComponent: () => import('./components/especialista/especialista.component').then(m => m.EspecialistaComponent)}
    ],
   },
   {path: 'panel-admin', 
    loadComponent: () => import('./components/panel-admin/panel-admin.component').then(m => m.PanelAdminComponent),
    canActivate: [AdminGuard]},
];

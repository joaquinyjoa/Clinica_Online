import { Routes } from '@angular/router';
import { AdminGuard } from './guards/admin-guard';

export const routes: Routes = [
  { 
    path: '', 
    loadComponent: () => import('./components/welcome/welcome').then(m => m.Welcome),
    data: { animation: 'home' }
  },
  { 
    path: 'login', 
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent),
    data: { animation: 'login' }
  },
  { 
    path: 'register', 
    loadComponent: () => import('./components/register/register.component').then(m => m.Register),
    data: { animation: 'register' },
    children: [
      {
        path: 'paciente', 
        loadComponent: () => import('./components/paciente/paciente.component').then(m => m.PacienteComponent),
        data: { animation: 'register-paciente' }
      },
      {
        path: 'especialista', 
        loadComponent: () => import('./components/especialista/especialista.component').then(m => m.EspecialistaComponent),
        data: { animation: 'register-especialista' }
      }
    ],
   },
   {
    path: 'panel-admin', 
    loadComponent: () => import('./components/panel-admin/panel-admin.component').then(m => m.PanelAdminComponent),
    canActivate: [AdminGuard],
    data: { animation: 'panel-admin' }
   },
   {
    path: 'mis-turnos', 
    loadComponent: () => import('./components/mis-turnos/mis-turnos.component').then(m => m.MisTurnosComponent),
    data: { animation: 'mis-turnos' }
   },
   {
    path: 'turnos-especialista', 
    loadComponent: () => import('./components/turnos-especialista/turnos-especialista.component').then(m => m.TurnosEspecialistaComponent),
    data: { animation: 'turnos-especialista' }
   },
   {
    path: 'turnos', 
    loadComponent: () => import('./components/turnos-admin/turnos-admin.component').then(m => m.TurnosAdminComponent),
    canActivate: [AdminGuard],
    data: { animation: 'turnos-admin' }
   },
   {
    path: 'solicitar-turno', 
    loadComponent: () => import('./components/solicitar-turno/solicitar-turno.component').then(m => m.SolicitarTurnoComponent),
    data: { animation: 'solicitar-turno' }
   },
   {
    path: 'mi-perfil', 
    loadComponent: () => import('./components/mi-perfil/mi-perfil.component').then(m => m.MiPerfilComponent),
    data: { animation: 'mi-perfil' }
   },
   {
    path: 'estadisticas', 
    loadComponent: () => import('./components/estadisticas/estadisticas').then(m => m.Estadisticas),
    canActivate: [AdminGuard],
    data: { animation: 'estadisticas' }
   },
];

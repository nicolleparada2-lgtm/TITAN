import { Routes } from '@angular/router';

import { autenticacionGuard } from './core/guards/autenticacion-guard';
import { adminGuard } from './core/guards/admin-guard';
import { usuarioGuard } from './core/guards/usuario-guard';

import { Principal } from './layout/principal/principal';

import { Login } from './pages/login/login';
import { Registro } from './pages/registro/registro';
import { Dashboard } from './pages/dashboard/dashboard';
import { Perfil } from './pages/perfil/perfil';
import { NotificacionesPage } from './pages/notificaciones/notificaciones';
import { Ejercicios } from './pages/ejercicios/ejercicios';
import { Rutinas } from './pages/rutinas/rutinas';
import { Entrenamientos } from './pages/entrenamientos/entrenamientos';
import { Objetivos } from './pages/objetivos/objetivos';
import { Medidas } from './pages/medidas/medidas';
import { Progreso } from './pages/progreso/progreso';
import { Usuarios } from './pages/usuarios/usuarios';
import { Asignaciones } from './pages/asignaciones/asignaciones';
import { MisUsuarios } from './pages/mis-usuarios/mis-usuarios';
import { MensualidadesPage } from './pages/mensualidades/mensualidades';
import { MiMembresia } from './pages/mi-membresia/mi-membresia';
import { PlanesPage } from './pages/planes/planes';


export const routes: Routes = [

  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  {
    path: 'login',
    component: Login
  },

  {
    path: 'registro',
    component: Registro
  },

  {
    path: '',
    component: Principal,
    canActivate: [autenticacionGuard],

    children: [

      {
        path: 'dashboard',
        component: Dashboard
      },

      {
        path: 'perfil',
        component: Perfil
      },

      {
        path: 'notificaciones',
        component: NotificacionesPage
      },

      {
        path: 'planes',
        component: PlanesPage
      },

      {
        path: 'ejercicios',
        component: Ejercicios
      },

      {
        path: 'rutinas',
        component: Rutinas
      },

      {
        path: 'entrenamientos',
        component: Entrenamientos
      },

      {
        path: 'objetivos',
        component: Objetivos
      },

      {
        path: 'medidas',
        component: Medidas
      },

      {
        path: 'progreso',
        component: Progreso
      },

      {
        path: 'mi-membresia',
        component: MiMembresia,
        canActivate: [usuarioGuard]
      },

      {
        path: 'usuarios',
        component: Usuarios,
        canActivate: [adminGuard]
      },

      {
        path: 'asignaciones',
        component: Asignaciones,
        canActivate: [adminGuard]
      },

      {
        path: 'mensualidades',
        component: MensualidadesPage,
        canActivate: [adminGuard]
      },

      {
        path: 'mis-usuarios',
        component: MisUsuarios
      }

    ]
  },

  {
    path: '**',
    redirectTo: 'login'
  }

];
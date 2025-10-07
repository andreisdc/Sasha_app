import { Routes } from '@angular/router';
import { AuthGuard } from '../app/core/guard/auth-guard';
import { AdminGuard } from '../app/core/guard/admin-guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login').then((m) => m.LoginComponent),
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('./pages/sign-up-page/sign-up-page').then((m) => m.SignUpComponent),
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./pages/home-component/home-component').then((m) => m.HomeComponent),
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./pages/profile-page/profile-page').then((m) => m.ProfilePage),
    canActivate: [AuthGuard],
  },
  {
    path: 'become-seller',
    loadComponent: () =>
      import('./pages/become-seller-page/become-seller-page').then((m) => m.BecomeSellerPageComponent),
    canActivate: [AuthGuard],
  },
  
  // ✅ Rute pentru proprietăți
  {
    path: 'properties',
    loadComponent: () =>
      import('./pages/my-properties/my-properties').then((m) => m.MyProperties),
    canActivate: [AuthGuard],
  },
  {
    path: 'add-property',
    loadComponent: () =>
      import('./pages/add-property/add-property').then((m) => m.AddPropertyComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'edit-property/:id', // ✅ RUTĂ NOUĂ PENTRU EDITARE PROPRIETATE
    loadComponent: () =>
      import('./pages/edit-property/edit-property').then((m) => m.EditProperty),
    canActivate: [AuthGuard],
  },
  {
    path: 'property/:id', // ✅ RUTA PENTRU VIZUALIZARE PROPRIETATE
    loadComponent: () =>
      import('./pages/property-details/property-details').then((m) => m.PropertyDetails),
  },

  // ✅ Ruta de admin securizată
  {
    path: 'admin/dashboard',
    loadComponent: () =>
      import('./pages/admin-page/admin-page').then((m) => m.AdminPage),
    canActivate: [AuthGuard, AdminGuard],
  },

  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'home',
    pathMatch: 'full',
  },
];
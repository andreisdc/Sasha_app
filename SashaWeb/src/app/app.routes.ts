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
  {
    path: 'discovery',
    loadComponent: () =>
      import('./pages/destination-page/destination-page').then((m) => m.DestinationPageComponent),
    canActivate: [AuthGuard],
  },   
  {
    path: 'destinations',
    loadComponent: () =>
      import('./pages/destination-county-page/destination-county-page').then((m) => m.DestinationCountyPage),
    canActivate: [AuthGuard],
  },

  
  // ✅ RUTE NOI PENTRU ACTIVITY HOSTING
  {
    path: 'become-activity-host',
    loadComponent: () =>
      import('./pages/become-activity-host/become-activity-host').then((m) => m.BecomeActivityHostComponent),
    canActivate: [AuthGuard],
  },

  {
    path:'properties',
    loadComponent:() =>
      import('./pages/properties-page-component/properties-page-component').then((m)=>m.PropertiesPageComponent),
  },
  
  // ✅ Rute pentru proprietăți
  {
    path: 'myProperties',
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
  }
]
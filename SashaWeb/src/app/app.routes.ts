import { Routes } from '@angular/router';
import { AuthGuard } from '../app/core/guard/auth-guard';
import { AdminGuard } from '../app/core/guard/admin-guard'; // ✅ Adaugă Admin Guard

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
    path: 'becomeSeller',
    loadComponent: () =>
      import('./pages/become-seller-page/become-seller-page').then((m) => m.BecomeSellerPageComponent),
    canActivate: [AuthGuard],
  },
  // ✅ Adaugă ruta de admin securizată
  {
    path: 'admin/dashboard',
    loadComponent: () =>
      import('./pages/admin-page/admin-page').then((m) => m.AdminPage),
    canActivate: [AuthGuard, AdminGuard], // 🔒 Dublă securizare
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
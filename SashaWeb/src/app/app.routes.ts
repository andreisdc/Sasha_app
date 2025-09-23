import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./pages/home-component/home-component').then(
        (m) => m.HomeComponent,
      ),
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('./pages/sign-up-page/sign-up-page').then((m) => m.SignUpPage),
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login', pathMatch: 'full' },
];

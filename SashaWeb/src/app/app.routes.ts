import { Routes } from '@angular/router';
import { SignUpPage } from './sign-up-page/sign-up-page';

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
    path: 'sign-up',
    component: SignUpPage,
  },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: '**', redirectTo: 'home', pathMatch: 'full' },
];

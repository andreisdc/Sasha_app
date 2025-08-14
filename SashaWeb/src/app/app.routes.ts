import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', redirectTo: '', pathMatch: "full" },
    { path: 'login', loadComponent: () => import('./pages/login/login').then(m => m.Login) },
];

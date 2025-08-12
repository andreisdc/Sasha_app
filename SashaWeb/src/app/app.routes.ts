import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', redirectTo: '', pathMatch: "full" },
    { path: 'signin', loadComponent: () => import('./pages/register/register').then(m => m.Register) },
];

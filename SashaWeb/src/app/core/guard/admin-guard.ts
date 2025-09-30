import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth-service';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> | boolean {
    // ✅ Verifică rapid în memorie pentru UX
    const currentUser = this.auth.getCurrentUser();
    if (currentUser && currentUser.isAdmin) {
      return true;
    }

    // ✅ Verifică cu BACKEND-UL pentru securitate reală
    return this.auth.checkAdminAccess().pipe(
      map(response => {
        if (response.hasAccess) {
          return true;
        } else {
          this.router.navigate(['/access-denied']);
          return false;
        }
      }),
      catchError((error) => {
        console.error('Admin guard error:', error);
        this.router.navigate(['/access-denied']);
        return of(false);
      })
    );
  }
}
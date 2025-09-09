import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { LoginRequest } from './request.interface';
import { LoginResponse } from './response.interface';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  // Facem asta constanta globala in ceva fisier pt a o importa toti (mai usor de modificat).
  private readonly apiUrl = 'https://localhost:3000/api'; 

  constructor(private http: HttpClient) {}

  login(userData: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/auth/signin`, userData)
      .pipe(
        tap((response) => {
          if (response.success && response.token) {
            localStorage.setItem('token', response.token);
          }
        }),
        catchError(this.handleError)
      );
  }

  loginWithGoogle(): void {
    //TODO: Google
    console.log('Login with Google not implemented yet');
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errMsg = 'An error occurred during login';

    if (error.error?.message) {
      errMsg = error.error.message;
    } else if (error.status === 400) {
      errMsg = 'Invalid login credentials';
    } else if (error.status === 401) {
      errMsg = 'Invalid email or password';
    } else if (error.status === 404) {
      errMsg = 'User not found';
    }

    return throwError(() => new Error(errMsg));
  }
}

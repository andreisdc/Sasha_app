import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SERVER } from '../../const/constants';
import { tap } from 'rxjs/operators';
import { Observable, BehaviorSubject } from 'rxjs';
import { SignupRequest } from '../interfaces/signupRequest';
import { AuthUser } from '../interfaces/authUser';
import { LoginRequest } from '../interfaces/loginRequest';
import { UpdateUserRequest } from '../interfaces/UpdateUserRequest';

const isBrowser = typeof window !== 'undefined';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = SERVER.BASE_URL + SERVER.AUTH_PATH;
  private currentUserSubject = new BehaviorSubject<AuthUser | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    if (isBrowser) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        this.currentUserSubject.next(JSON.parse(storedUser));
      }
    }
  }

login(email: string, password: string, rememberMe: boolean = false): Observable<AuthUser> {
  const payload: LoginRequest = { email, password, rememberMe };
  return this.http.post<AuthUser>(`${this.baseUrl}/login`, payload).pipe(
    tap((user) => {
      this.currentUserSubject.next(user);

      if (isBrowser) {
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');

        if (rememberMe) {
          localStorage.setItem('user', JSON.stringify(user));
        } else {
          sessionStorage.setItem('user', JSON.stringify(user));
        }
      }
    }),
  );
}

updateUser(data: UpdateUserRequest): Observable<any> {
    return this.http.put(`${this.baseUrl}/update`, data, {
      headers: { 'Content-Type': 'application/json' },
    }).pipe(
      tap((updatedUser: any) => {
        // actualizează BehaviorSubject și localStorage
        this.currentUserSubject.next(updatedUser.user);
        if (isBrowser) {
          localStorage.setItem('user', JSON.stringify(updatedUser.user));
          sessionStorage.setItem('user', JSON.stringify(updatedUser.user));
        }
      })
    );
  }



  signup(user: SignupRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/signup`, user, {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  logout(): void {
    this.currentUserSubject.next(null);
    if (isBrowser) {
      localStorage.removeItem('user');
    }
    // Optionally call backend logout
    this.http.post(`${this.baseUrl}/logout`, {}).subscribe({
      next: () => console.log('Logged out on server'),
      error: (err) => console.error('Logout error', err)
    });
  }

  me(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${this.baseUrl}/me`).pipe(
      tap((user) => {
        this.currentUserSubject.next(user);
        if (isBrowser) {
          localStorage.setItem('user', JSON.stringify(user));
        }
      }),
    );
  }

  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  getToken(): string | null {
    return this.currentUserSubject.value?.token || null;
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }
}

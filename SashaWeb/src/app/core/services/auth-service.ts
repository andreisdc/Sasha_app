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
      const storedUser =
        localStorage.getItem('user') || sessionStorage.getItem('user');
      if (storedUser) {
        this.setCurrentUser(JSON.parse(storedUser));
      }
    }
  }

  /** Setează user-ul curent în BehaviorSubject și storage */
  setCurrentUser(user: AuthUser | null, rememberMe?: boolean): void {
    this.currentUserSubject.next(user);

    if (!isBrowser) return;

    if (user) {
      if (rememberMe) {
        localStorage.setItem('user', JSON.stringify(user));
        sessionStorage.removeItem('user');
      } else {
        sessionStorage.setItem('user', JSON.stringify(user));
        localStorage.removeItem('user');
      }
    } else {
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
    }
  }

  login(email: string, password: string, rememberMe: boolean = false): Observable<AuthUser> {
    return this.http
      .post<AuthUser>(`${this.baseUrl}/login`, { email, password, rememberMe }, { withCredentials: true })
      .pipe(
        tap(user => this.setCurrentUser(user, rememberMe))
      );
  }

  signup(user: SignupRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/signup`, user, {
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true,
    });
  }

  logout(): void {
    this.setCurrentUser(null);
    if (isBrowser) {
      localStorage.clear();
      sessionStorage.clear();
    }
    this.http.post(`${this.baseUrl}/logout`, {}, { withCredentials: true })
      .subscribe({
        next: () => console.log('Logged out on server'),
        error: err => console.error('Logout error', err)
      });
  }

  me(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${this.baseUrl}/me`, { withCredentials: true })
      .pipe(
        tap(user => this.setCurrentUser(user))
      );
  }

   // ✅ METODĂ NOUĂ - Verifică acces admin cu backend-ul
  checkAdminAccess(): Observable<{ hasAccess: boolean }> {
    return this.http.get<{ hasAccess: boolean }>(`${this.baseUrl}/check-admin`, { 
      withCredentials: true 
    });
  }

  // ✅ METODĂ NOUĂ - Verifică acces seller cu backend-ul
  checkSellerAccess(): Observable<{ hasAccess: boolean }> {
    return this.http.get<{ hasAccess: boolean }>(`${this.baseUrl}/check-seller`, { 
      withCredentials: true 
    });
  }

  updateUser(data: Partial<AuthUser>): Observable<AuthUser> {
    return this.http.put(`${this.baseUrl}/update`, data, {
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true,
    }).pipe(
      tap((res: any) => this.setCurrentUser(res.user))
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

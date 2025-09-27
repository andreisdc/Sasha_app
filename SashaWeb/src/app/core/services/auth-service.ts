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
      const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (storedUser) {
        this.currentUserSubject.next(JSON.parse(storedUser));
      }
    }
  }

  /** Login user and store data in localStorage or sessionStorage depending on rememberMe */
  login(email: string, password: string, rememberMe: boolean = false): Observable<AuthUser> {
  return this.http.post<AuthUser>(`${this.baseUrl}/login`, { email, password, rememberMe }, { withCredentials: true }).pipe(
    tap(user => {
      this.currentUserSubject.next(user);
      if (isBrowser) {
        localStorage.setItem('user', JSON.stringify(user));
        sessionStorage.setItem('user', JSON.stringify(user));
      }
    })
  );
}


  /** Signup a new user */
  signup(user: SignupRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/signup`, user, {
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true
    });
  }

  /** Logout user and clear storage */
  logout(): void {
    this.currentUserSubject.next(null);
    if (isBrowser) {
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
    }

    this.http.post(`${this.baseUrl}/logout`, {}, { withCredentials: true }).subscribe({
      next: () => console.log('Logged out on server'),
      error: (err) => console.error('Logout error', err)
    });
  }

  /** Get current user from backend */
  me(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${this.baseUrl}/me`, { withCredentials: true }).pipe(
      tap((user) => {
        this.currentUserSubject.next(user);
        if (isBrowser) {
          localStorage.setItem('user', JSON.stringify(user));
          sessionStorage.setItem('user', JSON.stringify(user));
        }
      }),
    );
  }

  /** Update user profile */
  updateUser(data: UpdateUserRequest): Observable<any> {
    return this.http.put(`${this.baseUrl}/update`, data, {
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true
    }).pipe(
      tap((res: any) => {
        const updatedUser = res.user as AuthUser;
        this.currentUserSubject.next(updatedUser);

        if (isBrowser) {
          localStorage.setItem('user', JSON.stringify(updatedUser));
          sessionStorage.setItem('user', JSON.stringify(updatedUser));
        }
      })
    );
  }

  /** Check if user is logged in */
  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  /** Get stored token */
  getToken(): string | null {
    return this.currentUserSubject.value?.token || null;
  }

  /** Get current user value */
  getCurrentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SERVER } from '../../const/constants';
import { tap } from 'rxjs/operators';
import { Observable, BehaviorSubject } from 'rxjs';

export interface AuthUser {
  username: string;
  email: string;
  token?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = SERVER.BASE_URL + SERVER.AUTH_PATH;
  private currentUserSubject = new BehaviorSubject<AuthUser | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      this.currentUserSubject.next(JSON.parse(storedUser));
    }
  }

  login(email: string, password: string, rememberMe: boolean = false): Observable<AuthUser> {
    return this.http.post<AuthUser>(`${this.baseUrl}/login`, { email, password, rememberMe })
      .pipe(
        tap(user => {
          this.currentUserSubject.next(user);
          if (rememberMe) {
            localStorage.setItem('user', JSON.stringify(user));
          }
        })
      );
  }

  signup(user: { username: string; email: string; password: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/signup`, user);
  }

  logout() {
    this.currentUserSubject.next(null);
    localStorage.removeItem('user');
  }

  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }
}

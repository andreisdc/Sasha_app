import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SERVER } from '../../const/constants';
import { tap, map, catchError } from 'rxjs/operators';
import { Observable, BehaviorSubject, of } from 'rxjs';
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
  
  // ✅ Subject nou pentru a ști când am terminat verificarea inițială
  private authCheckedSubject = new BehaviorSubject<boolean>(false);
  authChecked$ = this.authCheckedSubject.asObservable();

  constructor(private http: HttpClient) {
    console.log('🔐 AuthService initializat - URL:', this.baseUrl);
    this.initializeAuthState();
  }

  /** 
   * ✅ Verificare ASINCRONĂ și NEBLOCHANTĂ a stării de autentificare
   */
  private initializeAuthState(): void {
    if (!isBrowser) {
      console.log('ℹ️ AuthService - Nu suntem în browser, skip verificare');
      this.authCheckedSubject.next(true);
      return;
    }

    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        console.log('🔄 AuthService - User găsit în storage, verificare validitate...');
        
        // ✅ Setează user-ul imediat (pentru UI) dar verifică în background
        this.currentUserSubject.next(user);
        
        // ✅ Verificare în background fără a bloca aplicația
        this.http.get<AuthUser>(`${this.baseUrl}/me`, { withCredentials: true })
          .subscribe({
            next: (freshUser) => {
              console.log('✅ /me request successful - User valid:', freshUser.email);
              this.currentUserSubject.next(freshUser); // ✅ Actualizează cu datele fresh
              this.authCheckedSubject.next(true);
            },
            error: (error) => {
              console.log('❌ /me request failed - Token invalid/expirat. Eroare:', error.message);
              this.clearStorage();
              this.currentUserSubject.next(null);
              this.authCheckedSubject.next(true);
            }
          });
      } catch (error) {
        console.error('❌ Eroare la parsarea user-ului din storage:', error);
        this.clearStorage();
        this.currentUserSubject.next(null);
        this.authCheckedSubject.next(true);
      }
    } else {
      console.log('ℹ️ AuthService - Niciun user găsit în storage');
      this.authCheckedSubject.next(true);
    }
  }

  /** 
   * ✅ METODĂ NOUĂ - Așteaptă finalizarea verificării inițiale
   */
  waitForAuthCheck(): Observable<boolean> {
    return this.authChecked$.pipe(
      tap(checked => console.log('⏳ WaitForAuthCheck - Verificare completă:', checked))
    );
  }

  /** Setează user-ul curent în BehaviorSubject și storage */
  setCurrentUser(user: AuthUser | null, rememberMe?: boolean): void {
    console.log('👤 setCurrentUser - Actualizare user:', user ? `User ID: ${user.id}` : 'null');
    this.currentUserSubject.next(user);

    if (!isBrowser) return;

    if (user) {
      if (rememberMe) {
        console.log('💾 setCurrentUser - Salvare în localStorage (rememberMe)');
        localStorage.setItem('user', JSON.stringify(user));
        sessionStorage.removeItem('user');
      } else {
        console.log('💾 setCurrentUser - Salvare în sessionStorage');
        sessionStorage.setItem('user', JSON.stringify(user));
        localStorage.removeItem('user');
      }
    } else {
      this.clearStorage();
    }
  }

  /** Metodă helper pentru ștergerea storage-ului */
  private clearStorage(): void {
    console.log('🗑️ clearStorage - Ștergere user din storage');
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
  }

  login(email: string, password: string, rememberMe: boolean = false): Observable<AuthUser> {
    console.log('🔑 Login attempt pentru:', email, 'rememberMe:', rememberMe);
    return this.http
      .post<AuthUser>(`${this.baseUrl}/login`, { email, password, rememberMe }, { withCredentials: true })
      .pipe(
        tap(user => {
          console.log('✅ Login successful - User autentificat:', user.email);
          this.setCurrentUser(user, rememberMe);
        })
      );
  }

  signup(user: SignupRequest): Observable<any> {
    console.log('📝 Signup attempt pentru:', user.email);
    return this.http.post(`${this.baseUrl}/signup`, user, {
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true,
    });
  }

  logout(): void {
    console.log('🚪 Logout - Începere proces de delogare');
    // Șterge din BehaviorSubject
    this.currentUserSubject.next(null);
    
    // Șterge tot din storage-uri
    if (isBrowser) {
      console.log('🗑️ Logout - Curățare storage-uri');
      localStorage.clear();
      sessionStorage.clear();
    }
    
    // Logout pe server
    this.http.post(`${this.baseUrl}/logout`, {}, { withCredentials: true })
      .subscribe({
        next: () => console.log('✅ Logout successful pe server'),
        error: err => console.error('❌ Logout error', err)
      });
  }

  me(): Observable<AuthUser> {
    console.log('🔍 AuthService.me() - Verificare sesiune curentă');
    return this.http.get<AuthUser>(`${this.baseUrl}/me`, { withCredentials: true })
      .pipe(
        tap(user => {
          console.log('✅ Me request successful - User:', user.email);
          this.setCurrentUser(user);
        })
      );
  }

  // ✅ METODĂ NOUĂ - Verifică acces admin cu backend-ul
  checkAdminAccess(): Observable<{ hasAccess: boolean }> {
    console.log('👮 CheckAdminAccess - Verificare drepturi admin');
    return this.http.get<{ hasAccess: boolean }>(`${this.baseUrl}/check-admin`, { 
      withCredentials: true 
    }).pipe(
      tap(response => {
        console.log('✅ CheckAdminAccess - Răspuns de la server:', response);
        if (response.hasAccess) {
          console.log('🎉 CheckAdminAccess - Acces ADMIN permis!');
        } else {
          console.log('🚫 CheckAdminAccess - Acces ADMIN respins!');
        }
      }),
      catchError(error => {
        console.error('❌ CheckAdminAccess - Eroare la verificare admin:', error);
        // Returnează un răspuns default în caz de eroare
        return of({ hasAccess: false });
      })
    );
  }

  // ✅ METODĂ NOUĂ - Verifică acces seller cu backend-ul
  checkSellerAccess(): Observable<{ hasAccess: boolean }> {
    console.log('🏪 CheckSellerAccess - Verificare drepturi seller');
    return this.http.get<{ hasAccess: boolean }>(`${this.baseUrl}/check-seller`, { 
      withCredentials: true 
    });
  }

  updateUser(data: Partial<AuthUser>): Observable<AuthUser> {
    console.log('✏️ UpdateUser - Actualizare date user:', data);
    return this.http.put(`${this.baseUrl}/update`, data, {
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true,
    }).pipe(
      tap((res: any) => {
        console.log('✅ UpdateUser successful - User actualizat');
        this.setCurrentUser(res.user);
      })
    );
  }

  isLoggedIn(): boolean {
    const loggedIn = !!this.currentUserSubject.value;
    console.log('🔍 isLoggedIn check:', loggedIn);
    return loggedIn;
  }

  getToken(): string | null {
    const token = this.currentUserSubject.value?.token || null;
    console.log('🔑 getToken - Token disponibil:', !!token);
    return token;
  }

  getCurrentUser(): AuthUser | null {
    const user = this.currentUserSubject.value;
    console.log('👤 getCurrentUser - User curent:', user ? user.email : 'null');
    return user;
  }
}
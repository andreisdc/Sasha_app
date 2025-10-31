import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SERVER } from '../../const/constants';
import { tap, catchError } from 'rxjs/operators';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { SignupRequest } from '../interfaces/signupRequest';
import { AuthUser } from '../interfaces/authUser';

const isBrowser = typeof window !== 'undefined';

// ====================================================================
// ✅ NOU: Definim un tip pentru obiectul "mic" pe care îl stocăm.
// Este totul din AuthUser, CU EXCEPȚIA pozei de profil.
// ====================================================================
type StoredUser = Omit<AuthUser, 'profilePicture'>;

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = SERVER.BASE_URL + SERVER.AUTH_PATH;

  // ✅ currentUserSubject va ține obiectul COMPLET (cu poză) în memorie
  private currentUserSubject = new BehaviorSubject<AuthUser | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();
  
  private authCheckedSubject = new BehaviorSubject<boolean>(false);
  authChecked$ = this.authCheckedSubject.asObservable();

  constructor(private http: HttpClient) {
    console.log('🔐 AuthService initializat - URL:', this.baseUrl);
    this.initializeAuthState();
  }

  /** * ✅ Verificare ASINCRONĂ și NEBLOCHANTĂ - Actualizată
   */
  private initializeAuthState(): void {
    if (!isBrowser) {
      console.log('ℹ️ AuthService - Nu suntem în browser, skip verificare');
      this.authCheckedSubject.next(true);
      return;
    }

    // Căutăm user-ul "MIC" (fără poză) în storage
    const storedUserJson = localStorage.getItem('user') || sessionStorage.getItem('user');
    
    if (storedUserJson) {
      try {
        // Acesta este user-ul "MIC"
        const user: StoredUser = JSON.parse(storedUserJson);
        console.log('🔄 AuthService - User (mic) găsit în storage, verificare validitate...');
        
        // Setează user-ul (fără poză) imediat pentru UI, ca să nu aștepte
        // @ts-ignore
        this.currentUserSubject.next({ ...user, profilePicture: null });
        
        // Acum, cerem de la /me user-ul COMPLET (cu poză)
        this.http.get<AuthUser>(`${this.baseUrl}/me`, { withCredentials: true })
          .subscribe({
            next: (freshUser) => {
              console.log('✅ /me request successful - User COMPLET (cu poză) primit:', freshUser.email);
              // Acum apelăm setCurrentUser, care va salva user-ul COMPLET în memorie
              // și pe cel MIC (fără poză) înapoi în storage.
              this.setCurrentUser(freshUser, !!localStorage.getItem('user')); // Verificăm dacă era în localStorage
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

  waitForAuthCheck(): Observable<boolean> {
    return this.authChecked$.pipe(
      tap(checked => console.log('⏳ WaitForAuthCheck - Verificare completă:', checked))
    );
  }

  // ===========================================
  // ✅ FUNCȚIA setCurrentUser CORECTATĂ
  // ===========================================
  /** * Setează user-ul. 
   * 1. Salvează user-ul COMPLET (cu poză) în BehaviorSubject (memorie).
   * 2. Salvează user-ul MIC (fără poză) în localStorage/sessionStorage.
   */
  setCurrentUser(user: AuthUser | null, rememberMe?: boolean): void {
    console.log('👤 setCurrentUser - Actualizare user:', user ? `User ID: ${user.id}` : 'null');
    
    // PASUL 1: Salvează user-ul COMPLET (cu poză) în memorie
    this.currentUserSubject.next(user);

    if (!isBrowser) return;

    if (user) {
      // PASUL 2: Creează un obiect "mic" FĂRĂ POZĂ pentru storage
      const userToStore: StoredUser = {
        id: user.id,
        token: user.token,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        expiresAt: user.expiresAt,
        isAdmin: user.isAdmin,
        isSeller: user.isSeller,
        phoneNumber: user.phoneNumber,
        rating: user.rating
        // Am exclus intenționat 'profilePicture'
      };

      // PASUL 3: Salvează doar obiectul MIC în storage
      // Aceasta nu va mai da eroarea QuotaExceededError
      if (rememberMe) {
        console.log('💾 setCurrentUser - Salvare user MIC în localStorage (rememberMe)');
        localStorage.setItem('user', JSON.stringify(userToStore));
        sessionStorage.removeItem('user');
      } else {
        console.log('💾 setCurrentUser - Salvare user MIC în sessionStorage');
        sessionStorage.setItem('user', JSON.stringify(userToStore));
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
        tap(user => { // 'user' este obiectul MARE de la backend
          console.log('✅ Login successful - User autentificat:', user.email);
          // Trimitem obiectul MARE (cu poză) către setCurrentUser
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
          // /me trimite obiectul MARE (cu poză)
          this.setCurrentUser(user);
        })
      );
  }

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
        return of({ hasAccess: false });
      })
    );
  }

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
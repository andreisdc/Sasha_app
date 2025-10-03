import { Component, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../app/core/services/auth-service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit, OnDestroy {
  protected title = 'SashaAppWeb';
  private destroy$ = new Subject<void>();

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    console.log('🚀 App Component - Initializare aplicație');
    
    // ✅ Așteaptă finalizarea verificării de autentificare
    this.authService.waitForAuthCheck()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (authChecked) => {
          if (authChecked) {
            console.log('✅ App Component - Verificarea autentificării este completă');
            this.handleAuthState();
          }
        },
        error: (error) => {
          console.error('❌ App Component - Eroare la verificarea autentificării:', error);
        }
      });
  }

  private handleAuthState(): void {
    const isLoggedIn = this.authService.isLoggedIn();
    const currentUser = this.authService.getCurrentUser();
    
    console.log('🔐 App Component - Stare autentificare:', {
      isLoggedIn,
      user: currentUser ? `${currentUser.email} (ID: ${currentUser.id})` : 'null',
    });

    if (isLoggedIn && currentUser) {
      console.log('🎉 App Component - Utilizatorul este autentificat:', currentUser.email);
      
      // Poți face acțiuni suplimentare aici dacă este necesar
      // De exemplu: preluare date suplimentare, verificare permisiuni, etc.
      
    } else {
      console.log('ℹ️ App Component - Utilizatorul nu este autentificat');
      // Poți face acțiuni pentru utilizatorii neautentificați dacă este necesar
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
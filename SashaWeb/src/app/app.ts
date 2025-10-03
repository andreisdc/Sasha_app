import { Component, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../app/core/services/auth-service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit, OnDestroy {
  protected title = 'SashaAppWeb';
  private destroy$ = new Subject<void>();
  protected isLoading = true; // ✅ Stare pentru loading

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
            this.isLoading = false; // ✅ Oprim loading-ul
          }
        },
        error: (error) => {
          console.error('❌ App Component - Eroare la verificarea autentificării:', error);
          this.isLoading = false; // ✅ Oprim loading-ul chiar și la eroare
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
      // Acțiuni suplimentare pentru utilizatorii autentificați
    } else {
      console.log('ℹ️ App Component - Utilizatorul nu este autentificat');
      // Acțiuni pentru utilizatorii neautentificați
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
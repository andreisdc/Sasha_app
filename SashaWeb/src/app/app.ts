import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, NgZone, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../app/core/services/auth-service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit, OnDestroy {
  protected title = 'SashaAppWeb';
  protected isLoading = true;

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private ngZone: NgZone,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('🚀 App Component - Initializare aplicație');

    this.authService
      .waitForAuthCheck()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (authChecked) => {
          this.ngZone.run(() => {
            if (authChecked) {
              console.log('✅ Verificarea autentificării este completă');
              this.handleAuthState();
            } else {
              console.warn('⚠️ waitForAuthCheck() a returnat false');
            }
            this.isLoading = false;
            this.cdRef.markForCheck(); // ✅ Forțează refresh UI
          });
        },
        error: (error) => {
          this.ngZone.run(() => {
            console.error('❌ Eroare la verificarea autentificării:', error);
            this.isLoading = false;
            this.cdRef.markForCheck(); // ✅ UI se actualizează și în caz de eroare
          });
        },
      });
  }

  private handleAuthState(): void {
    const isLoggedIn = this.authService.isLoggedIn();
    const currentUser = this.authService.getCurrentUser();

    console.log('🔐 Stare autentificare:', {
      isLoggedIn,
      user: currentUser ? `${currentUser.email} (ID: ${currentUser.id})` : 'null',
    });

    if (isLoggedIn && currentUser) {
      console.log('🎉 Utilizatorul este autentificat:', currentUser.email);
    } else {
      console.log('ℹ️ Utilizatorul nu este autentificat');
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

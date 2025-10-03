import { Component, HostListener, Inject, OnInit, OnDestroy, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { NgOptimizedImage } from '@angular/common';
import { AuthService } from '../../core/services/auth-service';
import { AuthUser } from '../../core/interfaces/authUser';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.less'],
})
export class Navbar implements OnInit, OnDestroy {
  user: AuthUser | null = null;
  isLoggedIn = false;
  avatarColor = '';
  dropdownOpen = false;
  isBrowser: boolean;
  isAdminView = false;
  
  // ✅ Stare de loading care ascunde navbar-ul până când știm sigur starea de autentificare
  isLoading = true;

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private authService: AuthService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  async ngOnInit() {
    if (!this.isBrowser) {
      this.isLoading = false;
      return;
    }

    console.log('🔄 Navbar - Începere inițializare, aștept verificare auth...');

    // ✅ 1. Așteaptă verificarea inițială să fie completă ÎNAINTE de a afișa orice
    this.authService.waitForAuthCheck()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (checked) => {
          if (checked) {
            console.log('✅ Navbar - Verificare autentificare completă, ascund loading-ul');
            this.isLoading = false;
          }
        },
        error: (error) => {
          console.error('❌ Navbar - Eroare la waitForAuthCheck:', error);
          this.isLoading = false; // Asigură-te că loading-ul se oprește și la eroare
        }
      });

    // ✅ 2. Ascultă modificările de stare din AuthService în timp real
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          console.log('🔄 Navbar - Stare utilizator actualizată:', user?.email || 'null');
          this.user = user;
          this.isLoggedIn = !!user;
          
          // ✅ Actualizează starea adminView doar dacă user-ul este admin
          if (user?.isAdmin) {
            const adminView = localStorage.getItem('adminView') || sessionStorage.getItem('adminView');
            this.isAdminView = adminView === 'true';
          } else {
            this.isAdminView = false;
          }
          
          this.setAvatarColor();
        },
        error: (error) => {
          console.error('❌ Navbar - Eroare la subscription user:', error);
          this.isLoading = false;
        }
      });
  }

  toggleDropdown() { 
    this.dropdownOpen = !this.dropdownOpen; 
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-info')) {
      this.dropdownOpen = false;
    }
  }

  goToLogin() { 
    this.router.navigate(['/login']); 
  }

  goToProfile() { 
    this.dropdownOpen = false; 
    this.router.navigate(['/profile']); 
  }

  becomeSeller() { 
    this.dropdownOpen = false; 
    this.router.navigate(['/become-seller']); 
  }

  goToProperties() { 
    this.dropdownOpen = false; 
    this.router.navigate(['/properties']); 
  }

  goToHistory() { 
    this.dropdownOpen = false; 
    this.router.navigate(['/history']); 
  }

  // ✅ Navigare directă către Admin Dashboard
  goToAdminDashboard() {
    console.log('🎯 goToAdminDashboard - Navigare către dashboard');
    if (this.user?.isAdmin) {
      this.isAdminView = true;
      
      // Salvează preferința
      if (this.isBrowser) {
        const storage = localStorage.getItem('user') ? localStorage : sessionStorage;
        storage.setItem('adminView', 'true');
      }
      
      this.router.navigate(['/admin/dashboard']);
    }
  }

  // ✅ Comutare mod admin fără navigare
  toggleAdminView() {
    console.log('🔄 toggleAdminView - Comutare mod');
    if (this.user?.isAdmin) {
      this.isAdminView = !this.isAdminView;
      
      // Salvează preferința
      if (this.isBrowser) {
        const storage = localStorage.getItem('user') ? localStorage : sessionStorage;
        storage.setItem('adminView', this.isAdminView.toString());
      }
      
      console.log('✅ toggleAdminView - Mod admin:', this.isAdminView);
      this.dropdownOpen = false;
    }
  }

  logout() {
    console.log('🚪 Navbar - Logout inițiat');
    
    // ✅ Resetează starea locală imediat pentru feedback vizual instant
    this.isLoggedIn = false;
    this.user = null;
    this.isAdminView = false;
    this.dropdownOpen = false;

    // ✅ Șterge preferințele
    if (this.isBrowser) {
      localStorage.removeItem('adminView');
      sessionStorage.removeItem('adminView');
      localStorage.removeItem('avatarColor');
    }

    // ✅ Apelează logout-ul din AuthService (care va emite change-ul prin currentUser$)
    this.authService.logout();
    
    console.log('✅ Navbar - Logout complet, navigare către login');
    this.router.navigate(['/login']);
  }

  private setAvatarColor() {
    if (!this.isBrowser || !this.user) return;
    
    const savedColor = localStorage.getItem('avatarColor') || sessionStorage.getItem('avatarColor');
    if (savedColor) {
      this.avatarColor = savedColor;
    } else {
      const colors = ['#FF5733', '#33B5FF', '#28A745', '#FFC107', '#9C27B0'];
      this.avatarColor = colors[Math.floor(Math.random() * colors.length)];
      const storage = localStorage.getItem('user') ? localStorage : sessionStorage;
      storage.setItem('avatarColor', this.avatarColor);
    }
  }

  // ✅ getter pentru profile picture
  get displayProfilePicture(): string {
    if (this.user?.profilePicture?.trim()) return this.user.profilePicture;
    return 'assets/default-avatar.png';
  }

  get userInitial(): string {
    return this.user?.username?.charAt(0).toUpperCase() || 'U';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
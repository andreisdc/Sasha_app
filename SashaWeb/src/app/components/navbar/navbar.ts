import { Component, HostListener, Inject, OnInit, OnDestroy, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { NgOptimizedImage } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { AuthService } from '../../core/services/auth-service';
import { AuthUser } from '../../core/interfaces/authUser'; // ✅ Folosește interface-ul din core
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.less'],
  animations: [
    trigger('dropdownAnimation', [
      transition(':enter', [
        style({ 
          opacity: 0, 
          transform: 'translateY(-10px) scale(0.95)',
          transformOrigin: 'top right'
        }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', 
          style({ 
            opacity: 1, 
            transform: 'translateY(0) scale(1)'
          }))
      ]),
      transition(':leave', [
        animate('200ms cubic-bezier(0.4, 0, 0.2, 1)', 
          style({ 
            opacity: 0, 
            transform: 'translateY(-10px) scale(0.95)'
          }))
      ])
    ]),
    trigger('navItemAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-20px)' }),
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', 
          style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
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
            this.setAvatarColor();
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

    // ✅ 3. Setează avatar color dacă browser-ul este disponibil
    if (this.isBrowser) {
      this.setAvatarColor();
    }
  }

  /**
   * Comută dropdown-ul utilizatorului
   */
  toggleDropdown(): void { 
    this.dropdownOpen = !this.dropdownOpen; 
  }

  /**
   * Ascultă click-urile în afara dropdown-ului pentru a-l închide
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-info') && !target.closest('.dropdown')) {
      this.dropdownOpen = false;
    }
  }

  /**
   * Navighează către pagina de login
   */
  goToLogin(): void { 
    this.dropdownOpen = false;
    this.router.navigate(['/login']); 
  }

  /**
   * Navighează către profilul utilizatorului
   */
  goToProfile(): void { 
    this.dropdownOpen = false; 
    this.router.navigate(['/profile']); 
  }

  /**
   * Navighează către pagina pentru a deveni seller
   */
  becomeSeller(): void { 
    this.dropdownOpen = false; 
    this.router.navigate(['/become-seller']); 
  }

  /**
   * Navighează către proprietățile utilizatorului
   */
  goToProperties(): void { 
    this.dropdownOpen = false; 
    this.router.navigate(['/properties']); 
  }

  /**
   * Navighează către istoricul de rezervări
   */
  goToHistory(): void { 
    this.dropdownOpen = false; 
    this.router.navigate(['/history']); 
  }

  /**
   * Navighează către wishlist
   */
  goToWishlist(): void {
    this.dropdownOpen = false;
    this.router.navigate(['/wishlist']);
  }

  /**
   * Navighează către pagina de listare proprietăți
   */
  goToListProperty(): void {
    this.dropdownOpen = false;
    this.router.navigate(['/list-property']);
  }

  /**
   * Navigare directă către Admin Dashboard
   */
  goToAdminDashboard(): void {
    console.log('🎯 goToAdminDashboard - Navigare către dashboard');
    if (this.user?.isAdmin) {
      this.isAdminView = true;
      
      // Salvează preferința
      if (this.isBrowser) {
        const storage = localStorage.getItem('user') ? localStorage : sessionStorage;
        storage.setItem('adminView', 'true');
      }
      
      this.router.navigate(['/admin/dashboard']);
    } else {
      console.warn('⚠️ goToAdminDashboard - Utilizatorul nu are drepturi de admin');
    }
  }

  /**
   * Comutare mod admin fără navigare
   */
  toggleAdminView(): void {
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

      // Emite un event pentru a notifica alte componente despre schimbarea modului
      this.emitViewModeChange();
    } else {
      console.warn('⚠️ toggleAdminView - Utilizatorul nu are drepturi de admin');
    }
  }

  /**
   * Deloghează utilizatorul
   */
  logout(): void {
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

  /**
   * Setează culoarea avatarului
   */
  private setAvatarColor(): void {
    if (!this.isBrowser) return;
    
    // Dacă avem deja o culoare salvată, o folosim
    const savedColor = localStorage.getItem('avatarColor') || sessionStorage.getItem('avatarColor');
    if (savedColor) {
      this.avatarColor = savedColor;
      return;
    }

    // Dacă nu avem o culoare salvată, generăm una nouă
    if (this.user) {
      const colors = [
        '#FF5733', '#33B5FF', '#28A745', '#FFC107', '#9C27B0',
        '#E91E63', '#00BCD4', '#8BC34A', '#FF9800', '#673AB7',
        '#3F51B5', '#009688', '#FF5722', '#795548', '#607D8B'
      ];
      
      // Folosim username-ul pentru a genera o culoare consistentă
      const username = this.user.username || 'user';
      const colorIndex = this.hashString(username) % colors.length;
      this.avatarColor = colors[colorIndex];
      
      // Salvăm culoarea pentru sesiunea curentă
      const storage = localStorage.getItem('user') ? localStorage : sessionStorage;
      storage.setItem('avatarColor', this.avatarColor);
    } else {
      // Culoare default pentru utilizatorii neautentificați
      this.avatarColor = '#6B7280';
    }
  }

  /**
   * Generează un hash numeric dintr-un string
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Emite un event pentru schimbarea modului de vizualizare
   */
  private emitViewModeChange(): void {
    const event = new CustomEvent('viewModeChanged', {
      detail: { isAdminView: this.isAdminView }
    });
    window.dispatchEvent(event);
  }

  /**
   * Getter pentru profile picture
   */
  get displayProfilePicture(): string {
    if (this.user?.profilePicture?.trim()) {
      return this.user.profilePicture;
    }
    return 'assets/default-avatar.png';
  }

  /**
   * Getter pentru inițialele utilizatorului
   */
  get userInitial(): string {
    return this.user?.username?.charAt(0).toUpperCase() || 'U';
  }

  /**
   * Getter pentru numele complet al utilizatorului (trunchiat dacă este prea lung)
   */
  get displayUsername(): string {
    const username = this.user?.username || 'User';
    return username.length > 15 ? username.substring(0, 15) + '...' : username;
  }

  /**
   * Getter pentru email-ul utilizatorului (trunchiat dacă este prea lung)
   */
  get displayEmail(): string {
    const email = this.user?.email || 'Premium Member';
    return email.length > 25 ? email.substring(0, 25) + '...' : email;
  }

  /**
   * Verifică dacă utilizatorul este seller și nu este în modul admin
   */
  get canShowSellerOptions(): boolean {
    return !!this.user?.isSeller && !this.isAdminView;
  }

  /**
   * Verifică dacă butonul "Become Seller" trebuie afișat
   */
  get showBecomeSeller(): boolean {
    return !this.user?.isSeller && !this.isAdminView;
  }

  /**
   * Cleanup la distrugerea componentei
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
import { Component, HostListener, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { NgOptimizedImage } from '@angular/common';
import { AuthService } from '../../core/services/auth-service';
import { AuthUser } from '../../core/interfaces/authUser';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.less'],
})
export class Navbar implements OnInit {
  user: AuthUser | null = null;
  isLoggedIn = false;
  avatarColor = '';
  dropdownOpen = false;
  isBrowser: boolean;
  isAdminView = false; // ✅ Nouă variabilă pentru modul admin

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private authService: AuthService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  async ngOnInit() {
  if (this.isBrowser) {
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (storedUser) {
      this.user = JSON.parse(storedUser);
      this.isLoggedIn = true;
      
      // ✅ Folosește ?? false pentru a trata undefined
      const adminView = localStorage.getItem('adminView') || sessionStorage.getItem('adminView');
      this.isAdminView = adminView === 'true' && (this.user?.isAdmin ?? false);
    } else {
      try {
        this.user = await firstValueFrom(this.authService.me());
        this.isLoggedIn = !!this.user;
        
        // ✅ Aici la fel
        if (this.user?.isAdmin) {
          const adminView = localStorage.getItem('adminView') || sessionStorage.getItem('adminView');
          this.isAdminView = adminView === 'true' && (this.user?.isAdmin ?? false);
        }
      } catch {
        this.user = null;
        this.isLoggedIn = false;
      }
    }
    this.setAvatarColor();
  }
}

  toggleDropdown() { this.dropdownOpen = !this.dropdownOpen; }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-info')) {
      this.dropdownOpen = false;
    }
  }

  goToLogin() { this.router.navigate(['/login']); }
  goToProfile() { this.router.navigate(['/profile']); this.dropdownOpen = false; }
  becomeSeller() { this.dropdownOpen = false; this.router.navigate(['/become-seller']); }
  goToProperties() { this.dropdownOpen = false; this.router.navigate(['/properties']); }
  goToHistory() { this.dropdownOpen = false; this.router.navigate(['/history']); }

  // ✅ Nouă metodă pentru comutarea între moduri
  toggleAdminView() {
    if (this.user?.isAdmin) {
      this.isAdminView = !this.isAdminView;
      
      // Salvează preferința
      if (this.isBrowser) {
        const storage = localStorage.getItem('user') ? localStorage : sessionStorage;
        storage.setItem('adminView', this.isAdminView.toString());
      }
      
      // Redirecționează către dashboard-ul admin sau înapoi la home
      if (this.isAdminView) {
        this.router.navigate(['/admin/dashboard']);
      } else {
        this.router.navigate(['/home']);
      }
      
      this.dropdownOpen = false;
    }
  }

  logout() {
    // ✅ Resetează și modul admin la logout
    if (this.isBrowser) {
      localStorage.removeItem('adminView');
      sessionStorage.removeItem('adminView');
    }
    this.isAdminView = false;
    this.authService.logout();
    this.isLoggedIn = false;
    this.user = null;
    this.dropdownOpen = false;
    this.router.navigate(['/login']);
  }

  private setAvatarColor() {
    if (!this.isBrowser) return;
    const savedColor = localStorage.getItem('avatarColor') || sessionStorage.getItem('avatarColor');
    if (savedColor) {
      this.avatarColor = savedColor;
    } else {
      const colors = ['#FF5733', '#33B5FF', '#28A745', '#FFC107', '#9C27B0'];
      this.avatarColor = colors[Math.floor(Math.random() * colors.length)];
      localStorage.setItem('avatarColor', this.avatarColor);
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
}
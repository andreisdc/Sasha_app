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
      } else {
        try {
          this.user = await firstValueFrom(this.authService.me());
          this.isLoggedIn = !!this.user;
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

  logout() {
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

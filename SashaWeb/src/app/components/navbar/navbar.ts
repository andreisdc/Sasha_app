import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.less'],
})
export class Navbar implements OnInit {
  user: any = null;
  isLoggedIn = false;
  userInitial: string = '';
  avatarColor: string = '';
  dropdownOpen = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (storedUser) {
      this.user = JSON.parse(storedUser);
      this.isLoggedIn = true;
      this.setUserInitial();
      this.setAvatarColor();
    }
  }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-info')) {
      this.dropdownOpen = false;
    }
  }

  private setUserInitial(): void {
    this.userInitial = this.user?.username?.charAt(0).toUpperCase() || '';
  }

  private setAvatarColor(): void {
    const savedColor = localStorage.getItem('avatarColor') || sessionStorage.getItem('avatarColor');
    if (savedColor) {
      this.avatarColor = savedColor;
    } else {
      const colors = ['#FF5733', '#33B5FF', '#28A745', '#FFC107', '#9C27B0'];
      this.avatarColor = colors[Math.floor(Math.random() * colors.length)];
      localStorage.setItem('avatarColor', this.avatarColor);
    }
  }

  goToLogin(): void { this.router.navigate(['/login']); }

  goToProfile(): void {
    this.router.navigate(['/profile']);
    this.dropdownOpen = false;
  }

  logout(): void {
    localStorage.removeItem('user');
    localStorage.removeItem('avatarColor');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('avatarColor');
    this.isLoggedIn = false;
    this.user = null;
    this.dropdownOpen = false;
    this.router.navigate(['/login']);
  }

  becomeSeller(): void {
    this.dropdownOpen = false;
    this.router.navigate(['/become-seller']);
  }

  goToProperties(): void {
    this.dropdownOpen = false;
    this.router.navigate(['/properties']);
  }

  goToHistory(): void {
    this.dropdownOpen = false;
    this.router.navigate(['/history']);
  }
}

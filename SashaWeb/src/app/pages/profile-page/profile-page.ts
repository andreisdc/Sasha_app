import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth-service';
import { AuthUser } from '../../core/interfaces/authUser';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-page.html',
  styleUrls: ['./profile-page.less'],
})
export class ProfilePage implements OnInit {
  user: AuthUser | null = null;
  loading = true;
  editingUsername = false;
  editingPhone = false;
  showUpload = false;

  private authService = inject(AuthService);

  ngOnInit(): void {
    this.loadUser();
  }

  loadUser() {
    this.loading = true;

    this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.user = user;
        this.loading = false;
      } else {
        this.authService.me().subscribe({
          next: (user) => {
            this.user = user;
            this.loading = false;
          },
          error: (err) => {
            console.error(err);
            this.loading = false;
          },
        });
      }
    });
  }

  onFileChange(event: any) {
    const file: File = event.target.files[0];
    if (file && this.user) {
      const reader = new FileReader();
      reader.onload = () => {
        this.user!.profilePicture = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  toggleUsernameEdit() {
    this.editingUsername = !this.editingUsername;
  }

  togglePhoneEdit() {
    this.editingPhone = !this.editingPhone;
  }

  saveChanges() {
    if (!this.user) return;

    this.authService.updateUser(this.user).subscribe({
      next: () => {
        alert('Profile updated successfully');
        this.editingUsername = false;
        this.editingPhone = false;
      },
      error: (err) => console.error(err),
    });
  }

  getFilledStars() {
    return Array.from({ length: Math.round(this.user?.rating || 0) });
  }

  getEmptyStars() {
    return Array.from({ length: 5 - Math.round(this.user?.rating || 0) });
  }
}

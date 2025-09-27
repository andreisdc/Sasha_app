import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth-service';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-page.html',
  styleUrls: ['./profile-page.less']
})
export class ProfilePage implements OnInit {
  user: any = null;
  showUpload = false;
  modalOpen = false;

  private authService = inject(AuthService);

  ngOnInit(): void {
    this.loadUser();
  }

  loadUser() {
    this.authService.me().subscribe({
      next: (user) => this.user = user,
      error: (err) => console.error(err)
    });
  }

  onFileChange(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.user.profilePicture = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  saveChanges() {
    this.authService.updateUser(this.user).subscribe({
      next: (res) => {
        alert('Profile updated successfully');
      },
      error: (err) => console.error(err)
    });
  }

  openModal() {
    if (this.user?.profilePicture) {
      this.modalOpen = true;
    }
  }

  closeModal() {
    this.modalOpen = false;
  }
}

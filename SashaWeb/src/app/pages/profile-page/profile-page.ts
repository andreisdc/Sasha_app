import {
  Component,
  inject,
  OnInit,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth-service';
import { AuthUser } from '../../core/interfaces/authUser';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-page.html',
  styleUrls: ['./profile-page.less'],
  changeDetection: ChangeDetectionStrategy.Default, // forțează change detection clasic
})
export class ProfilePage implements OnInit {
  user: AuthUser | null = null;
  originalUser: AuthUser | null = null;

  editingUsername = false;
  editingPhone = false;
  editingFirstName = false;
  editingLastName = false;

  imageLoading = false;
  loading = false;

  private ngZone = inject(NgZone);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.loadUser();
  }

  private async loadUser() {
    try {
      const userFromService = await firstValueFrom(this.authService.currentUser$);
      if (userFromService) {
        this.setUser(userFromService);
      } else {
        const userFromApi = await firstValueFrom(this.authService.me());
        this.setUser(userFromApi);
      }
    } catch (err) {
      console.error('Error loading user:', err);
    }
  }

  private setUser(user: AuthUser) {
    this.user = { ...user };
    this.originalUser = { ...user };
    this.cdr.markForCheck(); // marchează pentru refresh în următorul ciclu Angular
  }

  toggleUsernameEdit() { this.editingUsername = !this.editingUsername; }
  togglePhoneEdit() { this.editingPhone = !this.editingPhone; }
  toggleFirstNameEdit() { this.editingFirstName = !this.editingFirstName; }
  toggleLastNameEdit() { this.editingLastName = !this.editingLastName; }

  hasChanges(): boolean {
    if (!this.user || !this.originalUser) return false;
    return (
      this.user.username !== this.originalUser.username ||
      this.user.phoneNumber !== this.originalUser.phoneNumber ||
      this.user.firstName !== this.originalUser.firstName ||
      this.user.lastName !== this.originalUser.lastName ||
      this.user.profilePicture !== this.originalUser.profilePicture
    );
  }

  getFilledStars() {
    return Array.from({ length: Math.round(this.user?.rating || 0) });
  }

  getEmptyStars() {
    return Array.from({ length: 5 - Math.round(this.user?.rating || 0) });
  }

  onFileChange(event: any) {
    const file: File = event.target.files[0];
    if (!file || !this.user) return;

    this.imageLoading = true;
    const reader = new FileReader();

    reader.onload = () => {
      this.ngZone.run(() => {
        this.user = { ...this.user!, profilePicture: reader.result as string };
        this.imageLoading = false;
        this.cdr.markForCheck(); // marchează pentru refresh
      });
    };

    reader.readAsDataURL(file);
  }

  async saveChanges() {
    if (!this.user || !this.originalUser) return;
    this.loading = true;

    const updateData: Partial<AuthUser> = {};
    if (this.user.username !== this.originalUser.username) updateData.username = this.user.username;
    if (this.user.phoneNumber !== this.originalUser.phoneNumber) updateData.phoneNumber = this.user.phoneNumber;
    if (this.user.firstName !== this.originalUser.firstName) updateData.firstName = this.user.firstName;
    if (this.user.lastName !== this.originalUser.lastName) updateData.lastName = this.user.lastName;
    if (this.user.profilePicture !== this.originalUser.profilePicture) updateData.profilePicture = this.user.profilePicture;

    if (Object.keys(updateData).length === 0) {
      this.loading = false;
      return;
    }

    try {
      await firstValueFrom(this.authService.updateUser(updateData));
      this.originalUser = { ...this.user };
      this.user = { ...this.user };
      this.editingUsername = false;
      this.editingPhone = false;
      this.editingFirstName = false;
      this.editingLastName = false;
      this.cdr.markForCheck(); // refresh după update
    } catch (err) {
      console.error('Error updating user:', err);
    } finally {
      this.loading = false;
    }
  }
}

import { Component, OnInit, inject, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PendingApproveService } from '../../core/services/pending-approve-service';
import { AuthService } from '../../core/services/auth-service';
import { PendingApprove } from '../../core/interfaces/pendingApproveInterface';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-page.html',
  styleUrls: ['./admin-page.less']
})
export class AdminPage implements OnInit {
  pendingRequests: PendingApprove[] = [];
  isLoading = true;
  errorMessage = '';
  isViewingPhoto = false;
  currentPhotoUrl: string | null = null;

  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);
  private adminDashboardService = inject(PendingApproveService);
  private authService = inject(AuthService);
  private router = inject(Router);

  async ngOnInit() {
    try {
      const hasAccess = await firstValueFrom(this.authService.checkAdminAccess());
      if (!hasAccess?.hasAccess) {
        this.router.navigate(['/access-denied']);
        return;
      }
      await this.loadPendingRequests();
    } catch (error) {
      console.error('Admin access check failed:', error);
      this.router.navigate(['/access-denied']);
    }
  }

  // Adăugați logging în loadPendingRequests
async loadPendingRequests() {
  console.log('🔹 1. Setting isLoading to true');
  this.isLoading = true;
  this.errorMessage = '';
  this.cdr.detectChanges();

  try {
    console.log('🔹 2. Making API call...');
    const requests = await firstValueFrom(
      this.adminDashboardService.getAllPendingApprovals()
    );
    
    console.log('🔹 3. API response received:', requests);
    
    // ✅ DEBUG: Verificați structura fiecărui request
    if (requests && requests.length > 0) {
      console.log('🔹 First request structure:', requests[0]);
      console.log('🔹 First request ID:', requests[0].id);
      console.log('🔹 First request photo:', requests[0].photo);
    }

    this.ngZone.run(() => {
      console.log('🔹 4. Inside ngZone.run');
      this.pendingRequests = requests || [];
      this.isLoading = false;
      console.log('🔹 5. isLoading set to:', this.isLoading);
      this.cdr.detectChanges();
    });

  } catch (error) {
    console.error('❌ Error loading pending requests:', error);
    
    this.ngZone.run(() => {
      this.errorMessage = 'Failed to load pending requests';
      this.isLoading = false;
      this.pendingRequests = [];
      this.cdr.detectChanges();
    });
  }
}

  // ✅ METODĂ NOUĂ - Afișează poza
  async viewPhoto(request: PendingApprove) {
    if (!request.id) {
      alert('No photo available');
      return;
    }

    try {
      console.log('📷 Loading photo for request:', request.id);
      
      const photoBlob = await firstValueFrom(
        this.adminDashboardService.getPhoto(request.id)
      );

      // Creează URL temporar pentru blob
      const photoUrl = URL.createObjectURL(photoBlob);
      
      this.ngZone.run(() => {
        this.currentPhotoUrl = photoUrl;
        this.isViewingPhoto = true;
        this.cdr.detectChanges();
      });

    } catch (error) {
      console.error('❌ Error loading photo:', error);
      this.ngZone.run(() => {
        alert('Error loading photo. Please try again.');
      });
    }
  }

  // ✅ METODĂ NOUĂ - Închide poza
  closePhoto() {
    if (this.currentPhotoUrl) {
      URL.revokeObjectURL(this.currentPhotoUrl); // Cleanup memory
    }
    this.isViewingPhoto = false;
    this.currentPhotoUrl = null;
  }

 async approveRequest(request: PendingApprove) {
  if (!confirm('Are you sure you want to approve this verification request?')) {
    return;
  }

  try {
    // ✅ Folosește ID-ul în loc de întregul obiect
    await firstValueFrom(this.adminDashboardService.approvePendingApprove(request.id));
    
    this.ngZone.run(() => {
      alert('Request approved successfully!');
      this.pendingRequests = this.pendingRequests.filter(req => req.id !== request.id);
      this.cdr.detectChanges();
    });

  } catch (error) {
    console.error('Error approving request:', error);
    this.ngZone.run(() => {
      alert('Error approving request. Please try again.');
    });
  }
}

  async rejectRequest(request: PendingApprove) {
    const reason = prompt('Please enter the reason for rejection:');
    if (reason === null) return;
    if (!reason?.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      await firstValueFrom(
        this.adminDashboardService.rejectPendingApprove(request.id, reason.trim())
      );

      this.ngZone.run(() => {
        alert('Request rejected successfully!');
        this.pendingRequests = this.pendingRequests.filter(req => req.id !== request.id);
        this.cdr.detectChanges();
      });

    } catch (error) {
      console.error('Error rejecting request:', error);
      this.ngZone.run(() => {
        alert('Error rejecting request. Please try again.');
      });
    }
  }

  getTimeAgo(timestamp: string | Date): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
}
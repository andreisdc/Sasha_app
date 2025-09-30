import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PendingApproveService } from '../../core/services/pending-approve-service';
import { AuthService } from '../../core/services/auth-service';
import { PendingApprove } from '../../core/interfaces/pendingApproveInterface';

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

  constructor(
    private adminDashboardService: PendingApproveService,
    private authService: AuthService,
    private router: Router
  ) {}

  async ngOnInit() {
    try {
      const hasAccess = await this.authService.checkAdminAccess().toPromise();
      if (!hasAccess?.hasAccess) {
        this.router.navigate(['/access-denied']);
        return;
      }
      this.loadPendingRequests();
    } catch (error) {
      console.error('Admin access check failed:', error);
      this.router.navigate(['/access-denied']);
    }
  }

  loadPendingRequests() {
    this.isLoading = true;
    this.errorMessage = '';

    this.adminDashboardService.getAllPendingApprovals().subscribe({
      next: (requests) => {
        this.pendingRequests = requests;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading pending requests:', error);
        this.errorMessage = 'Failed to load pending requests';
        this.isLoading = false;
      }
    });
  }

  approveRequest(request: PendingApprove) {
    if (!confirm('Are you sure you want to approve this verification request?')) {
      return;
    }

    this.adminDashboardService.approvePendingApprove(request).subscribe({
      next: () => {
        alert('Request approved successfully!');
        this.loadPendingRequests();
      },
      error: (error) => {
        console.error('Error approving request:', error);
        alert('Error approving request. Please try again.');
      }
    });
  }

  rejectRequest(request: PendingApprove) {
    const reason = prompt('Please enter the reason for rejection:');
    if (reason === null) return;
    if (!reason?.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    this.adminDashboardService.rejectPendingApprove(request, reason.trim()).subscribe({
      next: () => {
        alert('Request rejected successfully!');
        this.loadPendingRequests();
      },
      error: (error) => {
        console.error('Error rejecting request:', error);
        alert('Error rejecting request. Please try again.');
      }
    });
  }

  viewPhoto(photoUrl?: string) {
    if (photoUrl) {
      window.open(photoUrl, '_blank');
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

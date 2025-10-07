import { Component, OnInit, inject, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PendingApproveService, UnverifiedProperty } from '../../core/services/pending-approve-service';
import { AuthService } from '../../core/services/auth-service';
import { PendingApprove } from '../../core/interfaces/pendingApproveInterface';
import { firstValueFrom } from 'rxjs';

// Interface pentru răspunsul API
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-page.html',
  styleUrls: ['./admin-page.less']
})
export class AdminPage implements OnInit {
  // Tab-uri pentru navigare
  activeTab: 'sellers' | 'properties' = 'sellers';
  
  // Date pentru verificări utilizatori
  pendingRequests: PendingApprove[] = [];
  
  // Date pentru proprietăți neverificate
  unverifiedProperties: UnverifiedProperty[] = [];
  
  // Stări de loading
  isLoadingSellers = true;
  isLoadingProperties = true;
  
  // Mesaje de eroare
  errorMessageSellers = '';
  errorMessageProperties = '';
  
  // Modal pentru poze
  isViewingPhoto = false;
  currentPhotoUrl: string | null = null;
  currentPhotoType: 'user' | 'property' = 'user';
  currentPropertyImages: string[] = [];
  currentImageIndex: number = 0;

  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);
  private adminDashboardService = inject(PendingApproveService);
  private authService = inject(AuthService);
  private router = inject(Router);

  async ngOnInit() {
    try {
      const hasAccess = await firstValueFrom(this.authService.checkAdminAccess());
      if (!hasAccess?.hasAccess) {
        this.ngZone.run(() => {
          this.router.navigate(['/access-denied']);
        });
        return;
      }
      await this.loadSellersData();
    } catch (error) {
      console.error('Admin access check failed:', error);
      this.ngZone.run(() => {
        this.router.navigate(['/access-denied']);
      });
    }
  }

  // Schimbă tab-ul activ
  setActiveTab(tab: 'sellers' | 'properties') {
    this.ngZone.run(() => {
      this.activeTab = tab;
      this.triggerChangeDetection();
      
      if (tab === 'sellers' && this.pendingRequests.length === 0) {
        this.loadSellersData();
      } else if (tab === 'properties' && this.unverifiedProperties.length === 0) {
        this.loadPropertiesData();
      }
    });
  }

  // Încarcă datele pentru verificări utilizatori
  async loadSellersData() {
    this.ngZone.run(() => {
      this.isLoadingSellers = true;
      this.errorMessageSellers = '';
      this.triggerChangeDetection();
    });

    try {
      const response = await firstValueFrom(
        this.adminDashboardService.getAllPendingApprovals()
      );

      // Extrage datele din răspunsul API
      let sellersData: PendingApprove[] = [];
      
      if (this.isApiResponse<PendingApprove[]>(response)) {
        sellersData = response.data;
      } else if (Array.isArray(response)) {
        sellersData = response;
      } else {
        sellersData = [];
      }

      this.ngZone.run(() => {
        this.pendingRequests = sellersData;
        this.isLoadingSellers = false;
        this.errorMessageSellers = '';
        this.triggerChangeDetection();
      });

    } catch (error: any) {
      this.ngZone.run(() => {
        this.errorMessageSellers = error.message || 'Failed to load seller verification requests';
        this.isLoadingSellers = false;
        this.pendingRequests = [];
        this.triggerChangeDetection();
      });
    }
  }

  // Încarcă datele pentru proprietăți neverificate
  async loadPropertiesData() {
    this.ngZone.run(() => {
      this.isLoadingProperties = true;
      this.errorMessageProperties = '';
      this.triggerChangeDetection();
    });

    try {
      const response = await firstValueFrom(
        this.adminDashboardService.getAllUnverifiedProperties()
      );

      // Extrage datele din răspunsul API
      let propertiesData: UnverifiedProperty[] = [];
      
      if (this.isApiResponse<UnverifiedProperty[]>(response)) {
        propertiesData = response.data;
      } else if (Array.isArray(response)) {
        propertiesData = response;
      } else {
        propertiesData = [];
      }

      this.ngZone.run(() => {
        this.unverifiedProperties = propertiesData;
        this.isLoadingProperties = false;
        this.errorMessageProperties = '';
        this.triggerChangeDetection();
      });

    } catch (error: any) {
      this.ngZone.run(() => {
        this.errorMessageProperties = error.message || 'Failed to load unverified properties';
        this.isLoadingProperties = false;
        this.unverifiedProperties = [];
        this.triggerChangeDetection();
      });
    }
  }

  // Type guard pentru a verifica dacă răspunsul este de tip ApiResponse
  private isApiResponse<T>(response: any): response is ApiResponse<T> {
    return (
      response &&
      typeof response === 'object' &&
      'success' in response &&
      'message' in response &&
      'data' in response
    );
  }

  // Reîncarcă datele manual
  refreshData() {
    this.ngZone.run(() => {
      if (this.activeTab === 'sellers') {
        this.loadSellersData();
      } else {
        this.loadPropertiesData();
      }
    });
  }

  // Metode pentru verificări utilizatori
  async viewUserPhoto(request: PendingApprove) {
    if (!request.id) {
      this.ngZone.run(() => {
        alert('No photo available');
      });
      return;
    }

    try {
      const photoBlob = await firstValueFrom(
        this.adminDashboardService.getPhoto(request.id)
      );

      const photoUrl = URL.createObjectURL(photoBlob);
      
      this.ngZone.run(() => {
        this.currentPhotoUrl = photoUrl;
        this.currentPhotoType = 'user';
        this.isViewingPhoto = true;
        this.triggerChangeDetection();
      });

    } catch (error) {
      console.error('Error loading user photo:', error);
      this.ngZone.run(() => {
        alert('Error loading photo. Please try again.');
      });
    }
  }

  // Metode pentru vizualizarea pozelor proprietăților
  async viewPropertyPhotos(property: UnverifiedProperty) {
    try {
      // Încarcă pozele proprietății
      const propertyImages = await firstValueFrom(
        this.adminDashboardService.getPropertyPhotos(property.id)
      );

      if (propertyImages && propertyImages.length > 0) {
        this.ngZone.run(() => {
          this.currentPropertyImages = propertyImages;
          this.currentImageIndex = 0;
          this.currentPhotoUrl = propertyImages[0];
          this.currentPhotoType = 'property';
          this.isViewingPhoto = true;
          this.triggerChangeDetection();
        });
      } else {
        this.ngZone.run(() => {
          alert('No photos available for this property');
        });
      }

    } catch (error) {
      console.error('Error loading property photos:', error);
      this.ngZone.run(() => {
        alert('Error loading property photos. Please try again.');
      });
    }
  }

  // Navigare între pozele proprietății
  nextPhoto() {
    this.ngZone.run(() => {
      if (this.currentPropertyImages.length > 0) {
        this.currentImageIndex = (this.currentImageIndex + 1) % this.currentPropertyImages.length;
        this.currentPhotoUrl = this.currentPropertyImages[this.currentImageIndex];
        this.triggerChangeDetection();
      }
    });
  }

  previousPhoto() {
    this.ngZone.run(() => {
      if (this.currentPropertyImages.length > 0) {
        this.currentImageIndex = (this.currentImageIndex - 1 + this.currentPropertyImages.length) % this.currentPropertyImages.length;
        this.currentPhotoUrl = this.currentPropertyImages[this.currentImageIndex];
        this.triggerChangeDetection();
      }
    });
  }

  async approveRequest(request: PendingApprove) {
    if (!confirm('Are you sure you want to approve this verification request?')) {
      return;
    }

    try {
      await firstValueFrom(this.adminDashboardService.approvePendingApprove(request.id));
      
      this.ngZone.run(() => {
        alert('Request approved successfully!');
        this.pendingRequests = this.pendingRequests.filter(req => req.id !== request.id);
        this.triggerChangeDetection();
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
      this.ngZone.run(() => {
        alert('Please provide a rejection reason');
      });
      return;
    }

    try {
      await firstValueFrom(
        this.adminDashboardService.rejectPendingApprove(request.id, reason.trim())
      );

      this.ngZone.run(() => {
        alert('Request rejected successfully!');
        this.pendingRequests = this.pendingRequests.filter(req => req.id !== request.id);
        this.triggerChangeDetection();
      });

    } catch (error) {
      console.error('Error rejecting request:', error);
      this.ngZone.run(() => {
        alert('Error rejecting request. Please try again.');
      });
    }
  }

  // Metode pentru proprietăți neverificate
  async verifyProperty(property: UnverifiedProperty) {
    if (!confirm(`Are you sure you want to verify property "${property.title}"?`)) {
      return;
    }

    try {
      await firstValueFrom(this.adminDashboardService.verifyProperty(property.id));
      
      this.ngZone.run(() => {
        alert('Property verified successfully!');
        this.unverifiedProperties = this.unverifiedProperties.filter(prop => prop.id !== property.id);
        this.triggerChangeDetection();
      });

    } catch (error) {
      console.error('Error verifying property:', error);
      this.ngZone.run(() => {
        alert('Error verifying property. Please try again.');
      });
    }
  }

  async deleteProperty(property: UnverifiedProperty) {
    const reason = prompt(`Please enter the reason for deleting property "${property.title}":`);
    if (reason === null) return;
    if (!reason?.trim()) {
      this.ngZone.run(() => {
        alert('Please provide a deletion reason');
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete property "${property.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await firstValueFrom(this.adminDashboardService.deleteProperty(property.id));

      this.ngZone.run(() => {
        alert('Property deleted successfully!');
        this.unverifiedProperties = this.unverifiedProperties.filter(prop => prop.id !== property.id);
        this.triggerChangeDetection();
      });

    } catch (error) {
      console.error('Error deleting property:', error);
      this.ngZone.run(() => {
        alert('Error deleting property. Please try again.');
      });
    }
  }

  // Închide modalul pentru poze
  closePhoto() {
    this.ngZone.run(() => {
      if (this.currentPhotoUrl) {
        URL.revokeObjectURL(this.currentPhotoUrl);
      }
      this.isViewingPhoto = false;
      this.currentPhotoUrl = null;
      this.currentPhotoType = 'user';
      this.currentPropertyImages = [];
      this.currentImageIndex = 0;
      this.triggerChangeDetection();
    });
  }

  // Helper method pentru change detection
  private triggerChangeDetection() {
    this.cdr.detectChanges();
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

  // Calculează statisticile totale
  get totalPendingSellers(): number {
    return this.pendingRequests.length;
  }

  get totalUnverifiedProperties(): number {
    return this.unverifiedProperties.length;
  }

  get totalPendingItems(): number {
    return this.totalPendingSellers + this.totalUnverifiedProperties;
  }
}
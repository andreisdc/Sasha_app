import { Component, OnInit, NgZone, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PropertyService } from '../../core/services/property-service';
import { AuthService } from '../../core/services/auth-service';
import { firstValueFrom } from 'rxjs';

interface Property {
  id: string;
  title: string;
  description: string;
  city: string;
  country: string;
  pricePerNight: number;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  images: string[];
  status: 'active' | 'pending' | 'draft';
  averageRating: number;
  reviewCount: number;
  totalBookings: number;
  createdAt: Date;
  updatedAt: Date;
  isVerified?: boolean;
  propertyType?: string;
  coverImageUrl?: string; // ✅ Adăugăm câmpul pentru cover image
}

@Component({
  selector: 'app-my-properties',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './my-properties.html',
  styleUrl: './my-properties.less'
})
export class MyProperties implements OnInit {
  properties: Property[] = [];
  filteredProperties: Property[] = [];
  isLoading = true;
  errorMessage = '';
  selectedFilter = 'all';
  
  // Stats
  activePropertiesCount = 0;
  pendingPropertiesCount = 0;
  draftPropertiesCount = 0;
  verifiedPropertiesCount = 0;
  unverifiedPropertiesCount = 0;
  totalBookings = 0;
  totalRevenue = 0;

  private router = inject(Router);
  private propertyService = inject(PropertyService);
  private authService = inject(AuthService);
  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.loadProperties();
  }

  async loadProperties() {
    console.log('🔄 MyProperties - Starting loadProperties');
    
    this.ngZone.run(() => {
      this.isLoading = true;
      this.errorMessage = '';
      this.cdr.detectChanges();
    });

    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      console.log('📡 MyProperties - Loading properties for user:', currentUser.id);
      
      // Folosim noul endpoint optimizat
      const userProperties = await firstValueFrom(
        this.propertyService.getPropertiesByUserId(currentUser.id)
      );

      console.log('✅ MyProperties - Properties loaded from API:', userProperties);

      // Transformăm proprietățile din API în formatul așteptat de componentă
      const transformedProperties: Property[] = userProperties.map(property => ({
        id: property.id,
        title: property.title,
        description: property.description,
        city: property.city,
        country: property.country,
        pricePerNight: property.pricePerNight,
        bedrooms: property.bedrooms || 0,
        bathrooms: property.bathrooms,
        maxGuests: property.maxGuests,
        images: property.images || [],
        status: this.determinePropertyStatus(property),
        averageRating: property.averageRating || 0,
        reviewCount: property.reviewCount || 0,
        totalBookings: this.calculateTotalBookings(property), // Calculat din alte date
        createdAt: new Date(property.createdAt),
        updatedAt: new Date(property.updatedAt),
        isVerified: property.isVerified,
        propertyType: property.propertyType,
        coverImageUrl: property.images[0] // Prima imagine este cover-ul
      }));

      this.ngZone.run(() => {
        this.properties = transformedProperties;
        this.calculateStats();
        this.filterProperties();
        this.isLoading = false;
        console.log('✅ MyProperties - Final properties:', this.properties);
        this.cdr.detectChanges();
      });

    } catch (error: any) {
      console.error('❌ MyProperties - Error loading properties:', error);
      
      this.ngZone.run(() => {
        this.errorMessage = error.message || 'Failed to load properties. Please try again.';
        this.isLoading = false;
        this.properties = [];
        this.filteredProperties = [];
        this.cdr.detectChanges();
      });
    }
  }

  private determinePropertyStatus(property: any): 'active' | 'pending' | 'draft' {
    // Logica pentru a determina statusul proprietății
    if (property.isVerified) {
      return 'active';
    } else if (property.status === 'available' && !property.isVerified) {
      return 'pending'; // Așteaptă verificare
    } else {
      return 'draft'; // Necompletat sau în curs de editare
    }
  }

  private calculateTotalBookings(property: any): number {
    // Această funcție ar trebui să calculeze sau să obțină numărul real de rezervări
    // Momentan returnăm un număr mock pentru demo
    if (property.isVerified && property.status === 'active') {
      return Math.floor(Math.random() * 20); // Număr random pentru demo
    }
    return 0;
  }

  calculateStats() {
    this.activePropertiesCount = this.properties.filter(p => p.status === 'active').length;
    this.pendingPropertiesCount = this.properties.filter(p => p.status === 'pending').length;
    this.draftPropertiesCount = this.properties.filter(p => p.status === 'draft').length;
    this.verifiedPropertiesCount = this.properties.filter(p => p.isVerified).length;
    this.unverifiedPropertiesCount = this.properties.filter(p => !p.isVerified).length;
    this.totalBookings = this.properties.reduce((sum, p) => sum + p.totalBookings, 0);
    this.totalRevenue = this.properties.reduce((sum, p) => sum + (p.pricePerNight * p.totalBookings), 0);
    
    console.log('📊 MyProperties - Stats calculated:', {
      active: this.activePropertiesCount,
      pending: this.pendingPropertiesCount,
      draft: this.draftPropertiesCount,
      verified: this.verifiedPropertiesCount,
      unverified: this.unverifiedPropertiesCount,
      bookings: this.totalBookings,
      revenue: this.totalRevenue
    });
  }

  filterProperties() {
    switch (this.selectedFilter) {
      case 'all':
        this.filteredProperties = this.properties;
        break;
      case 'active':
        this.filteredProperties = this.properties.filter(p => p.status === 'active');
        break;
      case 'pending':
        this.filteredProperties = this.properties.filter(p => p.status === 'pending');
        break;
      case 'draft':
        this.filteredProperties = this.properties.filter(p => p.status === 'draft');
        break;
      case 'verified':
        this.filteredProperties = this.properties.filter(p => p.isVerified);
        break;
      case 'unverified':
        this.filteredProperties = this.properties.filter(p => !p.isVerified);
        break;
      default:
        this.filteredProperties = this.properties;
    }
    
    console.log('🔍 MyProperties - Filtered properties:', this.filteredProperties.length);
  }

  onFilterChange(filter: string) {
    this.selectedFilter = filter;
    this.filterProperties();
  }

  addNewProperty() {
    console.log('🎯 Navigating to add property');
    this.router.navigate(['/add-property']);
  }

  editProperty(property: Property) {
    console.log('🎯 Navigating to edit property:', property.id);
    this.router.navigate(['/edit-property', property.id]);
  }

  viewProperty(property: Property) {
    console.log('🎯 Navigating to view property:', property.id);
    this.router.navigate(['/property', property.id]);
  }

  async deleteProperty(property: Property) {
    if (confirm(`Are you sure you want to delete "${property.title}"? This action cannot be undone.`)) {
      try {
        await firstValueFrom(this.propertyService.deleteProperty(property.id));
        
        this.ngZone.run(() => {
          this.properties = this.properties.filter(p => p.id !== property.id);
          this.calculateStats();
          this.filterProperties();
          this.cdr.detectChanges();
          
          console.log('🗑️ MyProperties - Property deleted:', property.id);
        });
      } catch (error: any) {
        console.error('❌ MyProperties - Error deleting property:', error);
        alert('Failed to delete property: ' + (error.message || 'Unknown error'));
      }
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'active': return 'status-badge-active';
      case 'pending': return 'status-badge-pending';
      case 'draft': return 'status-badge-draft';
      default: return 'status-badge-draft';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'active': return 'Active';
      case 'pending': return 'Pending Verification';
      case 'draft': return 'Draft';
      default: return status;
    }
  }

  getVerificationBadgeClass(isVerified: boolean): string {
    return isVerified ? 'verification-badge-verified' : 'verification-badge-unverified';
  }

  getVerificationText(isVerified: boolean): string {
    return isVerified ? 'Verified' : 'Unverified';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  }

  // Metodă pentru a obține URL-ul imaginii de cover
  getCoverImage(property: Property): string {
    return property.coverImageUrl || property.images[0] || 'assets/default-property.jpg';
  }
}
import { Component, OnInit, NgZone, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PropertyService, Property, PropertyImage } from '../../core/services/property-service';
import { AuthService } from '../../core/services/auth-service';
import { firstValueFrom } from 'rxjs';

// Interface pentru proprietatea din listă (adaptată pentru frontend)
interface PropertyCard {
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
  coverImageUrl?: string;
}

@Component({
  selector: 'app-my-properties',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './my-properties.html',
  styleUrl: './my-properties.less'
})
export class MyProperties implements OnInit {
  properties: PropertyCard[] = [];
  filteredProperties: PropertyCard[] = [];
  selectedProperty: Property | null = null;
  isLoading = true;
  isLoadingDetails = false;
  errorMessage = '';
  selectedFilter = 'all';
  showPropertyModal = false;
  
  // Stats
  activePropertiesCount = 0;
  pendingPropertiesCount = 0;
  draftPropertiesCount = 0;
  verifiedPropertiesCount = 0;
  unverifiedPropertiesCount = 0;
  totalBookings = 0;
  totalRevenue = 0;

  private router = inject(Router);
  private route = inject(ActivatedRoute);
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
      
      const userProperties = await firstValueFrom(
        this.propertyService.getPropertiesByUserId(currentUser.id)
      );

      console.log('✅ MyProperties - Properties loaded from API:', userProperties);

      // Transformăm proprietățile din API în formatul așteptat de componentă
      const transformedProperties: PropertyCard[] = userProperties.map(property => ({
        id: property.id,
        title: property.title,
        description: property.description,
        city: property.city,
        country: property.country,
        pricePerNight: property.pricePerNight,
        bedrooms: property.bedrooms || this.calculateBedrooms(property),
        bathrooms: property.bathrooms,
        maxGuests: property.maxGuests,
        images: property.images || [],
        status: this.determinePropertyStatus(property),
        averageRating: property.averageRating || 0,
        reviewCount: property.reviewCount || 0,
        totalBookings: this.calculateTotalBookings(property),
        createdAt: new Date(property.createdAt),
        updatedAt: new Date(property.updatedAt),
        isVerified: property.isVerified,
        propertyType: property.propertyType || property.locationType,
        coverImageUrl: property.images[0]
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

  private calculateBedrooms(property: Property): number {
    if (property.livingSpace > 0) {
      return Math.max(1, Math.floor(property.livingSpace / 20));
    }
    return 1;
  }

  determinePropertyStatus(property: Property): 'active' | 'pending' | 'draft' {
    if (property.isVerified && property.status === 'available') {
      return 'active';
    } else if (!property.isVerified && property.status === 'available') {
      return 'pending';
    } else {
      return 'draft';
    }
  }

  private calculateTotalBookings(property: Property): number {
    if (property.isVerified && property.status === 'active') {
      return Math.floor(Math.random() * 20);
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
  }

  onFilterChange(filter: string) {
    this.selectedFilter = filter;
    this.filterProperties();
  }

  async viewPropertyDetails(property: PropertyCard) {
    console.log('🔍 Viewing property details:', property.id);
    
    this.ngZone.run(() => {
      this.isLoadingDetails = true;
      this.showPropertyModal = true;
      this.cdr.detectChanges();
    });

    try {
      const propertyDetails = await firstValueFrom(
        this.propertyService.getPropertyById(property.id)
      );

      this.ngZone.run(() => {
        this.selectedProperty = propertyDetails;
        this.isLoadingDetails = false;
        this.cdr.detectChanges();
      });

    } catch (error: any) {
      console.error('❌ Error loading property details:', error);
      
      this.ngZone.run(() => {
        this.errorMessage = 'Failed to load property details: ' + (error.message || 'Unknown error');
        this.isLoadingDetails = false;
        this.showPropertyModal = false;
        this.cdr.detectChanges();
      });
    }
  }

  closePropertyModal() {
    this.ngZone.run(() => {
      this.showPropertyModal = false;
      this.selectedProperty = null;
      this.cdr.detectChanges();
    });
  }

  addNewProperty() {
    this.router.navigate(['/add-property']);
  }

  // Corectat: acceptă atât PropertyCard cât și Property
  editProperty(property: PropertyCard | Property) {
    this.router.navigate(['/edit-property', property.id]);
  }

  viewProperty(property: PropertyCard | Property) {
    this.router.navigate(['/property', property.id]);
  }

  // Corectat: acceptă atât PropertyCard cât și Property
  async deleteProperty(property: PropertyCard | Property) {
    if (confirm(`Are you sure you want to delete "${property.title}"? This action cannot be undone.`)) {
      try {
        await firstValueFrom(this.propertyService.deleteProperty(property.id));
        
        this.ngZone.run(() => {
          this.properties = this.properties.filter(p => p.id !== property.id);
          this.calculateStats();
          this.filterProperties();
          this.cdr.detectChanges();
        });
      } catch (error: any) {
        console.error('❌ Error deleting property:', error);
        alert('Failed to delete property: ' + (error.message || 'Unknown error'));
      }
    }
  }

  // Metode helper pentru afișarea datelor
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

  getCoverImage(property: PropertyCard): string {
    return property.coverImageUrl || property.images[0] || 'assets/default-property.jpg';
  }

  // Metode pentru afișarea detaliilor proprietății
  getSelectedAmenities(property: Property): string[] {
    const amenities = [];
    if (property.wifi) amenities.push('WiFi');
    if (property.airConditioning) amenities.push('Air Conditioning');
    if (property.heating) amenities.push('Heating');
    if (property.pool) amenities.push('Pool');
    if (property.parking) amenities.push('Parking');
    if (property.kitchen) amenities.push('Kitchen');
    if (property.tv) amenities.push('TV');
    if (property.washer) amenities.push('Washer');
    if (property.dryer) amenities.push('Dryer');
    if (property.petFriendly) amenities.push('Pet Friendly');
    if (property.fireplace) amenities.push('Fireplace');
    if (property.balcony) amenities.push('Balcony');
    if (property.garden) amenities.push('Garden');
    if (property.hotTub) amenities.push('Hot Tub');
    if (property.wheelchairAccessible) amenities.push('Wheelchair Accessible');
    if (property.bbq) amenities.push('BBQ');
    if (property.breakfastIncluded) amenities.push('Breakfast Included');
    return amenities;
  }

  getSelectedActivities(property: Property): string[] {
    const activities = [];
    if (property.hiking) activities.push('Hiking');
    if (property.biking) activities.push('Biking');
    if (property.swimming) activities.push('Swimming');
    if (property.fishing) activities.push('Fishing');
    if (property.skiing) activities.push('Skiing');
    if (property.snowboarding) activities.push('Snowboarding');
    if (property.horseRiding) activities.push('Horse Riding');
    if (property.climbing) activities.push('Climbing');
    if (property.camping) activities.push('Camping');
    if (property.beach) activities.push('Beach');
    if (property.museum) activities.push('Museum');
    if (property.historicalSite) activities.push('Historical Site');
    if (property.artGallery) activities.push('Art Gallery');
    if (property.theatre) activities.push('Theatre');
    if (property.localMarket) activities.push('Local Market');
    if (property.wineryTour) activities.push('Winery Tour');
    if (property.restaurant) activities.push('Restaurant');
    if (property.bar) activities.push('Bar');
    if (property.cafe) activities.push('Cafe');
    if (property.localFood) activities.push('Local Food');
    if (property.wineTasting) activities.push('Wine Tasting');
    if (property.kayaking) activities.push('Kayaking');
    if (property.rafting) activities.push('Rafting');
    if (property.paragliding) activities.push('Paragliding');
    if (property.zipline) activities.push('Zipline');
    if (property.spa) activities.push('Spa');
    if (property.yoga) activities.push('Yoga');
    if (property.meditation) activities.push('Meditation');
    if (property.hotSprings) activities.push('Hot Springs');
    if (property.playground) activities.push('Playground');
    if (property.zoo) activities.push('Zoo');
    if (property.aquarium) activities.push('Aquarium');
    if (property.amusementPark) activities.push('Amusement Park');
    return activities;
  }

  getMainImage(property: Property): string {
    return property.images[0] || 'assets/default-property.jpg';
  }

  getOtherImages(property: Property): string[] {
    return property.images?.slice(1) || [];
  }

  // Helper pentru a calcula bedrooms din Property
  calculateBedroomsFromDetails(property: Property): number {
    return property.bedrooms || Math.max(1, Math.floor((property.livingSpace || 0) / 20));
  }

  // Helper pentru a obține statusul din Property
  getPropertyStatusFromDetails(property: Property): 'active' | 'pending' | 'draft' {
    return this.determinePropertyStatus(property);
  }

  // Helper pentru a converti Property în PropertyCard (pentru butonul Edit din modal)
  convertToPropertyCard(property: Property): PropertyCard {
    return {
      id: property.id,
      title: property.title,
      description: property.description,
      city: property.city,
      country: property.country,
      pricePerNight: property.pricePerNight,
      bedrooms: property.bedrooms || this.calculateBedrooms(property),
      bathrooms: property.bathrooms,
      maxGuests: property.maxGuests,
      images: property.images || [],
      status: this.determinePropertyStatus(property),
      averageRating: property.averageRating || 0,
      reviewCount: property.reviewCount || 0,
      totalBookings: this.calculateTotalBookings(property),
      createdAt: new Date(property.createdAt),
      updatedAt: new Date(property.updatedAt),
      isVerified: property.isVerified,
      propertyType: property.propertyType || property.locationType,
      coverImageUrl: property.images[0]
    };
  }
}
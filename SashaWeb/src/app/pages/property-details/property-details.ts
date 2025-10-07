import { Component, OnInit, inject, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth-service';
import { PropertyService, Property } from '../../core/services/property-service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-property-details',
  imports: [CommonModule, FormsModule],
  templateUrl: './property-details.html',
  styleUrl: './property-details.less'
})
export class PropertyDetails implements OnInit {
  property: Property = {} as Property;
  isLoading = true;
  isOwner = false;
  
  // Booking
  checkInDate: string = '';
  checkOutDate: string = '';
  selectedGuests = 1;
  minDate: string;
  
  // Image gallery
  isImageModalOpen = false;
  currentImageIndex = 0;
  currentMainImageIndex = 0;
  thumbnailScrollOffset = 0;

  // Fees
  cleaningFee = 25;
  serviceFee = 15;

  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private propertyService = inject(PropertyService);

  constructor() {
    this.minDate = new Date().toISOString().split('T')[0];
  }

  async ngOnInit() {
    const propertyId = this.route.snapshot.paramMap.get('id');
    
    if (!propertyId) {
      this.router.navigate(['/properties']);
      return;
    }

    await this.loadProperty(propertyId);
  }

  async loadProperty(propertyId: string) {
    console.log('🔄 Loading property details...');
    
    this.ngZone.run(() => {
      this.isLoading = true;
      this.cdr.detectChanges();
    });

    try {
      const propertyData = await firstValueFrom(
        this.propertyService.getPropertyById(propertyId)
      );
      const currentUser = this.authService.getCurrentUser();
      console.log(propertyData);

      this.ngZone.run(() => {
        this.property = propertyData;
        this.isOwner = currentUser?.id === this.property.ownerId;
        this.isLoading = false;
        
        console.log('✅ Property loaded:', this.property);
        console.log('✅ Tags:', this.property.tags);
        console.log('✅ Amenities count:', this.getAmenitiesList().length);
        console.log('✅ Activities count:', this.getActivitiesList().length);
        
        this.cdr.detectChanges();
      });

    } catch (error) {
      console.error('❌ Error loading property:', error);
      
      this.ngZone.run(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      });
      
      this.router.navigate(['/properties']);
    }
  }

  // METODE PENTRU GALERIE DE IMAGINI
  setMainImage(index: number): void {
    this.ngZone.run(() => {
      this.currentMainImageIndex = index;
      this.cdr.detectChanges();
    });
  }

  scrollThumbnails(direction: number): void {
    const thumbnailWidth = 80; // Width of each thumbnail including gap
    const maxOffset = -(this.property.images.length - 4) * thumbnailWidth;
    
    this.ngZone.run(() => {
      const newOffset = this.thumbnailScrollOffset + (direction * thumbnailWidth);
      
      // Apply constraints
      if (direction > 0) { // Scrolling right
        this.thumbnailScrollOffset = Math.max(maxOffset, newOffset);
      } else { // Scrolling left
        this.thumbnailScrollOffset = Math.min(0, newOffset);
      }
      
      this.cdr.detectChanges();
    });
  }

  // METODE CORECTATE PENTRU DOTĂRI - verifică atât tags cât și proprietățile booleene
  getAmenitiesList(): any[] {
    if (!this.property) return [];
    
    const amenities = [];
    const tags = this.property.tags || [];
    
    // Property Amenities - verifică atât tags cât și proprietățile booleene
    if (tags.includes('wifi') || this.property.wifi === true) amenities.push({ name: 'WiFi', icon: 'fas fa-wifi', category: 'Essentials' });
    if (tags.includes('airConditioning') || this.property.airConditioning === true) amenities.push({ name: 'Air Conditioning', icon: 'fas fa-snowflake', category: 'Comfort' });
    if (tags.includes('heating') || this.property.heating === true) amenities.push({ name: 'Heating', icon: 'fas fa-thermometer-half', category: 'Comfort' });
    if (tags.includes('kitchen') || this.property.kitchen === true) amenities.push({ name: 'Kitchen', icon: 'fas fa-utensils', category: 'Facilities' });
    if (tags.includes('tv') || this.property.tv === true) amenities.push({ name: 'TV', icon: 'fas fa-tv', category: 'Entertainment' });
    if (tags.includes('washer') || this.property.washer === true) amenities.push({ name: 'Washer', icon: 'fas fa-soap', category: 'Facilities' });
    if (tags.includes('dryer') || this.property.dryer === true) amenities.push({ name: 'Dryer', icon: 'fas fa-wind', category: 'Facilities' });
    if (tags.includes('pool') || this.property.pool === true) amenities.push({ name: 'Pool', icon: 'fas fa-swimming-pool', category: 'Outdoor' });
    if (tags.includes('parking') || this.property.parking === true) amenities.push({ name: 'Parking', icon: 'fas fa-parking', category: 'Location' });
    if (tags.includes('petFriendly') || this.property.petFriendly === true) amenities.push({ name: 'Pet Friendly', icon: 'fas fa-paw', category: 'Policies' });
    if (tags.includes('fireplace') || this.property.fireplace === true) amenities.push({ name: 'Fireplace', icon: 'fas fa-fire', category: 'Comfort' });
    if (tags.includes('balcony') || this.property.balcony === true) amenities.push({ name: 'Balcony', icon: 'fas fa-building', category: 'Outdoor' });
    if (tags.includes('garden') || this.property.garden === true) amenities.push({ name: 'Garden', icon: 'fas fa-seedling', category: 'Outdoor' });
    if (tags.includes('hotTub') || this.property.hotTub === true) amenities.push({ name: 'Hot Tub', icon: 'fas fa-hot-tub', category: 'Luxury' });
    if (tags.includes('wheelchairAccessible') || this.property.wheelchairAccessible === true) amenities.push({ name: 'Wheelchair Accessible', icon: 'fas fa-wheelchair', category: 'Accessibility' });
    if (tags.includes('bbq') || this.property.bbq === true) amenities.push({ name: 'BBQ Grill', icon: 'fas fa-fire', category: 'Outdoor' });
    if (tags.includes('breakfastIncluded') || this.property.breakfastIncluded === true) amenities.push({ name: 'Breakfast Included', icon: 'fas fa-coffee', category: 'Services' });
    
    return amenities;
  }

  getAmenitiesByCategory(): { [key: string]: any[] } {
    const amenities = this.getAmenitiesList();
    const categories: { [key: string]: any[] } = {};
    
    amenities.forEach(amenity => {
      if (!categories[amenity.category]) {
        categories[amenity.category] = [];
      }
      categories[amenity.category].push(amenity);
    });
    
    return categories;
  }

  // METODE CORECTATE PENTRU ACTIVITĂȚI - verifică atât tags cât și proprietățile booleene
  getActivitiesList(): any[] {
    if (!this.property) return [];
    
    const activities = [];
    const tags = this.property.tags || [];
    
    // Outdoor Activities
    if (tags.includes('hiking') || this.property.hiking === true) activities.push({ name: 'Hiking', icon: 'fas fa-hiking', category: 'Outdoor' });
    if (tags.includes('biking') || this.property.biking === true) activities.push({ name: 'Biking', icon: 'fas fa-bicycle', category: 'Outdoor' });
    if (tags.includes('swimming') || this.property.swimming === true) activities.push({ name: 'Swimming', icon: 'fas fa-swimmer', category: 'Outdoor' });
    if (tags.includes('fishing') || this.property.fishing === true) activities.push({ name: 'Fishing', icon: 'fas fa-fish', category: 'Outdoor' });
    if (tags.includes('skiing') || this.property.skiing === true) activities.push({ name: 'Skiing', icon: 'fas fa-skiing', category: 'Outdoor' });
    if (tags.includes('snowboarding') || this.property.snowboarding === true) activities.push({ name: 'Snowboarding', icon: 'fas fa-snowboarding', category: 'Outdoor' });
    if (tags.includes('horseRiding') || this.property.horseRiding === true) activities.push({ name: 'Horse Riding', icon: 'fas fa-horse', category: 'Outdoor' });
    if (tags.includes('climbing') || this.property.climbing === true) activities.push({ name: 'Climbing', icon: 'fas fa-mountain', category: 'Outdoor' });
    if (tags.includes('camping') || this.property.camping === true) activities.push({ name: 'Camping', icon: 'fas fa-campground', category: 'Outdoor' });
    if (tags.includes('beach') || this.property.beach === true) activities.push({ name: 'Beach Access', icon: 'fas fa-umbrella-beach', category: 'Outdoor' });
    
    // Cultural Activities
    if (tags.includes('museum') || this.property.museum === true) activities.push({ name: 'Museums', icon: 'fas fa-landmark', category: 'Culture' });
    if (tags.includes('historicalSite') || this.property.historicalSite === true) activities.push({ name: 'Historical Sites', icon: 'fas fa-monument', category: 'Culture' });
    if (tags.includes('artGallery') || this.property.artGallery === true) activities.push({ name: 'Art Galleries', icon: 'fas fa-palette', category: 'Culture' });
    if (tags.includes('theatre') || this.property.theatre === true) activities.push({ name: 'Theatre', icon: 'fas fa-theater-masks', category: 'Culture' });
    if (tags.includes('localMarket') || this.property.localMarket === true) activities.push({ name: 'Local Markets', icon: 'fas fa-shopping-basket', category: 'Culture' });
    if (tags.includes('wineryTour') || this.property.wineryTour === true) activities.push({ name: 'Winery Tours', icon: 'fas fa-wine-bottle', category: 'Culture' });
    
    // Food & Drink
    if (tags.includes('restaurant') || this.property.restaurant === true) activities.push({ name: 'Restaurants', icon: 'fas fa-utensils', category: 'Food & Drink' });
    if (tags.includes('bar') || this.property.bar === true) activities.push({ name: 'Bars & Pubs', icon: 'fas fa-glass-cheers', category: 'Food & Drink' });
    if (tags.includes('cafe') || this.property.cafe === true) activities.push({ name: 'Cafes', icon: 'fas fa-coffee', category: 'Food & Drink' });
    if (tags.includes('localFood') || this.property.localFood === true) activities.push({ name: 'Local Cuisine', icon: 'fas fa-apple-alt', category: 'Food & Drink' });
    if (tags.includes('wineTasting') || this.property.wineTasting === true) activities.push({ name: 'Wine Tasting', icon: 'fas fa-wine-glass-alt', category: 'Food & Drink' });
    
    // Adventure Activities
    if (tags.includes('kayaking') || this.property.kayaking === true) activities.push({ name: 'Kayaking', icon: 'fas fa-ship', category: 'Adventure' });
    if (tags.includes('rafting') || this.property.rafting === true) activities.push({ name: 'Rafting', icon: 'fas fa-water', category: 'Adventure' });
    if (tags.includes('paragliding') || this.property.paragliding === true) activities.push({ name: 'Paragliding', icon: 'fas fa-parachute-box', category: 'Adventure' });
    if (tags.includes('zipline') || this.property.zipline === true) activities.push({ name: 'Zipline', icon: 'fas fa-mountain', category: 'Adventure' });
    
    // Relaxation
    if (tags.includes('spa') || this.property.spa === true) activities.push({ name: 'Spa & Wellness', icon: 'fas fa-spa', category: 'Relaxation' });
    if (tags.includes('yoga') || this.property.yoga === true) activities.push({ name: 'Yoga Classes', icon: 'fas fa-spa', category: 'Relaxation' });
    if (tags.includes('meditation') || this.property.meditation === true) activities.push({ name: 'Meditation', icon: 'fas fa-om', category: 'Relaxation' });
    if (tags.includes('hotSprings') || this.property.hotSprings === true) activities.push({ name: 'Hot Springs', icon: 'fas fa-hot-tub', category: 'Relaxation' });
    
    // Family Activities
    if (tags.includes('playground') || this.property.playground === true) activities.push({ name: 'Playground', icon: 'fas fa-child', category: 'Family' });
    if (tags.includes('zoo') || this.property.zoo === true) activities.push({ name: 'Zoo', icon: 'fas fa-paw', category: 'Family' });
    if (tags.includes('aquarium') || this.property.aquarium === true) activities.push({ name: 'Aquarium', icon: 'fas fa-fish', category: 'Family' });
    if (tags.includes('amusementPark') || this.property.amusementPark === true) activities.push({ name: 'Amusement Park', icon: 'fas fa-ferris-wheel', category: 'Family' });
    
    return activities;
  }

  getActivitiesByCategory(): { [key: string]: any[] } {
    const activities = this.getActivitiesList();
    const categories: { [key: string]: any[] } = {};
    
    activities.forEach(activity => {
      if (!categories[activity.category]) {
        categories[activity.category] = [];
      }
      categories[activity.category].push(activity);
    });
    
    return categories;
  }

  // Safety features - verifică atât tags cât și proprietățile booleene
  getSafetyFeatures(): any[] {
    if (!this.property) return [];
    
    const safety = [];
    const tags = this.property.tags || [];
    
    if (tags.includes('smokeDetector') || this.property.smokeDetector === true) safety.push({ name: 'Smoke Detector', icon: 'fas fa-smoke' });
    if (tags.includes('fireExtinguisher') || this.property.fireExtinguisher === true) safety.push({ name: 'Fire Extinguisher', icon: 'fas fa-fire-extinguisher' });
    if (tags.includes('carbonMonoxideDetector') || this.property.carbonMonoxideDetector === true) safety.push({ name: 'Carbon Monoxide Detector', icon: 'fas fa-gas-pump' });
    
    return safety;
  }

  // Restul metodelor rămân la fel...
  get nightsCount(): number {
    if (!this.checkInDate || !this.checkOutDate) return 0;
    
    const checkIn = new Date(this.checkInDate);
    const checkOut = new Date(this.checkOutDate);
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get totalPrice(): number {
    return (this.property.pricePerNight * this.nightsCount) + this.cleaningFee + this.serviceFee;
  }

  get canBook(): boolean {
    return !!this.checkInDate && !!this.checkOutDate && this.nightsCount >= (this.property.minNights || 1);
  }

  get guestOptions(): number[] {
    return Array.from({ length: this.property.maxGuests }, (_, i) => i + 1);
  }

  goBack() {
    this.router.navigate(['/properties']);
  }

  editProperty() {
    this.router.navigate(['/edit-property', this.property.id]);
  }

  deleteProperty() {
    if (confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      this.propertyService.deleteProperty(this.property.id).subscribe({
        next: () => {
          this.ngZone.run(() => {
            this.router.navigate(['/properties']);
          });
        },
        error: (error) => {
          console.error('Error deleting property:', error);
          this.ngZone.run(() => {
            alert('Failed to delete property. Please try again.');
          });
        }
      });
    }
  }

  openImageModal(index: number) {
    this.ngZone.run(() => {
      this.currentImageIndex = index;
      this.isImageModalOpen = true;
      this.cdr.detectChanges();
    });
  }

  closeImageModal() {
    this.ngZone.run(() => {
      this.isImageModalOpen = false;
      this.cdr.detectChanges();
    });
  }

  nextImage() {
    this.ngZone.run(() => {
      if (this.currentImageIndex < this.property.images.length - 1) {
        this.currentImageIndex++;
        this.cdr.detectChanges();
      }
    });
  }

  prevImage() {
    this.ngZone.run(() => {
      if (this.currentImageIndex > 0) {
        this.currentImageIndex--;
        this.cdr.detectChanges();
      }
    });
  }

  bookProperty() {
    if (this.isOwner) {
      this.router.navigate(['/my-properties']);
      return;
    }

    if (!this.canBook) {
      this.ngZone.run(() => {
        alert('Please select valid dates for your stay');
      });
      return;
    }

    const bookingData = {
      propertyId: this.property.id,
      checkInDate: this.checkInDate,
      checkOutDate: this.checkOutDate,
      guests: this.selectedGuests,
      totalPrice: this.totalPrice
    };

    console.log('Booking property:', bookingData);
    this.router.navigate(['/booking', this.property.id], { 
      state: { bookingData } 
    });
  }

  showOnMap() {
    const address = encodeURIComponent(`${this.property.address}, ${this.property.city}, ${this.property.country}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
  }

  getMainImage(): string {
    return this.property.images[0] || 'assets/default-property.jpg';
  }

  getOtherImages(): string[] {
    return this.property.images?.slice(1) || [];
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  onDateChange() {
    this.ngZone.run(() => {
      this.cdr.detectChanges();
    });
  }

  onGuestsChange() {
    this.ngZone.run(() => {
      this.cdr.detectChanges();
    });
  }
}
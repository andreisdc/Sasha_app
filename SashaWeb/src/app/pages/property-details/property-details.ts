import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth-service';

interface Property {
  id: string;
  title: string;
  description: string;
  propertyType: string;
  pricePerNight: number;
  country: string;
  city: string;
  address: string;
  postalCode: string;
  county: string;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  livingSpace: number;
  images: string[];
  checkInTime: string;
  checkOutTime: string;
  minNights: number;
  maxNights: number;
  amenities: string[];
  activities: any[];
  averageRating: number;
  reviewCount: number;
  ownerId: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

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

  // Random demo images
  demoImages = [
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1505873242700-f289a29e1e0f?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=600&fit=crop',
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {
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
    try {
      this.isLoading = true;
      
      // Generează imagini random pentru demo
      const randomImages = this.getRandomImages(20);

      this.property = {
        id: propertyId,
        title: 'Cozy Apartment in City Center',
        description: 'Beautiful apartment with great view of the city. Recently renovated with modern amenities and comfortable furniture. Perfect for couples or small families.',
        propertyType: 'apartment',
        pricePerNight: 85,
        country: 'Romania',
        city: 'Bucharest',
        address: 'Str. Victoriei 123, Sector 1',
        postalCode: '010123',
        county: 'Bucharest',
        bedrooms: 2,
        bathrooms: 1,
        maxGuests: 4,
        livingSpace: 65,
        images: randomImages,
        checkInTime: '15:00',
        checkOutTime: '11:00',
        minNights: 2,
        maxNights: 30,
        amenities: ['wifi', 'kitchen', 'parking', 'tv', 'ac'],
        activities: [
          { id: '1', code: 'museum', name: 'Museum / Muzee', category: 'Culture' },
          { id: '2', code: 'restaurant', name: 'Restaurant', category: 'Food' },
          { id: '3', code: 'park', name: 'Park', category: 'Outdoor' }
        ],
        averageRating: 4.8,
        reviewCount: 24,
        ownerId: 'user123',
        status: 'active',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-03-20')
      };

      // Verifică dacă utilizatorul curent este owner-ul
      const currentUser = this.authService.getCurrentUser();
      this.isOwner = currentUser?.id === this.property.ownerId;

      this.isLoading = false;

    } catch (error) {
      console.error('Error loading property:', error);
      this.isLoading = false;
      this.router.navigate(['/properties']);
    }
  }

  // Metode pentru galeria de imagini
  setMainImage(index: number) {
    this.currentMainImageIndex = index;
  }

  scrollThumbnails(direction: number) {
    const scrollAmount = 80; // Width of thumbnail + margin
    const maxOffset = -(this.property.images.length - 4) * scrollAmount;
    
    this.thumbnailScrollOffset += direction * scrollAmount;
    
    // Limitează scroll-ul
    if (this.thumbnailScrollOffset > 0) this.thumbnailScrollOffset = 0;
    if (this.thumbnailScrollOffset < maxOffset) this.thumbnailScrollOffset = maxOffset;
  }

  getRandomImages(count: number): string[] {
    const shuffled = [...this.demoImages].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
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

  getAmenityIcon(amenity: string): string {
    const icons: { [key: string]: string } = {
      'wifi': 'fas fa-wifi',
      'kitchen': 'fas fa-utensils',
      'parking': 'fas fa-parking',
      'tv': 'fas fa-tv',
      'ac': 'fas fa-snowflake',
      'heating': 'fas fa-thermometer-half',
      'washer': 'fas fa-soap',
      'pool': 'fas fa-swimming-pool',
      'gym': 'fas fa-dumbbell',
      'petFriendly': 'fas fa-paw'
    };
    return icons[amenity] || 'fas fa-check';
  }

  getAmenityLabel(amenity: string): string {
    const labels: { [key: string]: string } = {
      'wifi': 'WiFi',
      'kitchen': 'Kitchen',
      'parking': 'Parking',
      'tv': 'TV',
      'ac': 'Air Conditioning',
      'heating': 'Heating',
      'washer': 'Washer',
      'pool': 'Pool',
      'gym': 'Gym',
      'petFriendly': 'Pet Friendly'
    };
    return labels[amenity] || amenity;
  }

  getActivityIcon(code: string): string {
    const iconMap: { [key: string]: string } = {
      'hiking': 'fas fa-hiking',
      'biking': 'fas fa-bicycle',
      'swimming': 'fas fa-swimmer',
      'fishing': 'fas fa-fish',
      'skiing': 'fas fa-skiing',
      'museum': 'fas fa-landmark',
      'historical_site': 'fas fa-monument',
      'art_gallery': 'fas fa-palette',
      'restaurant': 'fas fa-utensils',
      'bar': 'fas fa-glass-cheers',
      'kayaking': 'fas fa-ship',
      'rafting': 'fas fa-water',
      'spa': 'fas fa-spa',
      'yoga': 'fas fa-spa',
      'playground': 'fas fa-child',
      'zoo': 'fas fa-paw'
    };
    return iconMap[code] || 'fas fa-map-marker-alt';
  }

  goBack() {
    this.router.navigate(['/properties']);
  }

  editProperty() {
    this.router.navigate(['/edit-property', this.property.id]);
  }

  deleteProperty() {
    if (confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      console.log('Deleting property:', this.property.id);
      this.router.navigate(['/properties']);
    }
  }

  openImageModal(index: number) {
    this.currentImageIndex = index;
    this.isImageModalOpen = true;
  }

  closeImageModal() {
    this.isImageModalOpen = false;
  }

  nextImage() {
    if (this.currentImageIndex < this.property.images.length - 1) {
      this.currentImageIndex++;
    }
  }

  prevImage() {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
    }
  }

  bookProperty() {
    if (this.isOwner) {
      this.router.navigate(['/properties']);
      return;
    }

    if (!this.canBook) {
      alert('Please select valid dates for your stay');
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
}
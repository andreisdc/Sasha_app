// properties-page-component.ts

import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Navbar } from '../../components/navbar/navbar';

// --- START: Mock-uri pentru componentele lipsă ---
@Component({ selector: 'app-property-card-component', standalone: true, template: '' })
export class PropertyCardComponent {}
@Component({ selector: 'app-badge-component', standalone: true, template: '' })
export class BadgeComponent {}
@Component({ selector: 'app-button-component', standalone: true, template: '' })
export class ButtonComponent {}
// --- SFÂRȘIT: Mock-uri ---

// --- Interfețe actualizate ---
interface Property { id: string; title: string; location: string; image: string; price: number; rating: number; reviews: number; category: string; bedrooms: number; bathrooms: number; area: string; amenities: string[]; featured?: boolean; instantBook?: boolean; }
interface Guests { persons: number; rooms: number; } // Simplificat
interface FilterState { priceRange: string; category: string; bedrooms: string; amenities: string[]; search: string; checkIn: string; checkOut: string; guests: Guests; minPrice: number; maxPrice: number; rating: string; sortBy: string; }
interface PriceRange { label: string; value: string; }
interface Category { label: string; value: string; count: number; }
interface BedroomOption { label: string; value: string; }
interface AmenityOption { label: string; value: string; count: number; }
interface RatingOption { label: string; value: string; }


@Component({
  selector: 'app-properties-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    PropertyCardComponent,
    BadgeComponent,
    ButtonComponent,
    Navbar
  ],
  templateUrl: './properties-page-component.html',
  styleUrls: ['./properties-page-component.less']
})
export class PropertiesPageComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  allProperties: Property[] = [
    // ... (Datele de proprietăți de test) ...
    { id: '1', title: 'Oceanview Paradise Resort', location: 'Maldives', image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400', price: 450, rating: 4.9, reviews: 342, category: 'Luxury', bedrooms: 3, bathrooms: 2, area: '2,500 sq ft', amenities: ['Pool', 'Beach Access', 'Spa', 'Restaurant', 'Free WiFi', 'Air Conditioning'], featured: true, instantBook: true },
    { id: '2', title: 'Mountain Lodge Retreat', location: 'Swiss Alps', image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400', price: 280, rating: 4.8, reviews: 156, category: 'Mountain', bedrooms: 4, bathrooms: 3, area: '3,200 sq ft', amenities: ['Fireplace', 'Hot Tub', 'Mountain View', 'Hiking Trails', 'Free Parking', 'Kitchen'], featured: true, instantBook: false },
    { id: '3', title: 'Urban Loft Downtown', location: 'New York City', image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400', price: 195, rating: 4.6, reviews: 89, category: 'City', bedrooms: 2, bathrooms: 1, area: '1,200 sq ft', amenities: ['Gym', 'Rooftop', 'Concierge', 'Parking', 'Free WiFi', 'City View'], instantBook: true },
    { id: '4', title: 'Beachside Villa', location: 'Santorini, Greece', image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400', price: 320, rating: 4.9, reviews: 234, category: 'Villa', bedrooms: 5, bathrooms: 4, area: '4,000 sq ft', amenities: ['Private Pool', 'Ocean View', 'Garden', 'Chef Kitchen', 'BBQ', 'Beachfront'], featured: true, instantBook: true },
    { id: '5', title: 'Tropical Beach Resort', location: 'Bali, Indonesia', image: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400', price: 165, rating: 4.7, reviews: 412, category: 'Beach', bedrooms: 3, bathrooms: 2, area: '2,800 sq ft', amenities: ['Beachfront', 'Spa', 'Restaurant', 'Water Sports', 'Pool', 'Free Breakfast'], instantBook: true },
    { id: '6', title: 'Desert Glamping Experience', location: 'Dubai, UAE', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400', price: 380, rating: 4.8, reviews: 98, category: 'Trending', bedrooms: 1, bathrooms: 1, area: '800 sq ft', amenities: ['Desert View', 'BBQ Area', 'Stargazing', 'Camel Rides', 'Campfire', 'Outdoor Shower'], featured: true },
    { id: '7', title: 'Luxury Penthouse Suite', location: 'Tokyo, Japan', image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400', price: 550, rating: 4.9, reviews: 187, category: 'Luxury', bedrooms: 3, bathrooms: 2, area: '2,200 sq ft', amenities: ['City View', 'Concierge', 'Pool', 'Gym', 'Spa', 'Private Balcony'], instantBook: true },
    { id: '8', title: 'Cozy Mountain Cabin', location: 'Colorado, USA', image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400', price: 120, rating: 4.5, reviews: 76, category: 'Mountain', bedrooms: 2, bathrooms: 1, area: '1,100 sq ft', amenities: ['Fireplace', 'Mountain View', 'Hiking', 'Wildlife', 'Hot Tub', 'Wood Interior'], instantBook: false },
    { id: '9', title: 'Modern City Apartment', location: 'Berlin, Germany', image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400', price: 85, rating: 4.3, reviews: 203, category: 'City', bedrooms: 1, bathrooms: 1, area: '750 sq ft', amenities: ['Free WiFi', 'Kitchen', 'City Center', 'Public Transport', 'Smart TV', 'Workspace'], instantBook: true },
    { id: '10', title: 'Lakeside Cottage', location: 'Lake District, UK', image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400', price: 180, rating: 4.7, reviews: 124, category: 'Mountain', bedrooms: 3, bathrooms: 2, area: '1,800 sq ft', amenities: ['Lake View', 'Fishing', 'Kayaking', 'Fireplace', 'Garden', 'BBQ'], instantBook: true }
  ];

  filteredProperties: Property[] = [];
  sortedProperties: Property[] = [];
  loading = false;
  hasMoreProperties = true;
  favoriteProperties: string[] = [];
  showMobileFilters = false;

  priceRanges: PriceRange[] = [ { label: 'Any price', value: '' }, { label: 'Under $100', value: '0-100' }, { label: '$100 - $200', value: '100-200' }, { label: '$200 - $300', value: '200-300' }, { label: '$300 - $500', value: '300-500' }, { label: 'Over $500', value: '500-10000' } ];
  categories: Category[] = [ { label: 'All types', value: '', count: 0 }, { label: 'Luxury', value: 'Luxury', count: 0 }, { label: 'Beach', value: 'Beach', count: 0 }, { label: 'Mountain', value: 'Mountain', count: 0 }, { label: 'City', value: 'City', count: 0 }, { label: 'Villa', value: 'Villa', count: 0 }, { label: 'Trending', value: 'Trending', count: 0 } ];
  bedroomOptions: BedroomOption[] = [ { label: 'Any bedrooms', value: '' }, { label: '1 Bedroom', value: '1' }, { label: '2 Bedrooms', value: '2' }, { label: '3+ Bedrooms', value: '3' } ];
  amenities: AmenityOption[] = [ { label: 'Swimming Pool', value: 'Pool', count: 0 }, { label: 'Free WiFi', value: 'Free WiFi', count: 0 }, { label: 'Air Conditioning', value: 'Air Conditioning', count: 0 }, { label: 'Free Parking', value: 'Free Parking', count: 0 }, { label: 'Kitchen', value: 'Kitchen', count: 0 }, { label: 'Gym', value: 'Gym', count: 0 }, { label: 'Spa', value: 'Spa', count: 0 }, { label: 'Beachfront', value: 'Beachfront', count: 0 } ];
  ratingOptions: RatingOption[] = [ { label: 'Any rating', value: '' }, { label: 'Excellent 4.5+', value: '4.5' }, { label: 'Very Good 4.0+', value: '4.0' }, { label: 'Good 3.5+', value: '3.5' } ];

  selectedFilters: FilterState = {
    priceRange: '',
    category: '',
    bedrooms: '',
    amenities: [],
    search: '',
    checkIn: this.getDefaultDate(1),
    checkOut: this.getDefaultDate(4),
    guests: {
      persons: 2,
      rooms: 1
    },
    minPrice: 0,
    maxPrice: 1000, 
    rating: '',
    sortBy: 'recommended'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private zone: NgZone, 
    private el: ElementRef
  ) {}

  ngOnInit() {
    this.updateCategoryCounts();
    this.updateAmenityCounts();
    this.loadFavorites();
    
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.applyUrlFilters(params);
      });

    this.applyFilters();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  toggleFilterSection(event: MouseEvent): void {
    const header = event.currentTarget as HTMLElement;
    const section = header.closest('.filter-section');
    
    if (section) {
      if (event.target === header || header.contains(event.target as Node)) {
        section.classList.toggle('active');
      }
    }
  }

  private getDefaultDate(daysFromNow: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
  }

  private loadFavorites(): void {
    const saved = localStorage.getItem('favoriteProperties');
    if (saved) {
      this.favoriteProperties = JSON.parse(saved);
    }
  }

  private saveFavorites(): void {
    localStorage.setItem('favoriteProperties', JSON.stringify(this.favoriteProperties));
  }

  updateCategoryCounts(): void {
    this.categories.forEach(cat => {
      if (cat.value) {
        cat.count = this.allProperties.filter(p => p.category === cat.value).length;
      } else {
        cat.count = this.allProperties.length;
      }
    });
  }

  updateAmenityCounts(): void {
    this.amenities.forEach(amenity => {
      amenity.count = this.allProperties.filter(p => 
        p.amenities.includes(amenity.value)
      ).length;
    });
  }

  applyUrlFilters(params: any): void {
    const newFilters: FilterState = {
      priceRange: params.priceRange || '',
      category: params.category || '',
      bedrooms: params.bedrooms || '',
      amenities: params.amenities ? params.amenities.split(',') : [],
      search: params.search || '',
      checkIn: params.checkIn || this.getDefaultDate(1),
      checkOut: params.checkOut || this.getDefaultDate(4),
      guests: {
        persons: params.persons ? parseInt(params.persons) : 2,
        rooms: params.rooms ? parseInt(params.rooms) : 1
      },
      minPrice: params.minPrice ? parseInt(params.minPrice) : 0,
      maxPrice: params.maxPrice ? parseInt(params.maxPrice) : 1000,
      rating: params.rating || '',
      sortBy: params.sortBy || 'recommended'
    };

    this.selectedFilters = newFilters;
    this.applyFilters();
  }

  onFilterChange(filterType: string, value: any): void {
    if (filterType === 'amenities') {
      const index = this.selectedFilters.amenities.indexOf(value);
      if (index > -1) {
        this.selectedFilters.amenities.splice(index, 1);
      } else {
        this.selectedFilters.amenities.push(value);
      }
    } else {
      (this.selectedFilters as any)[filterType] = value;
    }
    
    if (filterType === 'category') {
       this.closeFilterSection('category');
    }

    this.updateUrl();
    this.applyFilters();
  }
  
  private closeFilterSection(type: string): void {
      const iconMap: {[key: string]: string} = {
          'category': 'icon-category'
      };
      const selector = iconMap[type];
      if (!selector) return;
      
      const allSections = this.el.nativeElement.querySelectorAll('.filter-section');
      allSections.forEach((section: HTMLElement) => {
          if (section.querySelector(`.${selector}`)) {
              section.classList.remove('active');
          }
      });
  }


  onSearchChange(searchTerm: string): void {
    this.selectedFilters.search = searchTerm;
    this.updateUrl();
    this.applyFilters();
  }

  onPriceRangeChange(value: string): void {
    this.selectedFilters.maxPrice = parseInt(value);
    this.selectedFilters.priceRange = ''; 
    this.updateUrl();
    this.applyFilters();
  }

  onSortChange(sortBy: string): void {
    this.selectedFilters.sortBy = sortBy;
    this.sortProperties(sortBy);
    this.updateUrl();
  }

  adjustGuests(type: keyof Guests, change: number): void {
    const current = this.selectedFilters.guests[type];
    const newValue = current + change;
    
    const minValue = 1;
    const maxValue = 10;
    
    if (newValue >= minValue && newValue <= maxValue) {
      this.selectedFilters.guests[type] = newValue;
      this.updateUrl();
      this.applyFilters();
    }
  }

  applyFilters(): void {
    let filtered = [...this.allProperties];

    filtered = filtered.filter(property => 
      property.price >= this.selectedFilters.minPrice && 
      property.price <= this.selectedFilters.maxPrice
    );
    
    if (this.selectedFilters.priceRange) {
      const [min, max] = this.selectedFilters.priceRange.split('-').map(Number);
      filtered = filtered.filter(property => 
        property.price >= min && property.price <= max
      );
    }
    
    if (this.selectedFilters.category) {
      filtered = filtered.filter(property => 
        property.category === this.selectedFilters.category
      );
    }

    if (this.selectedFilters.bedrooms) {
      const bedrooms = parseInt(this.selectedFilters.bedrooms);
      filtered = filtered.filter(property => {
        if (bedrooms === 3) return property.bedrooms >= 3;
        return property.bedrooms === bedrooms;
      });
    }

    if (this.selectedFilters.amenities.length > 0) {
      filtered = filtered.filter(property =>
        this.selectedFilters.amenities.every(amenity =>
          property.amenities.includes(amenity)
        )
      );
    }

    if (this.selectedFilters.rating) {
      const minRating = parseFloat(this.selectedFilters.rating);
      filtered = filtered.filter(property => property.rating >= minRating);
    }

    if (this.selectedFilters.search) {
      const searchTerm = this.selectedFilters.search.toLowerCase();
      filtered = filtered.filter(property =>
        property.title.toLowerCase().includes(searchTerm) ||
        property.location.toLowerCase().includes(searchTerm)
      );
    }

    const totalPersons = this.selectedFilters.guests.persons;
    const requiredRooms = this.selectedFilters.guests.rooms;
    filtered = filtered.filter(property => 
      (property.bedrooms * 2) >= totalPersons &&
      property.bedrooms >= requiredRooms
    );

    this.filteredProperties = filtered;
    this.sortProperties(this.selectedFilters.sortBy);
    
    this.cdr.markForCheck();
  }

  sortProperties(sortBy: string): void {
    switch (sortBy) {
      case 'price-low':
        this.sortedProperties = [...this.filteredProperties].sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        this.sortedProperties = [...this.filteredProperties].sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        this.sortedProperties = [...this.filteredProperties].sort((a, b) => b.rating - a.rating);
        break;
      default:
        this.sortedProperties = [...this.filteredProperties].sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return b.rating - a.rating;
        });
    }
    this.cdr.markForCheck();
  }

  updateUrl(): void {
    const queryParams: any = {};
    const defaults = {
        persons: 2, rooms: 1, minPrice: 0, maxPrice: 1000, sortBy: 'recommended'
    };

    if (this.selectedFilters.priceRange) queryParams.priceRange = this.selectedFilters.priceRange;
    if (this.selectedFilters.category) queryParams.category = this.selectedFilters.category;
    if (this.selectedFilters.bedrooms) queryParams.bedrooms = this.selectedFilters.bedrooms;
    if (this.selectedFilters.amenities.length > 0) queryParams.amenities = this.selectedFilters.amenities.join(',');
    if (this.selectedFilters.search) queryParams.search = this.selectedFilters.search;
    if (this.selectedFilters.checkIn) queryParams.checkIn = this.selectedFilters.checkIn;
    if (this.selectedFilters.checkOut) queryParams.checkOut = this.selectedFilters.checkOut;
    if (this.selectedFilters.guests.persons !== defaults.persons) queryParams.persons = this.selectedFilters.guests.persons.toString();
    if (this.selectedFilters.guests.rooms !== defaults.rooms) queryParams.rooms = this.selectedFilters.guests.rooms.toString();
    if (this.selectedFilters.minPrice !== defaults.minPrice) queryParams.minPrice = this.selectedFilters.minPrice.toString();
    if (this.selectedFilters.maxPrice !== defaults.maxPrice) queryParams.maxPrice = this.selectedFilters.maxPrice.toString();
    if (this.selectedFilters.rating) queryParams.rating = this.selectedFilters.rating;
    if (this.selectedFilters.sortBy !== defaults.sortBy) queryParams.sortBy = this.selectedFilters.sortBy;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  clearFilters(): void {
    this.selectedFilters = {
      priceRange: '',
      category: '',
      bedrooms: '',
      amenities: [],
      search: '',
      checkIn: this.getDefaultDate(1),
      checkOut: this.getDefaultDate(4),
      guests: {
        persons: 2,
        rooms: 1
      },
      minPrice: 0,
      maxPrice: 1000,
      rating: '',
      sortBy: 'recommended'
    };
    
    this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
    this.applyFilters();
    
    setTimeout(() => {
        const firstSection = this.el.nativeElement.querySelector('.filter-section');
        if (firstSection && !firstSection.classList.contains('active')) {
            firstSection.classList.add('active');
        }
    }, 0);
  }

  clearSearch(): void {
    this.selectedFilters.search = '';
    this.updateUrl();
    this.applyFilters();
  }

  getActiveFiltersCount(): number {
    let count = 0;
    if (this.selectedFilters.category) count++;
    if (this.selectedFilters.amenities.length > 0) count++;
    if (this.selectedFilters.search) count++;
    if (this.selectedFilters.rating) count++;
    if (this.selectedFilters.minPrice > 0 || this.selectedFilters.maxPrice < 1000) count++;
    if (this.selectedFilters.guests.persons !== 2 || this.selectedFilters.guests.rooms !== 1) count++;
    return count;
  }

  getResultsTitle(): string {
    const count = this.filteredProperties.length;
    if (this.selectedFilters.search) {
      return `${count} result${count !== 1 ? 's' : ''} for "${this.selectedFilters.search}"`;
    }
    if (this.selectedFilters.category) {
      const categoryLabel = this.getCategoryLabel(this.selectedFilters.category);
      return `${count} ${categoryLabel} ${count !== 1 ? 'Properties' : 'Property'}`;
    }
    return `${count} Property${count !== 1 ? 's' : ''} Found`;
  }

  getCategoryLabel(value: string): string { return this.categories.find(c => c.value === value)?.label || value; }
  getAmenityLabel(value: string): string { return this.amenities.find(a => a.value === value)?.label || value; }
  getRatingLabel(value: string): string { return this.ratingOptions.find(r => r.value === value)?.label || value; }

  isStarFilled(star: number, ratingValue: string): boolean {
    if (!ratingValue) return false;
    return star <= parseFloat(ratingValue);
  }

  getTotalNights(): number {
    if (!this.selectedFilters.checkIn || !this.selectedFilters.checkOut) return 1;
    try {
      const checkIn = new Date(this.selectedFilters.checkIn);
      const checkOut = new Date(this.selectedFilters.checkOut);
      if (checkOut <= checkIn) return 1;
      const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      return diffDays > 0 ? diffDays : 1;
    } catch (e) { return 1; }
  }

  calculateTotalPrice(pricePerNight: number): number {
    return pricePerNight * this.getTotalNights();
  }

  toggleFavorite(propertyId: string): void {
    const index = this.favoriteProperties.indexOf(propertyId);
    if (index > -1) {
      this.favoriteProperties.splice(index, 1);
    } else {
      this.favoriteProperties.push(propertyId);
    }
    this.saveFavorites();
  }

  isFavorite(propertyId: string): boolean {
    return this.favoriteProperties.includes(propertyId);
  }

  bookNow(property: Property): void {
    this.router.navigate(['/booking', property.id], {
      queryParams: {
        checkIn: this.selectedFilters.checkIn,
        checkOut: this.selectedFilters.checkOut,
        persons: this.selectedFilters.guests.persons,
        rooms: this.selectedFilters.guests.rooms
      }
    });
  }

  handleImageError(event: any): void {
    event.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400';
  }

  toggleMobileFilters(): void {
    this.showMobileFilters = !this.showMobileFilters;
  }

  loadMoreProperties(): void {
    this.loading = true;
    setTimeout(() => {
      this.hasMoreProperties = false;
      this.loading = false;
      this.cdr.markForCheck();
    }, 1000);
  }
}
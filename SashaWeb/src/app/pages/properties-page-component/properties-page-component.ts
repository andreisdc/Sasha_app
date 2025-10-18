// properties-page.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PropertyCardComponent } from '../../components/property-card-component/property-card-component';
import { BadgeComponent } from '../../components/badge-component/badge-component';
import { ButtonComponent } from '../../components/button-component/button-component';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Navbar } from "../../components/navbar/navbar";

interface Property {
  id: string;
  title: string;
  location: string;
  image: string;
  price: number;
  rating: number;
  reviews: number;
  category: string;
  bedrooms: number;
  bathrooms: number;
  area: string;
  amenities: string[];
}

interface FilterState {
  priceRange: string;
  category: string;
  bedrooms: string;
  amenities: string[];
  search: string;
}

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
    {
      id: '1',
      title: 'Oceanview Paradise Resort',
      location: 'Maldives',
      image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400',
      price: 450,
      rating: 4.9,
      reviews: 342,
      category: 'Luxury',
      bedrooms: 3,
      bathrooms: 2,
      area: '2,500 sq ft',
      amenities: ['Pool', 'Beach Access', 'Spa', 'Restaurant']
    },
    {
      id: '2',
      title: 'Mountain Lodge Retreat',
      location: 'Swiss Alps',
      image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400',
      price: 280,
      rating: 4.8,
      reviews: 156,
      category: 'Mountain',
      bedrooms: 4,
      bathrooms: 3,
      area: '3,200 sq ft',
      amenities: ['Fireplace', 'Hot Tub', 'Mountain View', 'Hiking Trails']
    },
    {
      id: '3',
      title: 'Urban Loft Downtown',
      location: 'New York City',
      image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400',
      price: 195,
      rating: 4.6,
      reviews: 89,
      category: 'City',
      bedrooms: 2,
      bathrooms: 1,
      area: '1,200 sq ft',
      amenities: ['Gym', 'Rooftop', 'Concierge', 'Parking']
    },
    {
      id: '4',
      title: 'Beachside Villa',
      location: 'Santorini, Greece',
      image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400',
      price: 320,
      rating: 4.9,
      reviews: 234,
      category: 'Villa',
      bedrooms: 5,
      bathrooms: 4,
      area: '4,000 sq ft',
      amenities: ['Private Pool', 'Ocean View', 'Garden', 'Chef Kitchen']
    },
    {
      id: '5',
      title: 'Tropical Beach Resort',
      location: 'Bali, Indonesia',
      image: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400',
      price: 165,
      rating: 4.7,
      reviews: 412,
      category: 'Beach',
      bedrooms: 3,
      bathrooms: 2,
      area: '2,800 sq ft',
      amenities: ['Beachfront', 'Spa', 'Restaurant', 'Water Sports']
    },
    {
      id: '6',
      title: 'Desert Glamping Experience',
      location: 'Dubai, UAE',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
      price: 380,
      rating: 4.8,
      reviews: 98,
      category: 'Trending',
      bedrooms: 1,
      bathrooms: 1,
      area: '800 sq ft',
      amenities: ['Desert View', 'BBQ Area', 'Stargazing', 'Camel Rides']
    },
    {
      id: '7',
      title: 'Luxury Penthouse Suite',
      location: 'Tokyo, Japan',
      image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400',
      price: 550,
      rating: 4.9,
      reviews: 187,
      category: 'Luxury',
      bedrooms: 3,
      bathrooms: 2,
      area: '2,200 sq ft',
      amenities: ['City View', 'Concierge', 'Pool', 'Gym']
    },
    {
      id: '8',
      title: 'Cozy Mountain Cabin',
      location: 'Colorado, USA',
      image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400',
      price: 120,
      rating: 4.5,
      reviews: 76,
      category: 'Mountain',
      bedrooms: 2,
      bathrooms: 1,
      area: '1,100 sq ft',
      amenities: ['Fireplace', 'Mountain View', 'Hiking', 'Wildlife']
    }
  ];

  filteredProperties: Property[] = [];
  
  // Filter options
  priceRanges = [
    { label: 'Under $100', value: '0-100' },
    { label: '$100 - $200', value: '100-200' },
    { label: '$200 - $300', value: '200-300' },
    { label: '$300 - $500', value: '300-500' },
    { label: 'Over $500', value: '500-10000' }
  ];

  categories = [
    { label: 'All', value: '', count: 0 },
    { label: 'Luxury', value: 'Luxury', count: 2 },
    { label: 'Beachfront', value: 'Beach', count: 1 },
    { label: 'Mountain', value: 'Mountain', count: 2 },
    { label: 'City Center', value: 'City', count: 1 },
    { label: 'Private Villas', value: 'Villa', count: 1 },
    { label: 'Trending', value: 'Trending', count: 1 }
  ];

  amenities = [
    'Swimming Pool',
    'Gym',
    'Ocean View',
    'Mountain View',
    'Free Parking',
    'Spa',
    'Restaurant',
    'Beach Access'
  ];

  selectedFilters: FilterState = {
    priceRange: '',
    category: '',
    bedrooms: '',
    amenities: [],
    search: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    // Initialize counts
    this.updateCategoryCounts();
    
    // Listen for URL parameter changes
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.applyUrlFilters(params);
      });

    // Initial filter
    this.applyFilters();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  updateCategoryCounts() {
    this.categories.forEach(cat => {
      if (cat.value) {
        cat.count = this.allProperties.filter(p => p.category === cat.value).length;
      } else {
        cat.count = this.allProperties.length;
      }
    });
  }

  applyUrlFilters(params: any) {
    const newFilters: FilterState = {
      priceRange: params.priceRange || '',
      category: params.category || '',
      bedrooms: params.bedrooms || '',
      amenities: params.amenities ? params.amenities.split(',') : [],
      search: params.search || ''
    };

    this.selectedFilters = newFilters;
    this.applyFilters();
  }

  onFilterChange(filterType: string, value: any) {
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

    this.updateUrl();
    this.applyFilters();
  }

  onSearchChange(searchTerm: string) {
    this.selectedFilters.search = searchTerm;
    this.updateUrl();
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.allProperties];

    // Price filter
    if (this.selectedFilters.priceRange) {
      const [min, max] = this.selectedFilters.priceRange.split('-').map(Number);
      filtered = filtered.filter(property => 
        property.price >= min && property.price <= max
      );
    }

    // Category filter
    if (this.selectedFilters.category) {
      filtered = filtered.filter(property => 
        property.category === this.selectedFilters.category
      );
    }

    // Bedrooms filter
    if (this.selectedFilters.bedrooms) {
      const bedrooms = parseInt(this.selectedFilters.bedrooms);
      filtered = filtered.filter(property => {
        if (bedrooms === 3) {
          return property.bedrooms >= 3;
        }
        return property.bedrooms === bedrooms;
      });
    }

    // Amenities filter
    if (this.selectedFilters.amenities.length > 0) {
      filtered = filtered.filter(property =>
        this.selectedFilters.amenities.every(amenity =>
          property.amenities.includes(amenity)
        )
      );
    }

    // Search filter
    if (this.selectedFilters.search) {
      const searchTerm = this.selectedFilters.search.toLowerCase();
      filtered = filtered.filter(property =>
        property.title.toLowerCase().includes(searchTerm) ||
        property.location.toLowerCase().includes(searchTerm) ||
        property.category.toLowerCase().includes(searchTerm)
      );
    }

    this.filteredProperties = filtered;
    this.updateCategoryCounts();
  }

  updateUrl() {
    const queryParams: any = {};

    if (this.selectedFilters.priceRange) queryParams.priceRange = this.selectedFilters.priceRange;
    if (this.selectedFilters.category) queryParams.category = this.selectedFilters.category;
    if (this.selectedFilters.bedrooms) queryParams.bedrooms = this.selectedFilters.bedrooms;
    if (this.selectedFilters.amenities.length > 0) queryParams.amenities = this.selectedFilters.amenities.join(',');
    if (this.selectedFilters.search) queryParams.search = this.selectedFilters.search;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  clearFilters() {
    this.selectedFilters = {
      priceRange: '',
      category: '',
      bedrooms: '',
      amenities: [],
      search: ''
    };
    
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true
    });
    
    this.applyFilters();
  }

  getActiveFiltersCount(): number {
    let count = 0;
    if (this.selectedFilters.priceRange) count++;
    if (this.selectedFilters.category) count++;
    if (this.selectedFilters.bedrooms) count++;
    if (this.selectedFilters.amenities.length > 0) count++;
    if (this.selectedFilters.search) count++;
    return count;
  }
}
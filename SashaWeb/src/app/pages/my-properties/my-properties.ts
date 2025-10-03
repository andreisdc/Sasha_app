import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

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
}

@Component({
  selector: 'app-my-properties',
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
  totalBookings = 0;
  totalRevenue = 0;

  constructor(
    private router: Router,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadProperties();
  }

  async loadProperties() {
    console.log('🔄 MyProperties - Starting loadProperties');
    
    // Folosim ngZone.run pentru a asigura actualizarea UI-ului
    this.ngZone.run(() => {
      this.isLoading = true;
      this.errorMessage = '';
      this.cdr.detectChanges(); // Forțează detectarea imediată
    });

    try {
      console.log('📡 MyProperties - Simulating API call...');
      
      // Simulăm API call cu delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      const mockProperties: Property[] = [
        {
          id: '1',
          title: 'Cozy Apartment in City Center',
          description: 'Beautiful apartment with great view',
          city: 'Bucharest',
          country: 'Romania',
          pricePerNight: 85,
          bedrooms: 2,
          bathrooms: 1,
          maxGuests: 4,
          images: ['assets/property1.jpg'],
          status: 'active',
          averageRating: 4.8,
          reviewCount: 24,
          totalBookings: 15,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-03-20')
        },
        {
          id: '2',
          title: 'Modern Studio Near Park',
          description: 'Newly renovated studio apartment',
          city: 'Cluj-Napoca',
          country: 'Romania',
          pricePerNight: 65,
          bedrooms: 1,
          bathrooms: 1,
          maxGuests: 2,
          images: ['assets/property2.jpg'],
          status: 'pending',
          averageRating: 0,
          reviewCount: 0,
          totalBookings: 0,
          createdAt: new Date('2024-03-01'),
          updatedAt: new Date('2024-03-01')
        },
        {
          id: '3',
          title: 'Luxury Villa with Pool',
          description: 'Spacious villa with private pool',
          city: 'Brasov',
          country: 'Romania',
          pricePerNight: 200,
          bedrooms: 4,
          bathrooms: 3,
          maxGuests: 8,
          images: ['assets/property3.jpg'],
          status: 'draft',
          averageRating: 0,
          reviewCount: 0,
          totalBookings: 0,
          createdAt: new Date('2024-02-10'),
          updatedAt: new Date('2024-03-15')
        }
      ];

      console.log('✅ MyProperties - Data loaded:', mockProperties);

      // Actualizăm datele în ngZone pentru a declanșa change detection
      this.ngZone.run(() => {
        this.properties = mockProperties;
        this.calculateStats();
        this.filterProperties();
        this.isLoading = false;
        console.log('✅ MyProperties - isLoading set to:', this.isLoading);
        this.cdr.detectChanges(); // Forțează detectarea finală
      });

    } catch (error) {
      console.error('❌ MyProperties - Error loading properties:', error);
      
      this.ngZone.run(() => {
        this.errorMessage = 'Failed to load properties';
        this.isLoading = false;
        this.properties = [];
        this.filteredProperties = [];
        this.cdr.detectChanges();
      });
    }
  }

  calculateStats() {
    this.activePropertiesCount = this.properties.filter(p => p.status === 'active').length;
    this.pendingPropertiesCount = this.properties.filter(p => p.status === 'pending').length;
    this.totalBookings = this.properties.reduce((sum, p) => sum + p.totalBookings, 0);
    this.totalRevenue = this.properties.reduce((sum, p) => sum + (p.pricePerNight * p.totalBookings), 0);
    
    console.log('📊 MyProperties - Stats calculated:', {
      active: this.activePropertiesCount,
      pending: this.pendingPropertiesCount,
      bookings: this.totalBookings,
      revenue: this.totalRevenue
    });
  }

  filterProperties() {
    if (this.selectedFilter === 'all') {
      this.filteredProperties = this.properties;
    } else {
      this.filteredProperties = this.properties.filter(p => p.status === this.selectedFilter);
    }
    
    console.log('🔍 MyProperties - Filtered properties:', this.filteredProperties.length);
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

  deleteProperty(property: Property) {
    if (confirm(`Are you sure you want to delete "${property.title}"?`)) {
      // Folosim ngZone.run pentru a asigura actualizarea UI-ului
      this.ngZone.run(() => {
        this.properties = this.properties.filter(p => p.id !== property.id);
        this.calculateStats();
        this.filterProperties();
        this.cdr.detectChanges();
        
        console.log('🗑️ MyProperties - Property deleted:', property.id);
      });
    }
  }
}
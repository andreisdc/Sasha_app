import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';

interface PropertyData {
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
  activities: Activity[]; // ✅ Activitate nouă
}

interface Activity {
  id: string;
  code: string;
  name: string;
  category: string | null;
  createdAt: Date;
}

interface Amenity {
  name: string;
  label: string;
  icon: string;
  selected: boolean;
}

@Component({
  selector: 'app-add-property',
  imports: [CommonModule, FormsModule],
  templateUrl: './add-property.html',
  styleUrl: './add-property.less',
  animations: [
    trigger('fadeAnimation', [
      transition(':increment', [
        style({ opacity: 0, transform: 'translateX(20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ]),
      transition(':decrement', [
        style({ opacity: 0, transform: 'translateX(-20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ])
  ]
})
export class AddProperty implements OnInit {
  currentStep = 1;
  totalSteps = 5; // ✅ Actualizat la 5 etape
  isLoading = false;
  activitySearch = '';
  selectedCategory: string = 'all';
  
  propertyData: PropertyData = {
    title: '',
    description: '',
    propertyType: '',
    pricePerNight: 0,
    country: '',
    city: '',
    address: '',
    postalCode: '',
    county: '',
    bedrooms: 0,
    bathrooms: 0,
    maxGuests: 0,
    livingSpace: 0,
    images: [],
    checkInTime: '15:00',
    checkOutTime: '11:00',
    minNights: 1,
    maxNights: 30,
    amenities: [],
    activities: [] // ✅ Activitate nouă
  };

  steps = [
    { label: 'Basic Info' },
    { label: 'Location' },
    { label: 'Details' },
    { label: 'Photos' },
    { label: 'Activities' } // ✅ Etapă nouă
  ];

  // ✅ Date mock pentru activități (în loc de API call)
  allActivities: Activity[] = [
    { id: '3177dd13-4b3c-432e-9204-d2e14b82c5b1', code: 'hiking', name: 'Hiking / Drumeții', category: 'Outdoor', createdAt: new Date() },
    { id: '5f2f37c0-8dee-4a98-b538-5b3ebab9ba6a', code: 'biking', name: 'Biking / Ciclism', category: 'Outdoor', createdAt: new Date() },
    { id: 'b6112487-0488-43d7-b701-b2385d73b912', code: 'swimming', name: 'Swimming / Înot', category: 'Outdoor', createdAt: new Date() },
    { id: '9061a41a-97a8-4224-a1b4-7219ae99ffea', code: 'fishing', name: 'Fishing / Pescuit', category: 'Outdoor', createdAt: new Date() },
    { id: '728f5e5f-9b2b-4567-a647-ab7991d00236', code: 'skiing', name: 'Skiing / Schi', category: 'Outdoor', createdAt: new Date() },
    { id: '43504581-eea5-4ded-8f21-e141d10d2aa5', code: 'museum', name: 'Museum / Muzee', category: 'Culture', createdAt: new Date() },
    { id: 'd17fc3e1-db7b-4266-a87a-d33daa240946', code: 'historical_site', name: 'Historical Site', category: 'Culture', createdAt: new Date() },
    { id: 'a2fa6004-1e35-49b4-88f2-b44b0ee614a0', code: 'art_gallery', name: 'Art Gallery', category: 'Culture', createdAt: new Date() },
    { id: '1c8ba001-a562-4bcf-b539-11436ef43ad6', code: 'restaurant', name: 'Restaurant', category: 'Food', createdAt: new Date() },
    { id: '1c09057a-c327-488c-ab20-8c1d6f139371', code: 'bar', name: 'Bar / Pub', category: 'Food', createdAt: new Date() },
    { id: 'c64d8bc4-ed86-443c-9afe-c4d72561dea2', code: 'kayaking', name: 'Kayaking / Caiac', category: 'Adventure', createdAt: new Date() },
    { id: '4480260d-9660-4c4b-8dce-e04345c8d87b', code: 'rafting', name: 'Rafting', category: 'Adventure', createdAt: new Date() },
    { id: 'b677764c-bf1d-43d0-8c20-1425af49cf8a', code: 'spa', name: 'Spa / Wellness', category: 'Relax', createdAt: new Date() },
    { id: 'c24878df-0fa0-458d-855b-9d442ecc36ca', code: 'yoga', name: 'Yoga Classes', category: 'Relax', createdAt: new Date() },
    { id: 'd8623e4a-c32c-440c-acb3-d75e7467ce4d', code: 'playground', name: 'Playground / Loc de joacă', category: 'Family', createdAt: new Date() },
    { id: 'efac8cfc-efba-4077-beaa-4985a16502d2', code: 'zoo', name: 'Zoo / Grădină zoologică', category: 'Family', createdAt: new Date() }
  ];

  filteredActivities: Activity[] = [];
  selectedActivities: Activity[] = [];

  activityCategories = ['all', 'Outdoor', 'Culture', 'Food', 'Adventure', 'Relax', 'Family'];

  amenities: Amenity[] = [
    // ... existing amenities
  ];

  constructor(private router: Router) {}

  ngOnInit() {
    this.filteredActivities = [...this.allActivities];
  }

  // ✅ Metode noi pentru activități
  filterActivities() {
    this.filteredActivities = this.allActivities.filter(activity => {
      const matchesSearch = activity.name.toLowerCase().includes(this.activitySearch.toLowerCase()) ||
                           activity.code.toLowerCase().includes(this.activitySearch.toLowerCase());
      const matchesCategory = this.selectedCategory === 'all' || activity.category === this.selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }

  selectCategory(category: string) {
    this.selectedCategory = category;
    this.filterActivities();
  }

  toggleActivity(activity: Activity) {
    const index = this.selectedActivities.findIndex(a => a.id === activity.id);
    
    if (index > -1) {
      this.selectedActivities.splice(index, 1);
    } else {
      this.selectedActivities.push(activity);
    }
  }

  removeActivity(activity: Activity) {
    this.selectedActivities = this.selectedActivities.filter(a => a.id !== activity.id);
  }

  isActivitySelected(activityId: string): boolean {
    return this.selectedActivities.some(a => a.id === activityId);
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

  getCategoryLabel(category: string): string {
    const labels: { [key: string]: string } = {
      'all': 'All Activities',
      'Outdoor': 'Outdoor Activities',
      'Culture': 'Culture & History',
      'Food': 'Food & Drink',
      'Adventure': 'Adventure Sports',
      'Relax': 'Relaxation',
      'Family': 'Family Friendly'
    };
    
    return labels[category] || category;
  }

  // Navigation methods (actualizate)
  nextStep() {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  // Validation methods (actualizate)
  isStep1Valid(): boolean {
    return !!this.propertyData.title && 
           !!this.propertyData.description && 
           !!this.propertyData.propertyType && 
           this.propertyData.pricePerNight > 0;
  }

  isStep2Valid(): boolean {
    return !!this.propertyData.country && 
           !!this.propertyData.city && 
           !!this.propertyData.address;
  }

  isStep3Valid(): boolean {
    return this.propertyData.bedrooms >= 0 && 
           this.propertyData.bathrooms >= 0 && 
           this.propertyData.maxGuests > 0;
  }

  isStep4Valid(): boolean {
    return this.propertyData.images.length > 0;
  }

  // Step 5 nu are validare obligatorie - activitățile sunt opționale

  // File handling
  onFileSelected(event: any) {
    const files = event.target.files;
    if (files) {
      for (let file of files) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.propertyData.images.push(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    }
  }

  removePhoto(index: number) {
    this.propertyData.images.splice(index, 1);
  }

  // Get selected amenities
  getSelectedAmenities(): string[] {
    return this.amenities
      .filter(amenity => amenity.selected)
      .map(amenity => amenity.name);
  }

  // Submit property (actualizat)
  async submitProperty() {
    this.isLoading = true;

    try {
      // Add selected amenities to property data
      this.propertyData.amenities = this.getSelectedAmenities();
      
      // Add selected activities to property data
      this.propertyData.activities = this.selectedActivities;

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Property data to submit:', this.propertyData);
      console.log('Selected activities:', this.selectedActivities);
      
      // Here you would call your actual API service
      // await this.propertyService.addProperty(this.propertyData);
      
      alert('Property added successfully!');
      this.router.navigate(['/properties']);
      
    } catch (error) {
      console.error('Error adding property:', error);
      alert('Error adding property. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }

  goBack() {
    this.router.navigate(['/properties']);
  }
}
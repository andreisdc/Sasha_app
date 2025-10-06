import { 
  Component, 
  OnInit, 
  inject, 
  ChangeDetectorRef, 
  NgZone,
  ChangeDetectionStrategy 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { PropertyService } from '../../core/services/property-service';
import { AuthService } from '../../core/services/auth-service';
import { firstValueFrom } from 'rxjs';
import { CreatePropertyRequest } from '../../core/interfaces/propertyResponse';

// Interfaces
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
  activities: Activity[];
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
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-property.html',
  styleUrls: ['./add-property.less'],
  changeDetection: ChangeDetectionStrategy.Default,
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
export class AddPropertyComponent implements OnInit {
  currentStep = 1;
  totalSteps = 5;
  
  isLoading = false;
  uploadProgress = 0;
  currentOperation = '';
  createdPropertyId: string = '';
  uploadStatus = '';
  errorMessage = '';
  
  activitySearch = '';
  selectedCategory: string = 'all';
  
  propertyData: PropertyData = {
    title: '',
    description: '',
    propertyType: '',
    pricePerNight: 0,
    country: 'Romania',
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
    activities: []
  };

  selectedFiles: File[] = [];

  steps = [
    { label: 'Basic Info' },
    { label: 'Location' },
    { label: 'Details' },
    { label: 'Photos' },
    { label: 'Activities' }
  ];

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
    { name: 'wifi', label: 'WiFi', icon: 'fas fa-wifi', selected: false },
    { name: 'kitchen', label: 'Kitchen', icon: 'fas fa-utensils', selected: false },
    { name: 'parking', label: 'Parking', icon: 'fas fa-parking', selected: false },
    { name: 'tv', label: 'TV', icon: 'fas fa-tv', selected: false },
    { name: 'ac', label: 'Air Conditioning', icon: 'fas fa-snowflake', selected: false },
    { name: 'heating', label: 'Heating', icon: 'fas fa-thermometer-half', selected: false },
    { name: 'washer', label: 'Washer', icon: 'fas fa-soap', selected: false },
    { name: 'pool', label: 'Pool', icon: 'fas fa-swimming-pool', selected: false },
    { name: 'gym', label: 'Gym', icon: 'fas fa-dumbbell', selected: false },
    { name: 'petFriendly', label: 'Pet Friendly', icon: 'fas fa-paw', selected: false }
  ];

  private router = inject(Router);
  private propertyService = inject(PropertyService);
  private authService = inject(AuthService);
  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.filteredActivities = [...this.allActivities];
    this.cdr.markForCheck();
  }

  filterActivities() {
    this.ngZone.run(() => {
      this.filteredActivities = this.allActivities.filter(activity => {
        const matchesSearch = activity.name.toLowerCase().includes(this.activitySearch.toLowerCase()) ||
                             activity.code.toLowerCase().includes(this.activitySearch.toLowerCase());
        const matchesCategory = this.selectedCategory === 'all' || activity.category === this.selectedCategory;
        return matchesSearch && matchesCategory;
      });
      this.cdr.markForCheck();
    });
  }

  selectCategory(category: string) {
    this.ngZone.run(() => {
      this.selectedCategory = category;
      this.filterActivities();
      this.cdr.markForCheck();
    });
  }

  toggleActivity(activity: Activity) {
    this.ngZone.run(() => {
      const index = this.selectedActivities.findIndex(a => a.id === activity.id);
      
      if (index > -1) {
        this.selectedActivities.splice(index, 1);
      } else {
        this.selectedActivities.push(activity);
      }
      this.cdr.markForCheck();
    });
  }

  removeActivity(activity: Activity) {
    this.ngZone.run(() => {
      this.selectedActivities = this.selectedActivities.filter(a => a.id !== activity.id);
      this.cdr.markForCheck();
    });
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

  nextStep() {
    this.ngZone.run(() => {
      if (this.currentStep < this.totalSteps) {
        this.currentStep++;
        this.cdr.markForCheck();
      }
    });
  }

  previousStep() {
    this.ngZone.run(() => {
      if (this.currentStep > 1) {
        this.currentStep--;
        this.cdr.markForCheck();
      }
    });
  }

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

  onFileSelected(event: any) {
    const files: FileList = event.target.files;
    if (files && files.length > 0) {
      this.ngZone.run(() => {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          
          if (file.size > 5 * 1024 * 1024) {
            this.showErrorInModal(`File ${file.name} is too large. Maximum size is 5MB.`);
            continue;
          }
          
          if (!file.type.startsWith('image/')) {
            this.showErrorInModal(`File ${file.name} is not an image.`);
            continue;
          }
          
          this.selectedFiles.push(file);
          
          const reader = new FileReader();
          reader.onload = (e: any) => {
            this.ngZone.run(() => {
              this.propertyData.images.push(e.target.result);
              this.cdr.markForCheck();
            });
          };
          reader.readAsDataURL(file);
        }
        this.cdr.markForCheck();
      });
    }
  }

  removePhoto(index: number) {
    this.ngZone.run(() => {
      this.propertyData.images.splice(index, 1);
      this.selectedFiles.splice(index, 1);
      this.cdr.markForCheck();
    });
  }

  getSelectedAmenities(): string[] {
    return this.amenities
      .filter(amenity => amenity.selected)
      .map(amenity => amenity.name);
  }

  private convertToCreateRequest(): CreatePropertyRequest {
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    return {
      ownerId: currentUser.id,
      title: this.propertyData.title,
      description: this.propertyData.description,
      locationType: this.propertyData.propertyType,
      address: this.propertyData.address,
      city: this.propertyData.city,
      county: this.propertyData.county,
      country: this.propertyData.country,
      postalCode: this.propertyData.postalCode,
      latitude: 44.4268,
      longitude: 26.1025,
      pricePerNight: this.propertyData.pricePerNight,
      minNights: this.propertyData.minNights || 1,
      maxNights: this.propertyData.maxNights || 30,
      checkInTime: this.propertyData.checkInTime ? this.propertyData.checkInTime + ':00' : '15:00:00',
      checkOutTime: this.propertyData.checkOutTime ? this.propertyData.checkOutTime + ':00' : '11:00:00',
      maxGuests: this.propertyData.maxGuests,
      bathrooms: this.propertyData.bathrooms,
      kitchen: this.getSelectedAmenities().includes('kitchen'),
      livingSpace: this.propertyData.livingSpace || 0,
      petFriendly: this.getSelectedAmenities().includes('petFriendly'),
      smokeDetector: true,
      fireExtinguisher: true,
      carbonMonoxideDetector: true,
      lockType: 'standard',
      neighborhoodDescription: 'Great neighborhood with many amenities',
      tags: this.getSelectedAmenities(),
      instantBook: false
    };
  }

  async submitProperty() {
    if (this.selectedFiles.length === 0) {
      this.showErrorInModal('Please add at least one photo');
      return;
    }

    this.startLoading('Creating property...', 'Starting the process...', 10);

    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        this.showErrorInModal('You need to be logged in to add a property!');
        this.router.navigate(['/login']);
        return;
      }

      this.updateLoadingState('Creating property details...', 'Setting up your property information...', 30);

      const createRequest = this.convertToCreateRequest();
      const createdProperty = await firstValueFrom(this.propertyService.createProperty(createRequest));
      
      if (!createdProperty) {
        throw new Error('Failed to create property - no response from server');
      }

      const propertyId = createdProperty.id || 
                        (createdProperty as any)._id || 
                        (createdProperty as any).propertyId;
      
      if (!propertyId) {
        throw new Error('Failed to create property - no ID returned in response');
      }

      this.ngZone.run(() => {
        this.createdPropertyId = propertyId;
        this.cdr.markForCheck();
      });

      this.updateLoadingState('Uploading photos...', `Uploading ${this.selectedFiles.length} photos...`, 50);

      await this.uploadPhotos(this.createdPropertyId);

      this.updateLoadingState('Finalizing...', 'Completing your property setup...', 90);

      await new Promise(resolve => setTimeout(resolve, 1000));

      this.updateLoadingState('Complete!', 'Property created successfully!', 100);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      this.completeProcess();
      
    } catch (error: any) {
      this.handleProcessError(error);
    }
  }

  private startLoading(operation: string, status: string, progress: number) {
    this.ngZone.run(() => {
      this.isLoading = true;
      this.errorMessage = '';
      this.currentOperation = operation;
      this.uploadStatus = status;
      this.uploadProgress = progress;
      this.cdr.markForCheck();
    });
  }

  private updateLoadingState(operation: string, status: string, progress: number) {
    this.ngZone.run(() => {
      this.currentOperation = operation;
      this.uploadStatus = status;
      this.uploadProgress = progress;
      this.cdr.markForCheck();
    });
  }

  private showErrorInModal(message: string) {
    this.ngZone.run(() => {
      this.errorMessage = message;
      this.isLoading = true;
      this.currentOperation = 'Error';
      this.uploadStatus = message;
      this.cdr.markForCheck();
    });
  }

  private completeProcess() {
    this.ngZone.run(() => {
      this.isLoading = false;
      this.cdr.markForCheck();
      this.router.navigate(['/properties']);
    });
  }

  private async uploadPhotos(propertyId: string): Promise<void> {
    if (this.selectedFiles.length === 0) {
      return;
    }

    try {
      this.updateLoadingState('Uploading photos...', `Uploading 1/${this.selectedFiles.length} photos...`, 50);
      
      const uploadResult = await firstValueFrom(
        this.propertyService.uploadPropertyPhotos(propertyId, this.selectedFiles)
      );

      if (uploadResult && uploadResult.success) {
        const photoCount = uploadResult.data?.length || 0;
        this.updateLoadingState('Processing photos...', `Successfully uploaded ${photoCount} photos!`, 70);
      } else {
        throw new Error('Photo upload failed - server returned unsuccessful response');
      }
    } catch (error: any) {
      this.updateLoadingState('Error', 'Failed to upload photos. Please try again.', 50);
      throw error;
    }
  }

  private handleProcessError(error: any) {
    let errorMessage = 'Error creating property. Please try again.';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    if (error.status === 400) {
      errorMessage = `Validation error: ${errorMessage}`;
    } else if (error.status === 401) {
      errorMessage = 'You are not authorized to create properties. Please log in.';
    } else if (error.status === 413) {
      errorMessage = 'Photos are too large. Please reduce file sizes (max 5MB per photo).';
    } else if (error.status === 404) {
      errorMessage = 'Server endpoint not found. Please check the API URL.';
    } else if (error.status === 500) {
      errorMessage = `Server error: ${errorMessage}`;
    } else if (error.name === 'HttpErrorResponse') {
      errorMessage = 'Network error. Please check your connection and try again.';
    }

    this.ngZone.run(() => {
      this.isLoading = true;
      this.errorMessage = errorMessage;
      this.currentOperation = 'Error';
      this.uploadStatus = errorMessage;
      this.cdr.markForCheck();
    });
  }

  goBack() {
    if (this.currentStep === 1) {
      this.router.navigate(['/properties']);
    } else {
      this.previousStep();
    }
  }

  retryProcess() {
    this.ngZone.run(() => {
      this.isLoading = false;
      this.errorMessage = '';
      this.cdr.markForCheck();
    });
  }

  cancelProcess() {
    this.ngZone.run(() => {
      this.isLoading = false;
      this.errorMessage = '';
      this.cdr.markForCheck();
      this.router.navigate(['/properties']);
    });
  }
}
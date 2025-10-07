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
  backendField: string; // Numele câmpului în backend
}

// Interface pentru CreatePropertyRequest care se potrivește cu backend-ul
interface CreatePropertyRequest {
  ownerId: string | undefined;
  title: string;
  description: string;
  locationType: string;
  address: string;
  city: string;
  county: string;
  country: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  pricePerNight: number;
  minNights: number;
  maxNights: number;
  checkInTime: string;
  checkOutTime: string;
  maxGuests: number;
  bathrooms: number;
  kitchen: boolean;
  livingSpace: number;
  petFriendly: boolean;
  smokeDetector: boolean;
  fireExtinguisher: boolean;
  carbonMonoxideDetector: boolean;
  lockType: string;
  neighborhoodDescription: string;
  tags: string[];
  instantBook: boolean;

  // === OUTDOOR ACTIVITIES ===
  hiking: boolean;
  biking: boolean;
  swimming: boolean;
  fishing: boolean;
  skiing: boolean;
  snowboarding: boolean;
  horseRiding: boolean;
  climbing: boolean;
  camping: boolean;
  beach: boolean;

  // === CULTURAL ACTIVITIES ===
  museum: boolean;
  historicalSite: boolean;
  artGallery: boolean;
  theatre: boolean;
  localMarket: boolean;
  wineryTour: boolean;

  // === FOOD & DRINK ===
  restaurant: boolean;
  bar: boolean;
  cafe: boolean;
  localFood: boolean;
  wineTasting: boolean;

  // === ADVENTURE ACTIVITIES ===
  kayaking: boolean;
  rafting: boolean;
  paragliding: boolean;
  zipline: boolean;

  // === RELAXATION ===
  spa: boolean;
  yoga: boolean;
  meditation: boolean;
  hotSprings: boolean;

  // === FAMILY ACTIVITIES ===
  playground: boolean;
  zoo: boolean;
  aquarium: boolean;
  amusementPark: boolean;

  // === PROPERTY AMENITIES ===
  wifi: boolean;
  airConditioning: boolean;
  heating: boolean;
  pool: boolean;
  parking: boolean;
  fireplace: boolean;
  balcony: boolean;
  garden: boolean;
  tv: boolean;
  hotTub: boolean;
  wheelchairAccessible: boolean;
  bbq: boolean;
  breakfastIncluded: boolean;
  washer: boolean;
  dryer: boolean;
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
    // Outdoor Activities
    { id: '1', code: 'hiking', name: 'Hiking / Drumeții', category: 'Outdoor', createdAt: new Date() },
    { id: '2', code: 'biking', name: 'Biking / Ciclism', category: 'Outdoor', createdAt: new Date() },
    { id: '3', code: 'swimming', name: 'Swimming / Înot', category: 'Outdoor', createdAt: new Date() },
    { id: '4', code: 'fishing', name: 'Fishing / Pescuit', category: 'Outdoor', createdAt: new Date() },
    { id: '5', code: 'skiing', name: 'Skiing / Schi', category: 'Outdoor', createdAt: new Date() },
    { id: '6', code: 'snowboarding', name: 'Snowboarding', category: 'Outdoor', createdAt: new Date() },
    { id: '7', code: 'horseRiding', name: 'Horse Riding / Echitație', category: 'Outdoor', createdAt: new Date() },
    { id: '8', code: 'climbing', name: 'Climbing / Alpinism', category: 'Outdoor', createdAt: new Date() },
    { id: '9', code: 'camping', name: 'Camping', category: 'Outdoor', createdAt: new Date() },
    { id: '10', code: 'beach', name: 'Beach / Plajă', category: 'Outdoor', createdAt: new Date() },

    // Cultural Activities
    { id: '11', code: 'museum', name: 'Museum / Muzee', category: 'Culture', createdAt: new Date() },
    { id: '12', code: 'historicalSite', name: 'Historical Site / Sit istoric', category: 'Culture', createdAt: new Date() },
    { id: '13', code: 'artGallery', name: 'Art Gallery / Galerie de artă', category: 'Culture', createdAt: new Date() },
    { id: '14', code: 'theatre', name: 'Theatre / Teatru', category: 'Culture', createdAt: new Date() },
    { id: '15', code: 'localMarket', name: 'Local Market / Piață locală', category: 'Culture', createdAt: new Date() },
    { id: '16', code: 'wineryTour', name: 'Winery Tour / Tur de vinărie', category: 'Culture', createdAt: new Date() },

    // Food & Drink
    { id: '17', code: 'restaurant', name: 'Restaurant', category: 'Food', createdAt: new Date() },
    { id: '18', code: 'bar', name: 'Bar / Pub', category: 'Food', createdAt: new Date() },
    { id: '19', code: 'cafe', name: 'Cafe / Cafenea', category: 'Food', createdAt: new Date() },
    { id: '20', code: 'localFood', name: 'Local Food / Mâncare locală', category: 'Food', createdAt: new Date() },
    { id: '21', code: 'wineTasting', name: 'Wine Tasting / Degustare de vin', category: 'Food', createdAt: new Date() },

    // Adventure Activities
    { id: '22', code: 'kayaking', name: 'Kayaking / Caiac', category: 'Adventure', createdAt: new Date() },
    { id: '23', code: 'rafting', name: 'Rafting', category: 'Adventure', createdAt: new Date() },
    { id: '24', code: 'paragliding', name: 'Paragliding / Parapantă', category: 'Adventure', createdAt: new Date() },
    { id: '25', code: 'zipline', name: 'Zipline / Tiroliană', category: 'Adventure', createdAt: new Date() },

    // Relaxation
    { id: '26', code: 'spa', name: 'Spa / Wellness', category: 'Relax', createdAt: new Date() },
    { id: '27', code: 'yoga', name: 'Yoga Classes', category: 'Relax', createdAt: new Date() },
    { id: '28', code: 'meditation', name: 'Meditation / Meditație', category: 'Relax', createdAt: new Date() },
    { id: '29', code: 'hotSprings', name: 'Hot Springs / Izvoare termale', category: 'Relax', createdAt: new Date() },

    // Family Activities
    { id: '30', code: 'playground', name: 'Playground / Loc de joacă', category: 'Family', createdAt: new Date() },
    { id: '31', code: 'zoo', name: 'Zoo / Grădină zoologică', category: 'Family', createdAt: new Date() },
    { id: '32', code: 'aquarium', name: 'Aquarium / Acvariu', category: 'Family', createdAt: new Date() },
    { id: '33', code: 'amusementPark', name: 'Amusement Park / Parc de distracții', category: 'Family', createdAt: new Date() }
  ];

  filteredActivities: Activity[] = [];
  selectedActivities: Activity[] = [];

  activityCategories = ['all', 'Outdoor', 'Culture', 'Food', 'Adventure', 'Relax', 'Family'];

  amenities: Amenity[] = [
    // Property Amenities
    { name: 'wifi', label: 'WiFi', icon: 'fas fa-wifi', selected: false, backendField: 'wifi' },
    { name: 'airConditioning', label: 'Air Conditioning', icon: 'fas fa-snowflake', selected: false, backendField: 'airConditioning' },
    { name: 'heating', label: 'Heating', icon: 'fas fa-thermometer-half', selected: false, backendField: 'heating' },
    { name: 'pool', label: 'Pool', icon: 'fas fa-swimming-pool', selected: false, backendField: 'pool' },
    { name: 'parking', label: 'Parking', icon: 'fas fa-parking', selected: false, backendField: 'parking' },
    { name: 'fireplace', label: 'Fireplace', icon: 'fas fa-fire', selected: false, backendField: 'fireplace' },
    { name: 'balcony', label: 'Balcony', icon: 'fas fa-building', selected: false, backendField: 'balcony' },
    { name: 'garden', label: 'Garden', icon: 'fas fa-seedling', selected: false, backendField: 'garden' },
    { name: 'tv', label: 'TV', icon: 'fas fa-tv', selected: false, backendField: 'tv' },
    { name: 'hotTub', label: 'Hot Tub', icon: 'fas fa-hot-tub', selected: false, backendField: 'hotTub' },
    { name: 'wheelchairAccessible', label: 'Wheelchair Accessible', icon: 'fas fa-wheelchair', selected: false, backendField: 'wheelchairAccessible' },
    { name: 'bbq', label: 'BBQ', icon: 'fas fa-utensils', selected: false, backendField: 'bbq' },
    { name: 'breakfastIncluded', label: 'Breakfast Included', icon: 'fas fa-coffee', selected: false, backendField: 'breakfastIncluded' },
    { name: 'washer', label: 'Washer', icon: 'fas fa-soap', selected: false, backendField: 'washer' },
    { name: 'dryer', label: 'Dryer', icon: 'fas fa-wind', selected: false, backendField: 'dryer' },
    { name: 'kitchen', label: 'Kitchen', icon: 'fas fa-utensils', selected: false, backendField: 'kitchen' },
    { name: 'petFriendly', label: 'Pet Friendly', icon: 'fas fa-paw', selected: false, backendField: 'petFriendly' }
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
      // Outdoor
      'hiking': 'fas fa-hiking',
      'biking': 'fas fa-bicycle',
      'swimming': 'fas fa-swimmer',
      'fishing': 'fas fa-fish',
      'skiing': 'fas fa-skiing',
      'snowboarding': 'fas fa-snowboarding',
      'horseRiding': 'fas fa-horse',
      'climbing': 'fas fa-mountain',
      'camping': 'fas fa-campground',
      'beach': 'fas fa-umbrella-beach',
      
      // Cultural
      'museum': 'fas fa-landmark',
      'historicalSite': 'fas fa-monument',
      'artGallery': 'fas fa-palette',
      'theatre': 'fas fa-theater-masks',
      'localMarket': 'fas fa-shopping-basket',
      'wineryTour': 'fas fa-wine-bottle',
      
      // Food & Drink
      'restaurant': 'fas fa-utensils',
      'bar': 'fas fa-glass-cheers',
      'cafe': 'fas fa-coffee',
      'localFood': 'fas fa-apple-alt',
      'wineTasting': 'fas fa-wine-glass-alt',
      
      // Adventure
      'kayaking': 'fas fa-ship',
      'rafting': 'fas fa-water',
      'paragliding': 'fas fa-parachute-box',
      'zipline': 'fas fa-mountain',
      
      // Relaxation
      'spa': 'fas fa-spa',
      'yoga': 'fas fa-spa',
      'meditation': 'fas fa-om',
      'hotSprings': 'fas fa-hot-tub',
      
      // Family
      'playground': 'fas fa-child',
      'zoo': 'fas fa-paw',
      'aquarium': 'fas fa-fish',
      'amusementPark': 'fas fa-ferris-wheel'
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

    // Map selected activities to boolean fields
    const selectedActivityCodes = this.selectedActivities.map(a => a.code);
    
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
      latitude: 44.4268, // Default Bucharest coordinates
      longitude: 26.1025,
      pricePerNight: this.propertyData.pricePerNight,
      minNights: this.propertyData.minNights || 1,
      maxNights: this.propertyData.maxNights || 30,
      checkInTime: this.propertyData.checkInTime ? this.propertyData.checkInTime + ':00' : '15:00:00',
      checkOutTime: this.propertyData.checkOutTime ? this.propertyData.checkOutTime + ':00' : '11:00:00',
      maxGuests: this.propertyData.maxGuests,
      bathrooms: this.propertyData.bathrooms,
      kitchen: this.amenities.find(a => a.backendField === 'kitchen')?.selected || false,
      livingSpace: this.propertyData.livingSpace || 0,
      petFriendly: this.amenities.find(a => a.backendField === 'petFriendly')?.selected || false,
      smokeDetector: true, // Default safety features
      fireExtinguisher: true,
      carbonMonoxideDetector: true,
      lockType: 'standard',
      neighborhoodDescription: this.propertyData.description.substring(0, 200) + '...', // Truncate description
      tags: this.getSelectedAmenities(),
      instantBook: false,

      // === OUTDOOR ACTIVITIES ===
      hiking: selectedActivityCodes.includes('hiking'),
      biking: selectedActivityCodes.includes('biking'),
      swimming: selectedActivityCodes.includes('swimming'),
      fishing: selectedActivityCodes.includes('fishing'),
      skiing: selectedActivityCodes.includes('skiing'),
      snowboarding: selectedActivityCodes.includes('snowboarding'),
      horseRiding: selectedActivityCodes.includes('horseRiding'),
      climbing: selectedActivityCodes.includes('climbing'),
      camping: selectedActivityCodes.includes('camping'),
      beach: selectedActivityCodes.includes('beach'),

      // === CULTURAL ACTIVITIES ===
      museum: selectedActivityCodes.includes('museum'),
      historicalSite: selectedActivityCodes.includes('historicalSite'),
      artGallery: selectedActivityCodes.includes('artGallery'),
      theatre: selectedActivityCodes.includes('theatre'),
      localMarket: selectedActivityCodes.includes('localMarket'),
      wineryTour: selectedActivityCodes.includes('wineryTour'),

      // === FOOD & DRINK ===
      restaurant: selectedActivityCodes.includes('restaurant'),
      bar: selectedActivityCodes.includes('bar'),
      cafe: selectedActivityCodes.includes('cafe'),
      localFood: selectedActivityCodes.includes('localFood'),
      wineTasting: selectedActivityCodes.includes('wineTasting'),

      // === ADVENTURE ACTIVITIES ===
      kayaking: selectedActivityCodes.includes('kayaking'),
      rafting: selectedActivityCodes.includes('rafting'),
      paragliding: selectedActivityCodes.includes('paragliding'),
      zipline: selectedActivityCodes.includes('zipline'),

      // === RELAXATION ===
      spa: selectedActivityCodes.includes('spa'),
      yoga: selectedActivityCodes.includes('yoga'),
      meditation: selectedActivityCodes.includes('meditation'),
      hotSprings: selectedActivityCodes.includes('hotSprings'),

      // === FAMILY ACTIVITIES ===
      playground: selectedActivityCodes.includes('playground'),
      zoo: selectedActivityCodes.includes('zoo'),
      aquarium: selectedActivityCodes.includes('aquarium'),
      amusementPark: selectedActivityCodes.includes('amusementPark'),

      // === PROPERTY AMENITIES ===
      wifi: this.amenities.find(a => a.backendField === 'wifi')?.selected || false,
      airConditioning: this.amenities.find(a => a.backendField === 'airConditioning')?.selected || false,
      heating: this.amenities.find(a => a.backendField === 'heating')?.selected || false,
      pool: this.amenities.find(a => a.backendField === 'pool')?.selected || false,
      parking: this.amenities.find(a => a.backendField === 'parking')?.selected || false,
      fireplace: this.amenities.find(a => a.backendField === 'fireplace')?.selected || false,
      balcony: this.amenities.find(a => a.backendField === 'balcony')?.selected || false,
      garden: this.amenities.find(a => a.backendField === 'garden')?.selected || false,
      tv: this.amenities.find(a => a.backendField === 'tv')?.selected || false,
      hotTub: this.amenities.find(a => a.backendField === 'hotTub')?.selected || false,
      wheelchairAccessible: this.amenities.find(a => a.backendField === 'wheelchairAccessible')?.selected || false,
      bbq: this.amenities.find(a => a.backendField === 'bbq')?.selected || false,
      breakfastIncluded: this.amenities.find(a => a.backendField === 'breakfastIncluded')?.selected || false,
      washer: this.amenities.find(a => a.backendField === 'washer')?.selected || false,
      dryer: this.amenities.find(a => a.backendField === 'dryer')?.selected || false
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
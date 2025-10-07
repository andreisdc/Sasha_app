import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// ✅ Noile interfețe optimizate pentru backend
export interface PropertySummary {
  id: string;
  ownerId: string;
  title: string;
  city: string;
  country: string;
  pricePerNight: number;
  bathrooms: number;
  maxGuests: number;
  averageRating: number;
  reviewCount: number;
  isVerified: boolean;
  status: string;
  coverImageUrl: string;
  createdAt: string;
}

export interface PropertyDetails {
  id: string;
  ownerId: string;
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
  status: string;
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
  averageRating: number;
  reviewCount: number;
  neighborhoodDescription: string;
  tags: string[];
  instantBook: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  images: PropertyImage[];
  
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

export interface PropertyImage {
  id: string;
  url: string;
  isCover: boolean;
  createdAt: string;
}

// ⚠️ Interfața veche pentru compatibilitate - ACTUALIZATĂ cu toate câmpurile
export interface Property {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  propertyType: string;
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
  bedrooms: number;
  kitchen: boolean;
  livingSpace: number;
  petFriendly: boolean;
  smokeDetector: boolean;
  fireExtinguisher: boolean;
  carbonMonoxideDetector: boolean;
  lockType: string;
  averageRating: number;
  reviewCount: number;
  neighborhoodDescription: string;
  tags: string[];
  instantBook: boolean;
  isVerified: boolean;
  status: string;
  images: string[];
  amenities: string[];
  activities: any[];
  createdAt: string;
  updatedAt: string;
  
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

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface CreatePropertyRequest {
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

export interface UploadPhotosResponse {
  success: boolean;
  message: string;
  data: string[];
}

@Injectable({
  providedIn: 'root'
})
export class PropertyService {
  private apiUrl = 'http://localhost:5043/properties';
  private http = inject(HttpClient);

  // Helper method to convert PropertyDetails to Property (pentru compatibilitate)
  private convertToProperty(details: PropertyDetails): Property {
    return {
      id: details.id,
      ownerId: details.ownerId,
      title: details.title,
      description: details.description,
      propertyType: details.locationType,
      locationType: details.locationType,
      address: details.address,
      city: details.city,
      county: details.county,
      country: details.country,
      postalCode: details.postalCode,
      latitude: details.latitude,
      longitude: details.longitude,
      pricePerNight: details.pricePerNight,
      minNights: details.minNights,
      maxNights: details.maxNights,
      checkInTime: details.checkInTime,
      checkOutTime: details.checkOutTime,
      maxGuests: details.maxGuests,
      bathrooms: details.bathrooms,
      bedrooms: this.calculateBedrooms(details),
      kitchen: details.kitchen,
      livingSpace: details.livingSpace,
      petFriendly: details.petFriendly,
      smokeDetector: details.smokeDetector,
      fireExtinguisher: details.fireExtinguisher,
      carbonMonoxideDetector: details.carbonMonoxideDetector,
      lockType: details.lockType,
      averageRating: details.averageRating,
      reviewCount: details.reviewCount,
      neighborhoodDescription: details.neighborhoodDescription,
      tags: details.tags,
      instantBook: details.instantBook,
      isVerified: details.isVerified,
      status: details.status,
      images: details.images?.map(img => img.url) || [],
      amenities: this.getAmenitiesFromDetails(details),
      activities: this.getActivitiesFromDetails(details),
      createdAt: details.createdAt,
      updatedAt: details.updatedAt,
      
      // === OUTDOOR ACTIVITIES ===
      hiking: details.hiking,
      biking: details.biking,
      swimming: details.swimming,
      fishing: details.fishing,
      skiing: details.skiing,
      snowboarding: details.snowboarding,
      horseRiding: details.horseRiding,
      climbing: details.climbing,
      camping: details.camping,
      beach: details.beach,

      // === CULTURAL ACTIVITIES ===
      museum: details.museum,
      historicalSite: details.historicalSite,
      artGallery: details.artGallery,
      theatre: details.theatre,
      localMarket: details.localMarket,
      wineryTour: details.wineryTour,

      // === FOOD & DRINK ===
      restaurant: details.restaurant,
      bar: details.bar,
      cafe: details.cafe,
      localFood: details.localFood,
      wineTasting: details.wineTasting,

      // === ADVENTURE ACTIVITIES ===
      kayaking: details.kayaking,
      rafting: details.rafting,
      paragliding: details.paragliding,
      zipline: details.zipline,

      // === RELAXATION ===
      spa: details.spa,
      yoga: details.yoga,
      meditation: details.meditation,
      hotSprings: details.hotSprings,

      // === FAMILY ACTIVITIES ===
      playground: details.playground,
      zoo: details.zoo,
      aquarium: details.aquarium,
      amusementPark: details.amusementPark,

      // === PROPERTY AMENITIES ===
      wifi: details.wifi,
      airConditioning: details.airConditioning,
      heating: details.heating,
      pool: details.pool,
      parking: details.parking,
      fireplace: details.fireplace,
      balcony: details.balcony,
      garden: details.garden,
      tv: details.tv,
      hotTub: details.hotTub,
      wheelchairAccessible: details.wheelchairAccessible,
      bbq: details.bbq,
      breakfastIncluded: details.breakfastIncluded,
      washer: details.washer,
      dryer: details.dryer
    };
  }

  // Helper method to convert PropertySummary to Property (pentru compatibilitate)
  private convertSummaryToProperty(summary: PropertySummary): Property {
    return {
      id: summary.id,
      ownerId: summary.ownerId,
      title: summary.title,
      description: '',
      propertyType: '',
      locationType: '',
      address: '',
      city: summary.city,
      county: '',
      country: summary.country,
      postalCode: '',
      latitude: 0,
      longitude: 0,
      pricePerNight: summary.pricePerNight,
      minNights: 1,
      maxNights: 30,
      checkInTime: '15:00:00',
      checkOutTime: '11:00:00',
      maxGuests: summary.maxGuests,
      bathrooms: summary.bathrooms,
      bedrooms: 0,
      kitchen: false,
      livingSpace: 0,
      petFriendly: false,
      smokeDetector: false,
      fireExtinguisher: false,
      carbonMonoxideDetector: false,
      lockType: '',
      averageRating: summary.averageRating,
      reviewCount: summary.reviewCount,
      neighborhoodDescription: '',
      tags: [],
      instantBook: false,
      isVerified: summary.isVerified,
      status: summary.status,
      images: summary.coverImageUrl ? [summary.coverImageUrl] : [],
      amenities: [],
      activities: [],
      createdAt: summary.createdAt,
      updatedAt: summary.createdAt,
      
      // === OUTDOOR ACTIVITIES ===
      hiking: false,
      biking: false,
      swimming: false,
      fishing: false,
      skiing: false,
      snowboarding: false,
      horseRiding: false,
      climbing: false,
      camping: false,
      beach: false,

      // === CULTURAL ACTIVITIES ===
      museum: false,
      historicalSite: false,
      artGallery: false,
      theatre: false,
      localMarket: false,
      wineryTour: false,

      // === FOOD & DRINK ===
      restaurant: false,
      bar: false,
      cafe: false,
      localFood: false,
      wineTasting: false,

      // === ADVENTURE ACTIVITIES ===
      kayaking: false,
      rafting: false,
      paragliding: false,
      zipline: false,

      // === RELAXATION ===
      spa: false,
      yoga: false,
      meditation: false,
      hotSprings: false,

      // === FAMILY ACTIVITIES ===
      playground: false,
      zoo: false,
      aquarium: false,
      amusementPark: false,

      // === PROPERTY AMENITIES ===
      wifi: false,
      airConditioning: false,
      heating: false,
      pool: false,
      parking: false,
      fireplace: false,
      balcony: false,
      garden: false,
      tv: false,
      hotTub: false,
      wheelchairAccessible: false,
      bbq: false,
      breakfastIncluded: false,
      washer: false,
      dryer: false
    };
  }

  private calculateBedrooms(details: PropertyDetails): number {
    if (details.livingSpace > 0) {
      return Math.max(1, Math.floor(details.livingSpace / 20));
    }
    return 1;
  }

  private getAmenitiesFromDetails(details: PropertyDetails): string[] {
    const amenities: string[] = [];
    if (details.wifi) amenities.push('wifi');
    if (details.airConditioning) amenities.push('airConditioning');
    if (details.heating) amenities.push('heating');
    if (details.pool) amenities.push('pool');
    if (details.parking) amenities.push('parking');
    if (details.kitchen) amenities.push('kitchen');
    if (details.tv) amenities.push('tv');
    if (details.washer) amenities.push('washer');
    if (details.dryer) amenities.push('dryer');
    if (details.petFriendly) amenities.push('petFriendly');
    if (details.fireplace) amenities.push('fireplace');
    if (details.balcony) amenities.push('balcony');
    if (details.garden) amenities.push('garden');
    if (details.hotTub) amenities.push('hotTub');
    if (details.wheelchairAccessible) amenities.push('wheelchairAccessible');
    if (details.bbq) amenities.push('bbq');
    if (details.breakfastIncluded) amenities.push('breakfastIncluded');
    return amenities;
  }

  private getActivitiesFromDetails(details: PropertyDetails): any[] {
    const activities: any[] = [];
    if (details.hiking) activities.push({ id: '1', name: 'Hiking', category: 'Outdoor' });
    if (details.biking) activities.push({ id: '2', name: 'Biking', category: 'Outdoor' });
    if (details.swimming) activities.push({ id: '3', name: 'Swimming', category: 'Outdoor' });
    if (details.restaurant) activities.push({ id: '4', name: 'Restaurant', category: 'Food' });
    if (details.bar) activities.push({ id: '5', name: 'Bar', category: 'Food' });
    if (details.spa) activities.push({ id: '6', name: 'Spa', category: 'Relax' });
    if (details.yoga) activities.push({ id: '7', name: 'Yoga', category: 'Relax' });
    // Adaugă și alte activități după necesitate
    return activities;
  }

  // CREATE PROPERTY
  createProperty(propertyData: CreatePropertyRequest): Observable<Property> {
    console.log('📦 Creating property with data:', propertyData);
    
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<ApiResponse<PropertyDetails>>(this.apiUrl, propertyData, { headers })
      .pipe(
        map(response => {
          if (response.success && response.data) {
            console.log('✅ Property creation API response:', response);
            return this.convertToProperty(response.data);
          } else {
            throw new Error(response.message || 'Failed to create property');
          }
        })
      );
  }

  // UPLOAD PHOTOS
  uploadPropertyPhotos(propertyId: string, photos: File[]): Observable<UploadPhotosResponse> {
    const formData = new FormData();
    
    photos.forEach((photo, index) => {
      formData.append('photos', photo, photo.name);
    });

    console.log(`📸 Uploading ${photos.length} photos for property ${propertyId}`);
    
    return this.http.post<UploadPhotosResponse>(
      `${this.apiUrl}/${propertyId}/photos`, 
      formData
    );
  }

  // GET PROPERTY BY ID (FULL DETAILS) - returnează Property cu toate câmpurile
  getPropertyById(id: string): Observable<Property> {
    return this.http.get<ApiResponse<PropertyDetails>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return this.convertToProperty(response.data);
          } else {
            throw new Error(response.message || 'Property not found');
          }
        })
      );
  }

  // GET ALL PROPERTIES (LIGHTWEIGHT) - TOATE proprietățile
  getAllProperties(): Observable<Property[]> {
    return this.http.get<ApiResponse<PropertySummary[]>>(this.apiUrl)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data.map(summary => this.convertSummaryToProperty(summary));
          } else {
            throw new Error(response.message || 'Failed to fetch properties');
          }
        })
      );
  }

  // ✅ GET ALL VERIFIED PROPERTIES (LIGHTWEIGHT) - doar proprietățile verificate
  getAllVerifiedProperties(): Observable<Property[]> {
    return this.http.get<ApiResponse<PropertySummary[]>>(this.apiUrl)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            // Filtrează doar proprietățile verificate
            const verifiedProperties = response.data
              .filter(summary => summary.isVerified)
              .map(summary => this.convertSummaryToProperty(summary));
            
            console.log(`✅ Retrieved ${verifiedProperties.length} verified properties`);
            return verifiedProperties;
          } else {
            throw new Error(response.message || 'Failed to fetch verified properties');
          }
        })
      );
  }

  // GET PROPERTIES BY USER ID (LIGHTWEIGHT)
  getPropertiesByUserId(userId: string | undefined): Observable<Property[]> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    return this.http.get<ApiResponse<PropertySummary[]>>(`${this.apiUrl}/user/${userId}`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data.map(summary => this.convertSummaryToProperty(summary));
          } else {
            throw new Error(response.message || 'Failed to fetch user properties');
          }
        })
      );
  }

  // GET USER VERIFIED PROPERTIES
  getUserVerifiedProperties(userId: string): Observable<Property[]> {
    return this.http.get<ApiResponse<PropertySummary[]>>(`${this.apiUrl}/user/${userId}/verified`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data.map(summary => this.convertSummaryToProperty(summary));
          } else {
            throw new Error(response.message || 'Failed to fetch user verified properties');
          }
        })
      );
  }

  // GET USER UNVERIFIED PROPERTIES
  getUserUnverifiedProperties(userId: string): Observable<Property[]> {
    return this.http.get<ApiResponse<PropertySummary[]>>(`${this.apiUrl}/user/${userId}/unverified`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data.map(summary => this.convertSummaryToProperty(summary));
          } else {
            throw new Error(response.message || 'Failed to fetch user unverified properties');
          }
        })
      );
  }

  // UPDATE PROPERTY
  updateProperty(id: string, propertyData: Partial<Property>): Observable<Property> {
    const backendData = {
      ...propertyData,
      locationType: propertyData.propertyType
    };
    
    return this.http.put<ApiResponse<PropertyDetails>>(`${this.apiUrl}/${id}`, backendData)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return this.convertToProperty(response.data);
          } else {
            throw new Error(response.message || 'Failed to update property');
          }
        })
      );
  }

  // DELETE PROPERTY
  deleteProperty(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to delete property');
          }
        })
      );
  }

  // SET COVER PHOTO
  setCoverPhoto(propertyId: string, photoId: string): Observable<void> {
    return this.http.patch<ApiResponse<void>>(
      `${this.apiUrl}/${propertyId}/photos/${photoId}/cover`, 
      {}
    ).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Failed to set cover photo');
        }
      })
    );
  }
}
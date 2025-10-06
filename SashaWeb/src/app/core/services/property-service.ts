import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// ✅ Noile interfețe optimizate
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
}

export interface PropertyImage {
  id: string;
  url: string;
  isCover: boolean;
  createdAt: string;
}

// ⚠️ Păstrăm și interfețele vechi pentru compatibilitate
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

  // Helper method to convert PropertyResponse to Property (pentru compatibilitate)
  private convertToProperty(response: any): Property {
    return {
      ...response,
      propertyType: response.locationType,
      bedrooms: 0,
      images: response.images?.map((img: any) => img.url) || [],
      amenities: response.tags || [],
      activities: []
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
      updatedAt: summary.createdAt
    };
  }

  // CREATE PROPERTY
  createProperty(propertyData: CreatePropertyRequest): Observable<Property> {
    console.log('📦 Creating property with data:', propertyData);
    
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<ApiResponse<any>>(this.apiUrl, propertyData, { headers })
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

  // GET PROPERTY BY ID (FULL DETAILS)
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

  // GET ALL PROPERTIES (LIGHTWEIGHT)
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

  // SEARCH PROPERTIES
  searchProperties(filters: {
    city?: string;
    country?: string;
    minPrice?: number;
    maxPrice?: number;
    minGuests?: number;
    minBedrooms?: number;
    propertyType?: string;
  }): Observable<Property[]> {
    let params = new HttpParams();
    
    if (filters.city) params = params.set('city', filters.city);
    if (filters.country) params = params.set('country', filters.country);
    if (filters.minPrice) params = params.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params = params.set('maxPrice', filters.maxPrice.toString());
    if (filters.minGuests) params = params.set('minGuests', filters.minGuests.toString());
    if (filters.minBedrooms) params = params.set('minBedrooms', filters.minBedrooms.toString());
    if (filters.propertyType) params = params.set('propertyType', filters.propertyType);

    return this.http.get<ApiResponse<PropertySummary[]>>(`${this.apiUrl}/search`, { params })
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data.map(summary => this.convertSummaryToProperty(summary));
          } else {
            throw new Error(response.message || 'Failed to search properties');
          }
        })
      );
  }

  // GET FEATURED PROPERTIES
  getFeaturedProperties(): Observable<Property[]> {
    return this.http.get<ApiResponse<PropertySummary[]>>(`${this.apiUrl}/featured`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data.map(summary => this.convertSummaryToProperty(summary));
          } else {
            throw new Error(response.message || 'Failed to fetch featured properties');
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
    
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${id}`, backendData)
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
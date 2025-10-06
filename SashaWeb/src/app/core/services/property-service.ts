import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse, CreatePropertyRequest, Property, PropertyResponse, UploadPhotosResponse } from '../interfaces/propertyResponse';

@Injectable({
  providedIn: 'root'
})
export class PropertyService {
  private apiUrl = 'http://localhost:5043/properties';
  private http = inject(HttpClient);

  // Helper method to convert PropertyResponse to Property
  private convertToProperty(response: PropertyResponse): Property {
    return {
      ...response,
      propertyType: response.locationType,
      bedrooms: 0,
      images: [],
      amenities: response.tags || [],
      activities: []
    };
  }

  // CREATE PROPERTY
  createProperty(propertyData: CreatePropertyRequest): Observable<Property> {
    console.log('📦 Creating property with data:', propertyData);
    
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<ApiResponse<PropertyResponse>>(this.apiUrl, propertyData, { headers })
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

  // GET PROPERTY BY ID
  getPropertyById(id: string): Observable<Property> {
    return this.http.get<ApiResponse<PropertyResponse>>(`${this.apiUrl}/${id}`)
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

  // GET ALL PROPERTIES
  getAllProperties(): Observable<Property[]> {
    return this.http.get<ApiResponse<PropertyResponse[]>>(this.apiUrl)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data.map(propertyResponse => this.convertToProperty(propertyResponse));
          } else {
            throw new Error(response.message || 'Failed to fetch properties');
          }
        })
      );
  }

  // GET PROPERTIES BY USER ID
  getPropertiesByUserId(userId: string): Observable<Property[]> {
    return this.http.get<ApiResponse<PropertyResponse[]>>(`${this.apiUrl}/user/${userId}`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data.map(propertyResponse => this.convertToProperty(propertyResponse));
          } else {
            throw new Error(response.message || 'Failed to fetch user properties');
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

    return this.http.get<ApiResponse<PropertyResponse[]>>(`${this.apiUrl}/search`, { params })
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data.map(propertyResponse => this.convertToProperty(propertyResponse));
          } else {
            throw new Error(response.message || 'Failed to search properties');
          }
        })
      );
  }

  // GET FEATURED PROPERTIES
  getFeaturedProperties(): Observable<Property[]> {
    return this.http.get<ApiResponse<PropertyResponse[]>>(`${this.apiUrl}/featured`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data.map(propertyResponse => this.convertToProperty(propertyResponse));
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
    
    return this.http.put<ApiResponse<PropertyResponse>>(`${this.apiUrl}/${id}`, backendData)
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
}
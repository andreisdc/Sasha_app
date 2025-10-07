import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { SERVER } from '../../const/constants';
import { PendingApprove, RejectRequest } from '../interfaces/pendingApproveInterface';
import { ApiResponse } from './property-service';

export interface UnverifiedProperty {
  id: string;
  ownerId: string;
  ownerName: string;
  title: string;
  description?: string;
  locationType: string;
  address: string;
  city: string;
  county?: string;
  country: string;
  pricePerNight: number;
  maxGuests: number;
  bathrooms: number;
  isVerified: boolean;
  status: string;
  createdAt: string;
  averageRating?: number;
  reviewCount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PendingApproveService {
  private baseUrl = SERVER.BASE_URL + SERVER.PENDING_APPROVE_PATH;
  private baseUrlProperties = SERVER.BASE_URL + SERVER.PENDING_APPROVE_PATH_PROPERTIES;
  private propertiesBaseUrl = SERVER.BASE_URL + '/Properties'; // URL pentru proprietăți

  constructor(private http: HttpClient) {
    console.log('📋 PendingApproveService initializat - URL:', this.baseUrl);
    console.log('🏠 Properties Service URL:', this.propertiesBaseUrl);
  }

  // ================================
  // 🔹 METODE PENTRU VERIFICĂRI UTILIZATORI (SELLERS)
  // ================================

  // GET: Toate cererile de aprobare
  getAllPendingApprovals(): Observable<PendingApprove[]> {
    console.log('📥 getAllPendingApprovals - Preiau toate cererile în așteptare');
    return this.http.get<PendingApprove[]>(`${this.baseUrl}/pending`, {
      withCredentials: true
    });
  }

  // GET: Pozele unei proprietăți
  getPropertyPhotos(propertyId: string): Observable<string[]> {
    return this.http.get<ApiResponse<string[]>>(`${this.propertiesBaseUrl}/${propertyId}/photos`)
      .pipe(
        map(response => response.data || []),
        catchError(error => {
          console.error('Error fetching property photos:', error);
          return of([]);
        })
      );
  }

  // GET: Istoric aprobări / respingeri
  getApprovalHistory(): Observable<PendingApprove[]> {
    console.log('📚 getApprovalHistory - Preiau istoricul aprobărilor');
    return this.http.get<PendingApprove[]>(`${this.baseUrl}/history`, {
      withCredentials: true
    });
  }

  // POST: Crează o cerere nouă
  createPendingApprove(formData: FormData): Observable<PendingApprove> {
    console.log('🆕 createPendingApprove - Creare cerere nouă');
    return this.http.post<PendingApprove>(`${this.baseUrl}/create`, formData, {
      withCredentials: true
    });
  }

  // METODĂ NOUĂ - Obține poza ca Blob
  getPhoto(id: string): Observable<Blob> {
    console.log('🖼️ getPhoto - Descarcă foto pentru ID:', id);
    return this.http.get(`${this.baseUrlProperties}/${id}/photo`, {
      responseType: 'blob',
      withCredentials: true
    });
  }

  // PUT: Aprobă o cerere
  approvePendingApprove(id: string): Observable<PendingApprove> {
    console.log('✅ approvePendingApprove - Aprob cererea ID:', id);
    return this.http.put<PendingApprove>(
      `${this.baseUrl}/${id}/approve`,
      {},
      {
        withCredentials: true
      }
    );
  }

  // PUT: Respinge o cerere
  rejectPendingApprove(id: string, reason: string): Observable<PendingApprove> {
    console.log('❌ rejectPendingApprove - Resping cererea ID:', id, 'Motiv:', reason);
    const payload: RejectRequest = {
      reason: reason
    };
    
    return this.http.put<PendingApprove>(
      `${this.baseUrl}/${id}/reject`,
      payload, 
      {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true
      }
    );
  }

  // DELETE: Șterge o cerere
  deletePendingApprove(request: PendingApprove): Observable<any> {
    console.log('🗑️ deletePendingApprove - Șterg cererea ID:', request.id);
    return this.http.request('delete', `${this.baseUrl}`, {
      body: request,
      withCredentials: true
    });
  }

  // ================================
  // 🏠 METODE PENTRU PROPRIETĂȚI NEVERIFICATE (ADMIN)
  // ================================

  // GET: Toate proprietățile neverificate - CORECTAT
  getAllUnverifiedProperties(): Observable<UnverifiedProperty[]> {
    console.log('🏠 getAllUnverifiedProperties - Preiau toate proprietățile neverificate');
    return this.http.get<ApiResponse<UnverifiedProperty[]>>(`${this.propertiesBaseUrl}/admin/unverified`, {
      withCredentials: true
    }).pipe(
      map(response => {
        console.log('📦 Raw API response:', response);
        
        if (response && response.success) {
          console.log('✅ Successfully extracted properties:', response.data?.length || 0);
          return response.data || [];
        } else {
          console.warn('⚠️ API response indicates failure:', response);
          return [];
        }
      }),
      catchError(error => {
        console.error('❌ Error in getAllUnverifiedProperties:', error);
        return throwError(() => new Error(error.message || 'Failed to load unverified properties'));
      })
    );
  }

  // PATCH: Verifică o proprietate
  verifyProperty(propertyId: string): Observable<any> {
    console.log('✅ verifyProperty - Verific proprietatea ID:', propertyId);
    return this.http.patch<any>(
      `${this.propertiesBaseUrl}/${propertyId}/verify`,
      {},
      {
        withCredentials: true
      }
    );
  }

  // DELETE: Șterge o proprietate
  deleteProperty(propertyId: string): Observable<any> {
    console.log('🗑️ deleteProperty - Șterg proprietatea ID:', propertyId);
    return this.http.delete<any>(
      `${this.propertiesBaseUrl}/${propertyId}`,
      {
        withCredentials: true
      }
    );
  }

  // GET: Proprietățile unui utilizator (pentru context suplimentar)
  getUserProperties(userId: string): Observable<UnverifiedProperty[]> {
    console.log('👤 getUserProperties - Preiau proprietățile pentru user ID:', userId);
    return this.http.get<UnverifiedProperty[]>(`${this.propertiesBaseUrl}/user/${userId}`, {
      withCredentials: true
    });
  }

  // GET: Proprietățile verificate ale unui utilizator
  getUserVerifiedProperties(userId: string): Observable<UnverifiedProperty[]> {
    console.log('✅ getUserVerifiedProperties - Preiau proprietățile verificate pentru user ID:', userId);
    return this.http.get<UnverifiedProperty[]>(`${this.propertiesBaseUrl}/user/${userId}/verified`, {
      withCredentials: true
    });
  }

  // GET: Proprietățile neverificate ale unui utilizator
  getUserUnverifiedProperties(userId: string): Observable<UnverifiedProperty[]> {
    console.log('⏳ getUserUnverifiedProperties - Preiau proprietățile neverificate pentru user ID:', userId);
    return this.http.get<UnverifiedProperty[]>(`${this.propertiesBaseUrl}/user/${userId}/unverified`, {
      withCredentials: true
    });
  }
}
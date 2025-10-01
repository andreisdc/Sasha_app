import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SERVER } from '../../const/constants';
import { PendingApprove, RejectRequest } from '../interfaces/pendingApproveInterface';

@Injectable({
  providedIn: 'root'
})
export class PendingApproveService {
  private baseUrl = SERVER.BASE_URL + SERVER.PENDING_APPROVE_PATH;

  constructor(private http: HttpClient) {
    console.log('📋 PendingApproveService initializat - URL:', this.baseUrl);
  }

  // 🔹 GET: Toate cererile de aprobare
  getAllPendingApprovals(): Observable<PendingApprove[]> {
    console.log('📥 getAllPendingApprovals - Preiau toate cererile în așteptare');
    return this.http.get<PendingApprove[]>(`${this.baseUrl}/pending`, {
      withCredentials: true
    });
  }

  // 🔹 GET: Istoric aprobări / respingeri
  getApprovalHistory(): Observable<PendingApprove[]> {
    console.log('📚 getApprovalHistory - Preiau istoricul aprobărilor');
    return this.http.get<PendingApprove[]>(`${this.baseUrl}/history`, {
      withCredentials: true
    });
  }

  // 🔹 POST: Crează o cerere nouă
  createPendingApprove(formData: FormData): Observable<PendingApprove> {
    console.log('🆕 createPendingApprove - Creare cerere nouă');
    return this.http.post<PendingApprove>(`${this.baseUrl}/create`, formData, {
      withCredentials: true
    });
  }

  // ✅ METODĂ NOUĂ - Obține poza ca Blob
  getPhoto(id: string): Observable<Blob> {
    console.log('🖼️ getPhoto - Descarcă foto pentru ID:', id);
    return this.http.get(`${this.baseUrl}/${id}/photo`, {
      responseType: 'blob',
      withCredentials: true
    });
  }

  // 🔹 PUT: Aprobă o cerere (trimite obiectul întreg)
  approvePendingApprove(request: PendingApprove): Observable<PendingApprove> {
    console.log('✅ approvePendingApprove - Aprob cererea ID:', request.id, 'pentru:', request.firstName);
    return this.http.put<PendingApprove>(`${this.baseUrl}/approve`, request, {
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true
    });
  }

  // 🔹 PUT: Respinge o cerere (trimite obiectul + motivul)
  rejectPendingApprove(id: string, reason: string): Observable<PendingApprove> {
    console.log('❌ rejectPendingApprove - Resping cererea ID:', id, 'Motiv:', reason);
    const payload: RejectRequest = {
      reason: reason
    };
    
    return this.http.put<PendingApprove>(
      `${this.baseUrl}/${id}/reject`,  // ✅ Adaugă ID-ul în URL
      payload, 
      {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true
      }
    );
  }

  // 🔹 DELETE: Șterge o cerere (în backend poți să o ștergi după 30 zile)
  deletePendingApprove(request: PendingApprove): Observable<any> {
    console.log('🗑️ deletePendingApprove - Șterg cererea ID:', request.id);
    return this.http.request('delete', `${this.baseUrl}`, {
      body: request,
      withCredentials: true
    });
  }
}
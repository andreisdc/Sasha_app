import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SERVER } from '../../const/constants';
import { PendingApprove } from '../interfaces/pendingApproveInterface';

@Injectable({
  providedIn: 'root'
})
export class PendingApproveService {
  private baseUrl = SERVER.BASE_URL + SERVER.PENDING_APPROVE_PATH;

  constructor(private http: HttpClient) {}

  // GET: Toate cererile de aprobare
  getAllPendingApprovals(): Observable<PendingApprove[]> {
    return this.http.get<PendingApprove[]>(this.baseUrl, { withCredentials: true });
  }

  // GET: Cerere specifică după ID
  getPendingApproveById(id: string): Observable<PendingApprove> {
    return this.http.get<PendingApprove>(`${this.baseUrl}/${id}`, { withCredentials: true });
  }

  // POST: Crează o cerere nouă
  createPendingApprove(formData: FormData): Observable<any> {
    return this.http.post<any>(this.baseUrl + "/create", formData, {
      withCredentials: true
    });
  }


  // PUT: Actualizează o cerere existentă
  updatePendingApprove(id: string, pendingApprove: PendingApprove): Observable<PendingApprove> {
    return this.http.put<PendingApprove>(`${this.baseUrl}/${id}`, pendingApprove, { 
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true 
    });
  }

  // DELETE: Șterge o cerere
  deletePendingApprove(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`, { withCredentials: true });
  }

  // PUT: Aprobă o cerere
  approvePendingApprove(id: string): Observable<PendingApprove> {
    return this.http.put<PendingApprove>(`${this.baseUrl}/${id}/approve`, {}, { 
      withCredentials: true 
    });
  }

  // PUT: Respinge o cerere cu motiv
  rejectPendingApprove(id: string, reason: string): Observable<PendingApprove> {
    return this.http.put<PendingApprove>(`${this.baseUrl}/${id}/reject`, { reason }, { 
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true 
    });
  }
}
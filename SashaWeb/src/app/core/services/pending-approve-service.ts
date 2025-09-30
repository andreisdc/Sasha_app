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

  constructor(private http: HttpClient) {}

  // 🔹 GET: Toate cererile de aprobare
  getAllPendingApprovals(): Observable<PendingApprove[]> {
    return this.http.get<PendingApprove[]>(`${this.baseUrl}/pending`, {
      withCredentials: true
    });
  }

  // 🔹 GET: Istoric aprobări / respingeri
  getApprovalHistory(): Observable<PendingApprove[]> {
    return this.http.get<PendingApprove[]>(`${this.baseUrl}/history`, {
      withCredentials: true
    });
  }

  // 🔹 POST: Crează o cerere nouă
  createPendingApprove(formData: FormData): Observable<PendingApprove> {
    return this.http.post<PendingApprove>(`${this.baseUrl}/create`, formData, {
      withCredentials: true
    });
  }

  // 🔹 PUT: Aprobă o cerere (trimite obiectul întreg)
  approvePendingApprove(request: PendingApprove): Observable<PendingApprove> {
    return this.http.put<PendingApprove>(`${this.baseUrl}/approve`, request, {
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true
    });
  }

  // 🔹 PUT: Respinge o cerere (trimite obiectul + motivul)
  rejectPendingApprove(request: PendingApprove, reason: string): Observable<PendingApprove> {
    const payload: RejectRequest & PendingApprove = {
      ...request,
      reason
    };
    return this.http.put<PendingApprove>(`${this.baseUrl}/reject`, payload, {
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true
    });
  }

  // 🔹 DELETE: Șterge o cerere (în backend poți să o ștergi după 30 zile)
  deletePendingApprove(request: PendingApprove): Observable<any> {
    return this.http.request('delete', `${this.baseUrl}`, {
      body: request,
      withCredentials: true
    });
  }
}

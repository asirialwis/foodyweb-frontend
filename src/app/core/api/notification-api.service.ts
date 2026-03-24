import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Notification } from '../models/types';

@Injectable({ providedIn: 'root' })
export class NotificationApiService {
  private readonly apiUrl = '/api/notifications';

  constructor(private readonly http: HttpClient) {}

  getMyNotifications(filters?: {
    isRead?: boolean;
    type?: string;
    page?: number;
    limit?: number;
  }): Observable<Notification[] | { notifications: Notification[]; total: number }> {
    let params = new HttpParams();
    if (filters?.isRead !== undefined) {
      params = params.set('isRead', String(filters.isRead));
    }
    if (filters?.type) {
      params = params.set('type', filters.type);
    }
    if (filters?.page) {
      params = params.set('page', String(filters.page));
    }
    if (filters?.limit) {
      params = params.set('limit', String(filters.limit));
    }
    return this.http.get<Notification[] | { notifications: Notification[]; total: number }>(
      this.apiUrl,
      { params }
    );
  }

  getUnreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/unread-count`);
  }

  markAsRead(id: string): Observable<Notification> {
    return this.http.patch<Notification>(`${this.apiUrl}/${id}/read`, {});
  }

  markAllAsRead(): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.apiUrl}/read-all`, {});
  }

  deleteNotification(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  deleteAllNotifications(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/delete-all`);
  }

  sendNotification(payload: Notification): Observable<Notification> {
    return this.http.post<Notification>(this.apiUrl, payload);
  }
}

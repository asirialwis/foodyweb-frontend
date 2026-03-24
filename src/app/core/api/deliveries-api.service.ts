import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../config/api-endpoints';
import { Delivery, DeliveryStatus, GeoLocation, Rating } from '../models/types';

@Injectable({ providedIn: 'root' })
export class DeliveriesApiService {
  constructor(private readonly http: HttpClient) {}

  create(payload: Delivery): Observable<Delivery> {
    return this.http.post<Delivery>(API_ENDPOINTS.deliveries, payload);
  }

  findAll(filters?: {
    status?: DeliveryStatus;
    driverId?: string;
    page?: number;
    limit?: number;
    sortBy?: 'newest' | 'status' | 'estimatedTime';
  }): Observable<Delivery[] | { deliveries: Delivery[]; total: number }> {
    let params = new HttpParams();
    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    if (filters?.driverId) {
      params = params.set('driverId', filters.driverId);
    }
    if (filters?.page) {
      params = params.set('page', String(filters.page));
    }
    if (filters?.limit) {
      params = params.set('limit', String(filters.limit));
    }
    if (filters?.sortBy) {
      params = params.set('sortBy', filters.sortBy);
    }

    return this.http.get<Delivery[] | { deliveries: Delivery[]; total: number }>(
      API_ENDPOINTS.deliveries,
      { params }
    );
  }

  findById(id: string): Observable<Delivery> {
    return this.http.get<Delivery>(`${API_ENDPOINTS.deliveries}/${id}`);
  }

  findByOrderId(orderId: string): Observable<Delivery> {
    return this.http.get<Delivery>(`${API_ENDPOINTS.deliveries}/order/${orderId}`);
  }

  findByDriverId(driverId: string, filters?: {
    status?: DeliveryStatus;
    page?: number;
    limit?: number;
  }): Observable<Delivery[]> {
    let params = new HttpParams().set('driverId', driverId);
    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    if (filters?.page) {
      params = params.set('page', String(filters.page));
    }
    if (filters?.limit) {
      params = params.set('limit', String(filters.limit));
    }
    return this.http.get<Delivery[]>(`${API_ENDPOINTS.deliveries}`, { params });
  }

  getMyDeliveries(filters?: {
    status?: DeliveryStatus;
    page?: number;
    limit?: number;
  }): Observable<Delivery[]> {
    let params = new HttpParams();
    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    if (filters?.page) {
      params = params.set('page', String(filters.page));
    }
    if (filters?.limit) {
      params = params.set('limit', String(filters.limit));
    }
    return this.http.get<Delivery[]>(`${API_ENDPOINTS.deliveries}/my-deliveries`, { params });
  }

  updateStatus(id: string, status: DeliveryStatus): Observable<Delivery> {
    return this.http.patch<Delivery>(`${API_ENDPOINTS.deliveries}/${id}/status`, {
      status,
    });
  }

  assignDriver(id: string, driverId: string): Observable<Delivery> {
    return this.http.patch<Delivery>(`${API_ENDPOINTS.deliveries}/${id}/assign-driver`, {
      driverId,
    });
  }

  updateLocation(id: string, location: GeoLocation): Observable<Delivery> {
    return this.http.patch<Delivery>(`${API_ENDPOINTS.deliveries}/${id}/location`, location);
  }

  getTracking(deliveryId: string): Observable<any> {
    return this.http.get<any>(`${API_ENDPOINTS.deliveries}/${deliveryId}/tracking`);
  }

  getDeliveryHistory(filters?: {
    startDate?: string;
    endDate?: string;
    driverId?: string;
    status?: DeliveryStatus;
  }): Observable<any> {
    let params = new HttpParams();
    if (filters?.startDate) {
      params = params.set('startDate', filters.startDate);
    }
    if (filters?.endDate) {
      params = params.set('endDate', filters.endDate);
    }
    if (filters?.driverId) {
      params = params.set('driverId', filters.driverId);
    }
    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    return this.http.get<any>(`${API_ENDPOINTS.deliveries}/history`, { params });
  }

  // Rating
  rateDelivery(deliveryId: string, rating: Rating): Observable<Rating> {
    return this.http.post<Rating>(`${API_ENDPOINTS.deliveries}/${deliveryId}/rate`, rating);
  }

  getDeliveryRating(deliveryId: string): Observable<Rating> {
    return this.http.get<Rating>(`${API_ENDPOINTS.deliveries}/${deliveryId}/rating`);
  }
}

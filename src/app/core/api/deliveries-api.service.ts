import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../config/api-endpoints';
import { Delivery, DeliveryStatus, GeoLocation } from '../models/types';

@Injectable({ providedIn: 'root' })
export class DeliveriesApiService {
  constructor(private readonly http: HttpClient) {}

  create(payload: Delivery): Observable<Delivery> {
    return this.http.post<Delivery>(API_ENDPOINTS.deliveries, payload);
  }

  /** Backend returns plain array */
  findAll(filters?: {
    status?: DeliveryStatus;
    driverId?: string;
  }): Observable<Delivery[]> {
    let params = new HttpParams();
    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    if (filters?.driverId) {
      params = params.set('driverId', filters.driverId);
    }

    return this.http.get<Delivery[]>(API_ENDPOINTS.deliveries, { params });
  }

  findById(id: string): Observable<Delivery> {
    return this.http.get<Delivery>(`${API_ENDPOINTS.deliveries}/${id}`);
  }

  /** Backend: GET /deliveries/order/:orderId */
  findByOrderId(orderId: string): Observable<Delivery> {
    return this.http.get<Delivery>(`${API_ENDPOINTS.deliveries}/order/${orderId}`);
  }

  /** Backend: GET /deliveries/driver/:driverId */
  findByDriverId(driverId: string): Observable<Delivery[]> {
    return this.http.get<Delivery[]>(
      `${API_ENDPOINTS.deliveries}/driver/${driverId}`,
    );
  }

  updateStatus(id: string, status: DeliveryStatus): Observable<Delivery> {
    return this.http.patch<Delivery>(`${API_ENDPOINTS.deliveries}/${id}/status`, {
      status,
    });
  }

  /** Backend: PATCH /deliveries/:id/assign (NOT assign-driver) */
  assignDriver(id: string, driverId: string): Observable<Delivery> {
    return this.http.patch<Delivery>(`${API_ENDPOINTS.deliveries}/${id}/assign`, {
      driverId,
    });
  }

  updateLocation(id: string, location: GeoLocation): Observable<Delivery> {
    return this.http.patch<Delivery>(`${API_ENDPOINTS.deliveries}/${id}/location`, location);
  }
}

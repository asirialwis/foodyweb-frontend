import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../config/api-endpoints';
import { Driver, GeoLocation, VehicleType, Rating } from '../models/types';

@Injectable({ providedIn: 'root' })
export class DriversApiService {
  constructor(private readonly http: HttpClient) {}

  create(payload: Driver): Observable<Driver> {
    return this.http.post<Driver>(API_ENDPOINTS.drivers, payload);
  }

  findAll(filters?: {
    isAvailable?: boolean;
    vehicleType?: VehicleType;
    page?: number;
    limit?: number;
    sortBy?: 'rating' | 'deliveries' | 'newest';
  }): Observable<Driver[] | { drivers: Driver[]; total: number }> {
    let params = new HttpParams();
    if (filters?.isAvailable !== undefined) {
      params = params.set('isAvailable', String(filters.isAvailable));
    }
    if (filters?.vehicleType) {
      params = params.set('vehicleType', filters.vehicleType);
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

    return this.http.get<Driver[] | { drivers: Driver[]; total: number }>(
      API_ENDPOINTS.drivers,
      { params }
    );
  }

  findAvailable(filters?: {
    vehicleType?: VehicleType;
    latitude?: number;
    longitude?: number;
    radius?: number;
  }): Observable<Driver[]> {
    let params = new HttpParams();
    if (filters?.vehicleType) {
      params = params.set('vehicleType', filters.vehicleType);
    }
    if (filters?.latitude) {
      params = params.set('latitude', filters.latitude.toString());
    }
    if (filters?.longitude) {
      params = params.set('longitude', filters.longitude.toString());
    }
    if (filters?.radius) {
      params = params.set('radius', filters.radius.toString());
    }

    return this.http.get<Driver[]>(`${API_ENDPOINTS.drivers}/available`, { params });
  }

  findById(id: string): Observable<Driver> {
    return this.http.get<Driver>(`${API_ENDPOINTS.drivers}/${id}`);
  }

  getProfile(): Observable<Driver> {
    return this.http.get<Driver>(`${API_ENDPOINTS.drivers}/profile`);
  }

  update(id: string, payload: Partial<Driver>): Observable<Driver> {
    return this.http.patch<Driver>(`${API_ENDPOINTS.drivers}/${id}`, payload);
  }

  updateProfile(payload: Partial<Driver>): Observable<Driver> {
    return this.http.patch<Driver>(`${API_ENDPOINTS.drivers}/profile`, payload);
  }

  updateLocation(id: string, location: GeoLocation): Observable<Driver> {
    return this.http.patch<Driver>(`${API_ENDPOINTS.drivers}/${id}/location`, location);
  }

  updateAvailability(id: string, isAvailable: boolean): Observable<Driver> {
    return this.http.patch<Driver>(`${API_ENDPOINTS.drivers}/${id}/availability`, {
      isAvailable,
    });
  }

  toggleAvailability(isAvailable: boolean): Observable<Driver> {
    return this.http.patch<Driver>(`${API_ENDPOINTS.drivers}/availability`, {
      isAvailable,
    });
  }

  getEarnings(filters?: {
    startDate?: string;
    endDate?: string;
  }): Observable<any> {
    let params = new HttpParams();
    if (filters?.startDate) {
      params = params.set('startDate', filters.startDate);
    }
    if (filters?.endDate) {
      params = params.set('endDate', filters.endDate);
    }
    return this.http.get<any>(`${API_ENDPOINTS.drivers}/earnings`, { params });
  }

  getDeliveryStats(): Observable<any> {
    return this.http.get<any>(`${API_ENDPOINTS.drivers}/delivery-stats`);
  }

  // Rating
  rateDriver(driverId: string, rating: Rating): Observable<Rating> {
    return this.http.post<Rating>(`${API_ENDPOINTS.drivers}/${driverId}/rate`, rating);
  }

  getDriverRating(driverId: string): Observable<Rating> {
    return this.http.get<Rating>(`${API_ENDPOINTS.drivers}/${driverId}/rating`);
  }

  remove(id: string): Observable<{ message?: string }> {
    return this.http.delete<{ message?: string }>(`${API_ENDPOINTS.drivers}/${id}`);
  }
}

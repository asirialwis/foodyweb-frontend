import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../config/api-endpoints';
import { Driver, GeoLocation, VehicleType } from '../models/types';

@Injectable({ providedIn: 'root' })
export class DriversApiService {
  constructor(private readonly http: HttpClient) {}

  create(payload: Driver): Observable<Driver> {
    return this.http.post<Driver>(API_ENDPOINTS.drivers, payload);
  }

  findAll(filters?: {
    isAvailable?: boolean;
    vehicleType?: VehicleType;
  }): Observable<Driver[]> {
    let params = new HttpParams();
    if (filters?.isAvailable !== undefined) {
      params = params.set('isAvailable', String(filters.isAvailable));
    }
    if (filters?.vehicleType) {
      params = params.set('vehicleType', filters.vehicleType);
    }

    return this.http.get<Driver[]>(API_ENDPOINTS.drivers, { params });
  }

  findAvailable(): Observable<Driver[]> {
    return this.http.get<Driver[]>(`${API_ENDPOINTS.drivers}/available`);
  }

  findById(id: string): Observable<Driver> {
    return this.http.get<Driver>(`${API_ENDPOINTS.drivers}/${id}`);
  }

  update(id: string, payload: Partial<Driver>): Observable<Driver> {
    return this.http.patch<Driver>(`${API_ENDPOINTS.drivers}/${id}`, payload);
  }

  updateLocation(id: string, location: GeoLocation): Observable<Driver> {
    return this.http.patch<Driver>(`${API_ENDPOINTS.drivers}/${id}/location`, location);
  }

  updateAvailability(id: string, isAvailable: boolean): Observable<Driver> {
    return this.http.patch<Driver>(`${API_ENDPOINTS.drivers}/${id}/availability`, {
      isAvailable,
    });
  }

  remove(id: string): Observable<{ message?: string }> {
    return this.http.delete<{ message?: string }>(`${API_ENDPOINTS.drivers}/${id}`);
  }
}

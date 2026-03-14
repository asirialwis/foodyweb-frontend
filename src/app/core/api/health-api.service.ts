import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { API_ENDPOINTS } from '../config/api-endpoints';
import { HealthStatus } from '../models/types';

@Injectable({ providedIn: 'root' })
export class HealthApiService {
  constructor(private readonly http: HttpClient) {}

  user(): Observable<HealthStatus> {
    return this.http.get<HealthStatus>(API_ENDPOINTS.healthUser);
  }

  restaurant(): Observable<HealthStatus> {
    return this.http.get<HealthStatus>(API_ENDPOINTS.healthRestaurant);
  }

  order(): Observable<HealthStatus> {
    return this.http.get<HealthStatus>(API_ENDPOINTS.healthOrder);
  }

  delivery(): Observable<HealthStatus> {
    return this.http.get<HealthStatus>(API_ENDPOINTS.healthDelivery);
  }

  all(): Observable<{
    user: HealthStatus;
    restaurant: HealthStatus;
    order: HealthStatus;
    delivery: HealthStatus;
  }> {
    return forkJoin({
      user: this.user(),
      restaurant: this.restaurant(),
      order: this.order(),
      delivery: this.delivery(),
    });
  }
}

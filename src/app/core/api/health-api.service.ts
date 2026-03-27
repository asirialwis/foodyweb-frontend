import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { API_ENDPOINTS } from '../config/api-endpoints';

export interface HealthStatus {
  status: string;
  service: string;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class HealthApiService {
  constructor(private readonly http: HttpClient) {}

  /** GET /health on user-service */
  checkUserService(): Observable<HealthStatus | null> {
    return this.http.get<HealthStatus>(API_ENDPOINTS.healthUser).pipe(
      timeout(5000),
      catchError(() => of(null)),
    );
  }

  /** GET /health on restaurant-service */
  checkRestaurantService(): Observable<HealthStatus | null> {
    return this.http.get<HealthStatus>(API_ENDPOINTS.healthRestaurant).pipe(
      timeout(5000),
      catchError(() => of(null)),
    );
  }

  /** GET /health on order-service */
  checkOrderService(): Observable<HealthStatus | null> {
    return this.http.get<HealthStatus>(API_ENDPOINTS.healthOrder).pipe(
      timeout(5000),
      catchError(() => of(null)),
    );
  }

  /** GET /health on delivery-service */
  checkDeliveryService(): Observable<HealthStatus | null> {
    return this.http.get<HealthStatus>(API_ENDPOINTS.healthDelivery).pipe(
      timeout(5000),
      catchError(() => of(null)),
    );
  }
}

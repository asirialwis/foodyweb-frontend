import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_ENDPOINTS } from '../config/api-endpoints';
import { Order, OrderStatus, PaymentStatus } from '../models/types';

export interface CreateOrderPayload {
  userId: string;
  restaurantId: string;
  items: { menuItemId: string; name: string; quantity: number; price: number }[];
  totalAmount: number;
  paymentMethod: string;
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  specialInstructions?: string;
}

@Injectable({ providedIn: 'root' })
export class OrdersApiService {
  constructor(private readonly http: HttpClient) {}

  create(payload: CreateOrderPayload): Observable<Order> {
    return this.http.post<Order>(API_ENDPOINTS.orders, payload);
  }

  findAll(filters?: {
    userId?: string;
    restaurantId?: string;
    status?: OrderStatus;
    page?: number;
    limit?: number;
  }): Observable<Order[]> {
    let params = new HttpParams();

    if (filters?.userId) {
      params = params.set('userId', filters.userId);
    }
    if (filters?.restaurantId) {
      params = params.set('restaurantId', filters.restaurantId);
    }
    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    if (filters?.page) {
      params = params.set('page', String(filters.page));
    }
    if (filters?.limit) {
      params = params.set('limit', String(filters.limit));
    }

    return this.http
      .get<{ orders: Order[]; total: number }>(API_ENDPOINTS.orders, { params })
      .pipe(map((r) => r.orders ?? []));
  }

  findById(id: string): Observable<Order> {
    return this.http.get<Order>(`${API_ENDPOINTS.orders}/${id}`);
  }

  /** Backend: GET /orders/user/:userId */
  findByUserId(userId: string): Observable<Order[]> {
    return this.http.get<Order[]>(`${API_ENDPOINTS.orders}/user/${userId}`);
  }

  /** Backend: GET /orders/restaurant/:restaurantId */
  findByRestaurantId(restaurantId: string): Observable<Order[]> {
    return this.http.get<Order[]>(
      `${API_ENDPOINTS.orders}/restaurant/${restaurantId}`,
    );
  }

  updateStatus(id: string, status: OrderStatus): Observable<Order> {
    return this.http.patch<Order>(`${API_ENDPOINTS.orders}/${id}/status`, { status });
  }

  updatePaymentStatus(id: string, paymentStatus: PaymentStatus): Observable<Order> {
    return this.http.patch<Order>(`${API_ENDPOINTS.orders}/${id}/payment`, {
      paymentStatus,
    });
  }

  cancel(id: string, reason?: string): Observable<Order> {
    return this.http.post<Order>(`${API_ENDPOINTS.orders}/${id}/cancel`, {
      reason,
    });
  }
}

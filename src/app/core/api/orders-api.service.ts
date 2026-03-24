import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_ENDPOINTS } from '../config/api-endpoints';
import { Order, OrderStatus, PaymentStatus, Rating } from '../models/types';

@Injectable({ providedIn: 'root' })
export class OrdersApiService {
  constructor(private readonly http: HttpClient) {}

  create(payload: Order): Observable<Order> {
    return this.http.post<Order>(API_ENDPOINTS.orders, payload);
  }

  findAll(filters?: {
    userId?: string;
    restaurantId?: string;
    status?: OrderStatus;
    page?: number;
    limit?: number;
    sortBy?: 'newest' | 'oldest' | 'status';
  }): Observable<Order[] | { orders: Order[]; total: number }> {
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
    if (filters?.sortBy) {
      params = params.set('sortBy', filters.sortBy);
    }

    return this.http.get<Order[] | { orders: Order[]; total: number }>(
      API_ENDPOINTS.orders,
      { params }
    ).pipe(
      map((r) => (Array.isArray(r) ? r : r.orders ?? []))
    );
  }

  findById(id: string): Observable<Order> {
    return this.http.get<Order>(`${API_ENDPOINTS.orders}/${id}`);
  }

  findByUserId(userId: string, filters?: {
    status?: OrderStatus;
    page?: number;
    limit?: number;
  }): Observable<Order[]> {
    let params = new HttpParams().set('userId', userId);
    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    if (filters?.page) {
      params = params.set('page', String(filters.page));
    }
    if (filters?.limit) {
      params = params.set('limit', String(filters.limit));
    }
    return this.http.get<Order[] | { orders: Order[]; total: number }>(`${API_ENDPOINTS.orders}`, { params }).pipe(
      map((r) => (Array.isArray(r) ? r : (r as { orders: Order[] }).orders ?? []))
    );
  }

  findByRestaurantId(restaurantId: string): Observable<Order[]> {
    return this.http.get<Order[] | { orders: Order[]; total: number }>(
      `${API_ENDPOINTS.orders}`,
      { params: new HttpParams().set('restaurantId', restaurantId) }
    ).pipe(
      map((r) => (Array.isArray(r) ? r : (r as { orders: Order[] }).orders ?? []))
    );
  }

  getMyOrders(filters?: {
    status?: OrderStatus;
    page?: number;
    limit?: number;
  }): Observable<Order[]> {
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
    return this.http.get<Order[] | { orders: Order[]; total: number }>(`${API_ENDPOINTS.orders}/my-orders`, { params }).pipe(
      map((r) => (Array.isArray(r) ? r : (r as { orders: Order[] }).orders ?? []))
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

  applyCoupon(orderId: string, couponCode: string): Observable<Order> {
    return this.http.post<Order>(`${API_ENDPOINTS.orders}/${orderId}/apply-coupon`, {
      couponCode,
    });
  }

  cancel(id: string, reason?: string): Observable<Order> {
    return this.http.post<Order>(`${API_ENDPOINTS.orders}/${id}/cancel`, {
      reason,
    });
  }

  getTrackingInfo(orderId: string): Observable<any> {
    return this.http.get<any>(`${API_ENDPOINTS.orders}/${orderId}/tracking`);
  }

  getOrderSummary(filters?: {
    startDate?: string;
    endDate?: string;
    restaurantId?: string;
  }): Observable<any> {
    let params = new HttpParams();
    if (filters?.startDate) {
      params = params.set('startDate', filters.startDate);
    }
    if (filters?.endDate) {
      params = params.set('endDate', filters.endDate);
    }
    if (filters?.restaurantId) {
      params = params.set('restaurantId', filters.restaurantId);
    }
    return this.http.get<any>(`${API_ENDPOINTS.orders}/summary`, { params });
  }

  // Rating
  rateOrder(orderId: string, rating: Rating): Observable<Rating> {
    return this.http.post<Rating>(`${API_ENDPOINTS.orders}/${orderId}/rate`, rating);
  }

  getOrderRating(orderId: string): Observable<Rating> {
    return this.http.get<Rating>(`${API_ENDPOINTS.orders}/${orderId}/rating`);
  }
}

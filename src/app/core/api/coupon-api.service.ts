import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Coupon } from '../models/types';

@Injectable({ providedIn: 'root' })
export class CouponApiService {
  private readonly apiUrl = '/api/coupons';

  constructor(private readonly http: HttpClient) {}

  getAllCoupons(filters?: {
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Observable<Coupon[] | { coupons: Coupon[]; total: number }> {
    let params = new HttpParams();
    if (filters?.isActive !== undefined) {
      params = params.set('isActive', String(filters.isActive));
    }
    if (filters?.page) {
      params = params.set('page', String(filters.page));
    }
    if (filters?.limit) {
      params = params.set('limit', String(filters.limit));
    }
    return this.http.get<Coupon[] | { coupons: Coupon[]; total: number }>(this.apiUrl, { params });
  }

  validateCoupon(code: string): Observable<Coupon> {
    return this.http.post<Coupon>(`${this.apiUrl}/validate`, { code });
  }

  applyCoupon(code: string, orderId: string): Observable<{ discount: number; message: string }> {
    return this.http.post<{ discount: number; message: string }>(`${this.apiUrl}/apply`, {
      code,
      orderId,
    });
  }

  getMyCoupons(): Observable<Coupon[]> {
    return this.http.get<Coupon[]>(`${this.apiUrl}/my-coupons`);
  }

  getCouponById(id: string): Observable<Coupon> {
    return this.http.get<Coupon>(`${this.apiUrl}/${id}`);
  }

  // Admin methods
  createCoupon(payload: Coupon): Observable<Coupon> {
    return this.http.post<Coupon>(this.apiUrl, payload);
  }

  updateCoupon(id: string, payload: Partial<Coupon>): Observable<Coupon> {
    return this.http.patch<Coupon>(`${this.apiUrl}/${id}`, payload);
  }

  deleteCoupon(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}

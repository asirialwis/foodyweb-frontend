import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../config/api-endpoints';
import { MenuItem } from '../models/types';

@Injectable({ providedIn: 'root' })
export class MenuItemsApiService {
  constructor(private readonly http: HttpClient) {}

  create(payload: MenuItem): Observable<MenuItem> {
    return this.http.post<MenuItem>(API_ENDPOINTS.menuItems, payload);
  }

  /** Backend supports optional filters: restaurantId, category, isAvailable */
  findAll(filters?: {
    restaurantId?: string;
    category?: string;
    isAvailable?: boolean;
  }): Observable<MenuItem[]> {
    let params = new HttpParams();
    if (filters?.restaurantId) {
      params = params.set('restaurantId', filters.restaurantId);
    }
    if (filters?.category) {
      params = params.set('category', filters.category);
    }
    if (filters?.isAvailable !== undefined) {
      params = params.set('isAvailable', String(filters.isAvailable));
    }

    return this.http.get<MenuItem[]>(API_ENDPOINTS.menuItems, { params });
  }

  findById(id: string): Observable<MenuItem> {
    return this.http.get<MenuItem>(`${API_ENDPOINTS.menuItems}/${id}`);
  }

  /** Backend: GET /menu-items/restaurant/:restaurantId */
  findByRestaurantId(restaurantId: string): Observable<MenuItem[]> {
    return this.http.get<MenuItem[]>(
      `${API_ENDPOINTS.menuItems}/restaurant/${restaurantId}`,
    );
  }

  update(id: string, payload: Partial<MenuItem>): Observable<MenuItem> {
    return this.http.patch<MenuItem>(`${API_ENDPOINTS.menuItems}/${id}`, payload);
  }

  remove(id: string): Observable<{ message?: string }> {
    return this.http.delete<{ message?: string }>(`${API_ENDPOINTS.menuItems}/${id}`);
  }
}

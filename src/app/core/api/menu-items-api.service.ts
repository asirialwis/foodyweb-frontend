import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../config/api-endpoints';
import { MenuItem, Rating, DietaryRestriction } from '../models/types';

@Injectable({ providedIn: 'root' })
export class MenuItemsApiService {
  constructor(private readonly http: HttpClient) {}

  create(payload: MenuItem): Observable<MenuItem> {
    return this.http.post<MenuItem>(API_ENDPOINTS.menuItems, payload);
  }

  findAll(filters?: {
    restaurantId?: string;
    category?: string;
    isAvailable?: boolean;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: 'price' | 'rating' | 'newest' | 'bestseller';
  }): Observable<MenuItem[] | { items: MenuItem[]; total: number }> {
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
    if (filters?.search) {
      params = params.set('search', filters.search);
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

    return this.http.get<MenuItem[] | { items: MenuItem[]; total: number }>(
      API_ENDPOINTS.menuItems,
      { params }
    );
  }

  search(query: string): Observable<MenuItem[]> {
    return this.http.get<MenuItem[]>(
      `${API_ENDPOINTS.menuItems}/search`,
      { params: new HttpParams().set('q', query) }
    );
  }

  findById(id: string): Observable<MenuItem> {
    return this.http.get<MenuItem>(`${API_ENDPOINTS.menuItems}/${id}`);
  }

  findByRestaurantId(restaurantId: string, filters?: {
    category?: string;
    isAvailable?: boolean;
  }): Observable<MenuItem[]> {
    let params = new HttpParams().set('restaurantId', restaurantId);
    if (filters?.category) {
      params = params.set('category', filters.category);
    }
    if (filters?.isAvailable !== undefined) {
      params = params.set('isAvailable', String(filters.isAvailable));
    }
    return this.http.get<MenuItem[]>(`${API_ENDPOINTS.menuItems}`, { params });
  }

  getCategories(restaurantId: string): Observable<string[]> {
    return this.http.get<string[]>(
      `${API_ENDPOINTS.menuItems}/categories`,
      { params: new HttpParams().set('restaurantId', restaurantId) }
    );
  }

  getByDietaryRestriction(restriction: DietaryRestriction): Observable<MenuItem[]> {
    return this.http.get<MenuItem[]>(
      `${API_ENDPOINTS.menuItems}/dietary/${restriction}`
    );
  }

  getBestsellers(restaurantId: string): Observable<MenuItem[]> {
    return this.http.get<MenuItem[]>(
      `${API_ENDPOINTS.menuItems}/bestsellers`,
      { params: new HttpParams().set('restaurantId', restaurantId) }
    );
  }

  update(id: string, payload: Partial<MenuItem>): Observable<MenuItem> {
    return this.http.patch<MenuItem>(`${API_ENDPOINTS.menuItems}/${id}`, payload);
  }

  getMenuItemRatings(menuItemId: string): Observable<Rating[]> {
    return this.http.get<Rating[]>(`${API_ENDPOINTS.menuItems}/${menuItemId}/ratings`);
  }

  remove(id: string): Observable<{ message?: string }> {
    return this.http.delete<{ message?: string }>(`${API_ENDPOINTS.menuItems}/${id}`);
  }
}

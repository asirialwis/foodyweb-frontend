import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../config/api-endpoints';
import { Restaurant } from '../models/types';

@Injectable({ providedIn: 'root' })
export class RestaurantsApiService {
  constructor(private readonly http: HttpClient) {}

  create(payload: Restaurant): Observable<Restaurant> {
    return this.http.post<Restaurant>(API_ENDPOINTS.restaurants, payload);
  }

  findAll(filters?: { cuisine?: string; isActive?: boolean }): Observable<Restaurant[]> {
    let params = new HttpParams();
    if (filters?.cuisine) {
      params = params.set('cuisine', filters.cuisine);
    }
    if (filters?.isActive !== undefined) {
      params = params.set('isActive', String(filters.isActive));
    }

    return this.http.get<Restaurant[]>(API_ENDPOINTS.restaurants, { params });
  }

  findById(id: string): Observable<Restaurant> {
    return this.http.get<Restaurant>(`${API_ENDPOINTS.restaurants}/${id}`);
  }

  update(id: string, payload: Partial<Restaurant>): Observable<Restaurant> {
    return this.http.patch<Restaurant>(`${API_ENDPOINTS.restaurants}/${id}`, payload);
  }

  remove(id: string): Observable<{ message?: string }> {
    return this.http.delete<{ message?: string }>(`${API_ENDPOINTS.restaurants}/${id}`);
  }
}

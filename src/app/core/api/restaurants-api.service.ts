import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../config/api-endpoints';
import { Restaurant, Rating, CuisineType } from '../models/types';

@Injectable({ providedIn: 'root' })
export class RestaurantsApiService {
  constructor(private readonly http: HttpClient) {}

  create(payload: Restaurant): Observable<Restaurant> {
    return this.http.post<Restaurant>(API_ENDPOINTS.restaurants, payload);
  }

  findAll(filters?: {
    cuisine?: CuisineType | string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: 'rating' | 'distance' | 'deliveryTime' | 'newest';
  }): Observable<Restaurant[] | { restaurants: Restaurant[]; total: number }> {
    let params = new HttpParams();
    if (filters?.cuisine) {
      params = params.set('cuisine', filters.cuisine);
    }
    if (filters?.isActive !== undefined) {
      params = params.set('isActive', String(filters.isActive));
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

    return this.http.get<Restaurant[] | { restaurants: Restaurant[]; total: number }>(
      API_ENDPOINTS.restaurants,
      { params }
    );
  }

  search(query: string): Observable<Restaurant[]> {
    return this.http.get<Restaurant[]>(
      `${API_ENDPOINTS.restaurants}/search`,
      { params: new HttpParams().set('q', query) }
    );
  }

  findById(id: string): Observable<Restaurant> {
    return this.http.get<Restaurant>(`${API_ENDPOINTS.restaurants}/${id}`);
  }

  findByCuisine(cuisine: CuisineType): Observable<Restaurant[]> {
    return this.http.get<Restaurant[]>(
      `${API_ENDPOINTS.restaurants}/cuisine/${cuisine}`
    );
  }

  getTopRated(): Observable<Restaurant[]> {
    return this.http.get<Restaurant[]>(`${API_ENDPOINTS.restaurants}/top-rated`);
  }

  getNearby(latitude: number, longitude: number, radius: number = 5): Observable<Restaurant[]> {
    const params = new HttpParams()
      .set('lat', latitude.toString())
      .set('lng', longitude.toString())
      .set('radius', radius.toString());
    return this.http.get<Restaurant[]>(`${API_ENDPOINTS.restaurants}/nearby`, { params });
  }

  update(id: string, payload: Partial<Restaurant>): Observable<Restaurant> {
    return this.http.patch<Restaurant>(`${API_ENDPOINTS.restaurants}/${id}`, payload);
  }

  getRestaurantRatings(restaurantId: string): Observable<Rating[]> {
    return this.http.get<Rating[]>(`${API_ENDPOINTS.restaurants}/${restaurantId}/ratings`);
  }

  remove(id: string): Observable<{ message?: string }> {
    return this.http.delete<{ message?: string }>(`${API_ENDPOINTS.restaurants}/${id}`);
  }
}

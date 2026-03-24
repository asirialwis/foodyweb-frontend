import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../config/api-endpoints';
import { User, Address, Rating } from '../models/types';

@Injectable({ providedIn: 'root' })
export class UsersApiService {
  constructor(private readonly http: HttpClient) {}

  findAll(filters?: { role?: string; isActive?: boolean }): Observable<User[]> {
    let params = new HttpParams();
    if (filters?.role) {
      params = params.set('role', filters.role);
    }
    if (filters?.isActive !== undefined) {
      params = params.set('isActive', String(filters.isActive));
    }
    return this.http.get<User[]>(API_ENDPOINTS.users, { params });
  }

  profile(): Observable<User> {
    return this.http.get<User>(`${API_ENDPOINTS.users}/profile`);
  }

  findById(id: string): Observable<User> {
    return this.http.get<User>(`${API_ENDPOINTS.users}/${id}`);
  }

  update(id: string, payload: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${API_ENDPOINTS.users}/${id}`, payload);
  }

  updateProfile(payload: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${API_ENDPOINTS.users}/profile`, payload);
  }

  // Address Management
  addAddress(address: Address): Observable<User> {
    return this.http.post<User>(`${API_ENDPOINTS.users}/addresses`, address);
  }

  getAddresses(): Observable<Address[]> {
    return this.http.get<Address[]>(`${API_ENDPOINTS.users}/addresses`);
  }

  updateAddress(index: number, address: Address): Observable<User> {
    return this.http.patch<User>(`${API_ENDPOINTS.users}/addresses/${index}`, address);
  }

  deleteAddress(index: number): Observable<User> {
    return this.http.delete<User>(`${API_ENDPOINTS.users}/addresses/${index}`);
  }

  // Rating Management
  submitRating(rating: Rating): Observable<Rating> {
    return this.http.post<Rating>(`${API_ENDPOINTS.users}/ratings`, rating);
  }

  getMyRatings(): Observable<Rating[]> {
    return this.http.get<Rating[]>(`${API_ENDPOINTS.users}/my-ratings`);
  }

  remove(id: string): Observable<{ message?: string }> {
    return this.http.delete<{ message?: string }>(`${API_ENDPOINTS.users}/${id}`);
  }
}

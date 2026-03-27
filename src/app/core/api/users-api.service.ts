import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../config/api-endpoints';
import { User } from '../models/types';

@Injectable({ providedIn: 'root' })
export class UsersApiService {
  constructor(private readonly http: HttpClient) {}

  /** GET /users — admin only */
  findAll(): Observable<User[]> {
    return this.http.get<User[]>(API_ENDPOINTS.users);
  }

  /** GET /users/profile — get own profile via JWT */
  getProfile(): Observable<User> {
    return this.http.get<User>(`${API_ENDPOINTS.users}/profile`);
  }

  /** GET /users/:id — get user by ID */
  findById(id: string): Observable<User> {
    return this.http.get<User>(`${API_ENDPOINTS.users}/${id}`);
  }

  /** PATCH /users/:id — update user */
  update(id: string, payload: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${API_ENDPOINTS.users}/${id}`, payload);
  }

  /** DELETE /users/:id — admin only */
  remove(id: string): Observable<{ message?: string }> {
    return this.http.delete<{ message?: string }>(`${API_ENDPOINTS.users}/${id}`);
  }
}

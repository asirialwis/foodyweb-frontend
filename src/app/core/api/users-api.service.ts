import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../config/api-endpoints';
import { User } from '../models/types';

@Injectable({ providedIn: 'root' })
export class UsersApiService {
  constructor(private readonly http: HttpClient) {}

  findAll(): Observable<User[]> {
    return this.http.get<User[]>(API_ENDPOINTS.users);
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

  remove(id: string): Observable<{ message?: string }> {
    return this.http.delete<{ message?: string }>(`${API_ENDPOINTS.users}/${id}`);
  }
}

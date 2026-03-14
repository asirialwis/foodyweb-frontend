import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../config/api-endpoints';
import { AuthResponse } from '../models/types';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  constructor(private readonly http: HttpClient) {}

  register(payload: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_ENDPOINTS.auth}/register`, payload);
  }

  login(payload: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_ENDPOINTS.auth}/login`, payload);
  }

  profile(): Observable<unknown> {
    return this.http.get<unknown>(`${API_ENDPOINTS.auth}/profile`);
  }
}

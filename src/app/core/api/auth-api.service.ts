import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../config/api-endpoints';
import { User, AuthResponse } from '../models/types';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  constructor(private readonly http: HttpClient) {}

  /** POST /auth/register — accepts: email, password, firstName, lastName, phone?, role?, address? */
  register(payload: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: string;
  }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_ENDPOINTS.auth}/register`, payload);
  }

  /** POST /auth/login — accepts: email, password */
  login(payload: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_ENDPOINTS.auth}/login`, payload);
  }

  /** GET /auth/profile — returns current user from JWT */
  getProfile(): Observable<User> {
    return this.http.get<User>(`${API_ENDPOINTS.auth}/profile`);
  }
}

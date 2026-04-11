import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_ENDPOINTS } from '../config/api-endpoints';
import { User } from '../models/types';

/** Handles plain arrays or wrapped bodies (same idea as orders findAll). */
function unwrapUsersResponse(raw: unknown): User[] {
  if (Array.isArray(raw)) {
    return raw.map(normalizeUserId);
  }
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    const list = o['users'] ?? o['data'] ?? o['items'];
    if (Array.isArray(list)) {
      return (list as User[]).map(normalizeUserId);
    }
  }
  return [];
}

/** MongoDB often sends only _id; PATCH/DELETE need id on the same string. */
function normalizeUserId(u: User): User {
  const id = u.id || u._id;
  if (!id) {
    return u;
  }
  return { ...u, id: String(id) };
}

@Injectable({ providedIn: 'root' })
export class UsersApiService {
  constructor(private readonly http: HttpClient) {}

  /** GET /users — admin only */
  findAll(options?: { page?: number; limit?: number }): Observable<User[]> {
    let params = new HttpParams();
    if (options?.page != null) {
      params = params.set('page', String(options.page));
    }
    if (options?.limit != null) {
      params = params.set('limit', String(options.limit));
    }

    return this.http
      .get<unknown>(API_ENDPOINTS.users, { params })
      .pipe(map(unwrapUsersResponse));
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

import { Injectable, computed, signal } from '@angular/core';
import { AuthUser, UserRole } from '../models/types';

const TOKEN_KEY = 'foodyweb_token';
const USER_KEY = 'foodyweb_user';

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly tokenSignal = signal<string | null>(
    localStorage.getItem(TOKEN_KEY),
  );

  private readonly userSignal = signal<AuthUser | null>(this.readStoredUser());

  readonly token = this.tokenSignal.asReadonly();
  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.tokenSignal());
  readonly role = computed<UserRole | null>(() => this.userSignal()?.role ?? null);

  setSession(token: string, user: AuthUser): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.tokenSignal.set(token);
    this.userSignal.set(user);
  }

  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.tokenSignal.set(null);
    this.userSignal.set(null);
  }

  private readStoredUser(): AuthUser | null {
    const rawUser = localStorage.getItem(USER_KEY);
    if (!rawUser) {
      return null;
    }

    try {
      return JSON.parse(rawUser) as AuthUser;
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  }
}

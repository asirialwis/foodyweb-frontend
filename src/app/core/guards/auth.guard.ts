import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthSessionService } from '../services/auth-session.service';

export const authGuard: CanActivateFn = (): boolean | UrlTree => {
  const authSession = inject(AuthSessionService);
  const router = inject(Router);

  return authSession.isAuthenticated() ? true : router.parseUrl('/login');
};

export const guestGuard: CanActivateFn = (): boolean | UrlTree => {
  const authSession = inject(AuthSessionService);
  const router = inject(Router);

  return authSession.isAuthenticated() ? router.parseUrl('/dashboard') : true;
};

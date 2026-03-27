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

  if (!authSession.isAuthenticated()) return true;

  const role = authSession.user()?.role;
  switch (role) {
    case 'customer':
      return router.parseUrl('/catalog');
    case 'restaurant_owner':
    case 'delivery_driver':
    case 'admin':
      return router.parseUrl('/dashboard');
    default:
      return router.parseUrl('/catalog');
  }
};

import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, UrlTree } from '@angular/router';
import { UserRole } from '../models/types';
import { AuthSessionService } from '../services/auth-session.service';

export const roleGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
): boolean | UrlTree => {
  const authSession = inject(AuthSessionService);
  const router = inject(Router);

  const allowedRoles = (route.data['roles'] as UserRole[] | undefined) ?? [];
  const userRole = authSession.role();

  if (!authSession.isAuthenticated()) {
    return router.parseUrl('/login');
  }

  if (!allowedRoles.length || (userRole && allowedRoles.includes(userRole))) {
    return true;
  }

  return router.parseUrl('/dashboard');
};

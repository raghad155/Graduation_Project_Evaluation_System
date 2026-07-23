import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { UserRole } from './models';
import { RolePermissionsService } from './role-permissions.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isAuthenticated ? true : router.parseUrl('/login');
};

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const permissions = inject(RolePermissionsService);
  const roles = (route.data['roles'] ?? []) as UserRole[];
  const permissionRoute = route.data['permission'] as string | undefined;
  const user = auth.currentUser;

  if (!user || !auth.token) {
    return router.parseUrl('/login');
  }

  if (!roles.includes(user.role)) {
    return router.parseUrl(permissions.firstAllowedRoute(user.role));
  }

  if (user.role === 'admin' || permissions.canAccess(user.role, permissionRoute ?? `/${route.routeConfig?.path ?? ''}`)) {
    return true;
  }

  return router.parseUrl(permissions.firstAllowedRoute(user.role));
};

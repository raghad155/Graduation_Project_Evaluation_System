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

  const primaryRole = user.role;
  const allUserRoles = user.roles && user.roles.length > 0 ? user.roles : [primaryRole];

  const targetPath = permissionRoute ?? `/${route.routeConfig?.path ?? ''}`;

  const hasAccess = allUserRoles.some(r => {
    if (!roles.includes(r)) return false;
    return r === 'admin' || permissions.canAccess(r, targetPath);
  });

  if (hasAccess) {
    return true;
  }

  return router.parseUrl(permissions.firstAllowedRoute(primaryRole));
};

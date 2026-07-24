import os

filepath = 'src/app/core/auth.guard.ts'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the roleGuard function logic
old_guard = """export const roleGuard: CanActivateFn = (route) => {
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
};"""

new_guard = """export const roleGuard: CanActivateFn = (route) => {
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
};"""

content = content.replace(old_guard, new_guard)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Auth Guard Updated For Multi-Roles!")

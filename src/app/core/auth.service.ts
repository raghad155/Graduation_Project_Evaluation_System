import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, tap, throwError, timeout } from 'rxjs';
import { AppUser, LoginCredentials, UserRole } from './models';

interface LaravelUser {
  id: number;
  full_name?: string;
  name?: string;
  username?: string;
  email?: string;
  role?: string;
  roles?: Array<{ name: string }>;
}

interface LoginResponse {
  token: string;
  user: LaravelUser;
  roles?: string[];
}

interface PasswordChangePayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly userStorageKey = 'gpe-ui-user';
  private readonly tokenStorageKey = 'gpe-ui-token';
  private readonly userSubject = new BehaviorSubject<AppUser | null>(this.readStoredUser());

  readonly user$ = this.userSubject.asObservable();

  get currentUser(): AppUser | null {
    return this.userSubject.value;
  }

  get token(): string {
    return localStorage.getItem(this.tokenStorageKey) ?? '';
  }

  get isAuthenticated(): boolean {
    return Boolean(this.currentUser && this.token);
  }

  login(credentials: LoginCredentials): Observable<AppUser> {
    return this.http.post<LoginResponse>('/api/login', {
      username_or_email: credentials.login.trim(),
      password: credentials.password
    }).pipe(
      timeout(12000),
      map((response) => this.toAppUser(response)),
      tap((user) => {
        this.userSubject.next(user);
        localStorage.setItem(this.userStorageKey, JSON.stringify(user));
      }),
      catchError((error: HttpErrorResponse) => {
        return throwError(() => new Error(this.loginErrorMessage(error)));
      })
    );
  }

  logout(): void {
    const token = this.token;

    if (token) {
      this.http.post('/api/logout', {}, {
        headers: new HttpHeaders({ Authorization: `Bearer ${token}` })
      }).subscribe({ error: () => undefined });
    }

    localStorage.removeItem(this.userStorageKey);
    localStorage.removeItem(this.tokenStorageKey);
    this.userSubject.next(null);
  }

  changePassword(payload: PasswordChangePayload): Observable<string> {
    return this.http.put<{ message?: string }>('/api/profile/password', {
      current_password: payload.currentPassword,
      password: payload.newPassword,
      password_confirmation: payload.confirmPassword
    }).pipe(
      map((response) => response.message ?? 'Password changed successfully.'),
      catchError((error: HttpErrorResponse) => {
        return throwError(() => new Error(this.passwordErrorMessage(error)));
      })
    );
  }

  homeForRole(role: UserRole | undefined): string {
    switch (role) {
      case 'admin':
        return '/dashboard';
      case 'supervisor':
        return '/supervisor';
      case 'committee_chair':
        return '/committee-chair';
      case 'committee_member':
        return '/committee-member';
      default:
        return '/dashboard';
    }
  }

  private toAppUser(response: LoginResponse): AppUser {
    localStorage.setItem(this.tokenStorageKey, response.token);

    const rawRoles: string[] = response.roles
      ?? response.user.roles?.map((item) => item.name)
      ?? (response.user.role ? [response.user.role] : []);

    const role = this.resolveRole(rawRoles);
    const name = response.user.full_name ?? response.user.name ?? 'User';

    // تحويل جميع الأدوار إلى UserRole[] مع إزالة المكرر منها
    const allRoles: UserRole[] = [...new Set(
      rawRoles.map((r) => this.normalizeRole(r)).filter((r): r is UserRole => r !== null)
    )];

    return {
      id: response.user.id,
      name,
      username: response.user.username ?? name,
      email: response.user.email ?? '',
      role,
      roles: allRoles.length ? allRoles : [role],
      roleLabel: this.roleLabel(role)
    };
  }

  private resolveRole(roles: string[]): UserRole {
    if (roles.includes('admin')) {
      return 'admin';
    }

    if (roles.includes('supervisor')) {
      return 'supervisor';
    }

    if (roles.includes('committee_head') || roles.includes('committee_chair')) {
      return 'committee_chair';
    }

    if (roles.includes('committee_member')) {
      return 'committee_member';
    }

    return 'admin';
  }

  private roleLabel(role: UserRole): string {
    switch (role) {
      case 'admin':
        return 'Committee Head';
      case 'supervisor':
        return 'Supervisor';
      case 'committee_chair':
        return 'Committee Head';
      case 'committee_member':
        return 'Committee Member';
    }
  }

  /** تحويل اسم الدور من Laravel إلى UserRole المعروف */
  private normalizeRole(role: string): UserRole | null {
    switch (role) {
      case 'admin': return 'admin';
      case 'supervisor': return 'supervisor';
      case 'committee_head':
      case 'committee_chair': return 'committee_chair';
      case 'committee_member': return 'committee_member';
      default: return null;
    }
  }

  private loginErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'Cannot connect to Laravel API. Make sure php artisan serve is running.';
    }

    if (error.status === 401) {
      return error.error?.message ?? 'Invalid username or password.';
    }

    if (error.status === 422) {
      const errors = error.error?.errors;
      return errors?.username_or_email?.[0] ?? errors?.password?.[0] ?? 'Please check the login fields.';
    }

    return 'Login failed. Please try again.';
  }

  private passwordErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 422) {
      const errors = error.error?.errors;
      return errors?.current_password?.[0]
        ?? errors?.password?.[0]
        ?? 'Please check password fields.';
    }

    if (error.status === 401) {
      return 'Please login again before changing your password.';
    }

    return error.error?.message ?? 'Password change failed. Please try again.';
  }

  private readStoredUser(): AppUser | null {
    if (!localStorage.getItem(this.tokenStorageKey)) {
      localStorage.removeItem(this.userStorageKey);
      return null;
    }

    const raw = localStorage.getItem(this.userStorageKey);

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as AppUser;
    } catch {
      localStorage.removeItem(this.userStorageKey);
      localStorage.removeItem(this.tokenStorageKey);
      return null;
    }
  }
}

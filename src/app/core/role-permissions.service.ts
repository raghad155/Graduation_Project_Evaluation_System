import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { UserRole } from './models';

export type ManagedRole = Exclude<UserRole, 'admin'>;

export interface PermissionFeature {
  route: string;
  labelEn: string;
  labelAr: string;
  descriptionEn: string;
  descriptionAr: string;
}

type PermissionState = Record<ManagedRole, string[]>;

@Injectable({
  providedIn: 'root'
})
export class RolePermissionsService {
  private readonly http = inject(HttpClient);

  readonly managedRoles: ManagedRole[] = ['supervisor', 'committee_chair', 'committee_member'];

  readonly features: PermissionFeature[] = [
    {
      route: '/supervisor',
      labelEn: 'Supervisor Page',
      labelAr: 'صفحة المشرف',
      descriptionEn: 'Shows the supervisor workspace and assigned project follow-up.',
      descriptionAr: 'تعرض مساحة عمل المشرف ومتابعة المشاريع المسندة.'
    },
    {
      route: '/committee-chair',
      labelEn: 'Committee Head Page',
      labelAr: 'صفحة رئيس اللجنة',
      descriptionEn: 'Shows committee management and evaluation readiness areas.',
      descriptionAr: 'تعرض إدارة اللجنة ومتابعة جاهزية التقييم.'
    },
    {
      route: '/committee-member',
      labelEn: 'Committee Member Page',
      labelAr: 'صفحة عضو اللجنة',
      descriptionEn: 'Shows committee member evaluation workspace.',
      descriptionAr: 'تعرض مساحة عمل عضو اللجنة للتقييم.'
    },
    {
      route: '/project-members',
      labelEn: 'Project Members',
      labelAr: 'أعضاء المشاريع',
      descriptionEn: 'Allows viewing project details and students assigned to each project.',
      descriptionAr: 'تسمح بعرض تفاصيل المشروع والطلاب المرتبطين به.'
    },
    {
      route: '/project-evaluation-forms',
      labelEn: 'Project Evaluation Forms',
      labelAr: 'نماذج تقييم المشاريع',
      descriptionEn: 'Allows opening each project evaluation form and entering scores only.',
      descriptionAr: 'تسمح بفتح نموذج تقييم كل مشروع وإدخال الدرجات فقط.'
    },
    {
      route: '/evaluations',
      labelEn: 'Evaluation Setup',
      labelAr: 'تجهيز نماذج التقييم',
      descriptionEn: 'Allows creating and managing evaluation groups, criteria, and scales.',
      descriptionAr: 'تسمح بإنشاء النماذج وبناء معايير التقييم والمقاييس المستندة للدرجات.'
    },
    {
      route: '/settings',
      labelEn: 'Settings',
      labelAr: 'الإعدادات',
      descriptionEn: 'Allows changing language, theme, account details, and password.',
      descriptionAr: 'تسمح بتغيير اللغة والوضع ومعلومات الحساب وكلمة المرور.'
    }
  ];

  private readonly defaults: PermissionState = {
    supervisor: ['/supervisor', '/supervisor-evaluation', '/project-members', '/settings', '/evaluations'],
    committee_chair: ['/committee-chair', '/project-evaluation-forms', '/settings', '/evaluations'],
    committee_member: ['/committee-member', '/project-evaluation-forms', '/settings']
  };

  private readonly stateSubject = new BehaviorSubject<PermissionState>(this.cloneDefaults());
  readonly state$ = this.stateSubject.asObservable();

  constructor() {
    if (localStorage.getItem('gpe-ui-token')) {
      this.load();
    }
  }

  get state(): PermissionState {
    return this.stateSubject.value;
  }

  load(): void {
    this.http.get<PermissionState>('/api/role-permissions').subscribe({
      next: (state) => this.stateSubject.next(this.normalizeState(state)),
      error: () => undefined
    });
  }

  canAccess(role: UserRole | undefined, route: string): boolean {
    if (!role) {
      return false;
    }

    if (role === 'admin') {
      return true;
    }

    return this.state[role].includes(this.normalize(route));
  }

  firstAllowedRoute(role: UserRole | undefined): string {
    if (role === 'admin') {
      return '/dashboard';
    }

    if (!role) {
      return '/login';
    }

    return this.state[role][0] ?? '/login';
  }

  setAccess(role: ManagedRole, route: string, enabled: boolean): void {
    const normalized = this.normalize(route);
    const current = new Set(this.state[role]);

    if (enabled) {
      current.add(normalized);
    } else if (current.size > 1) {
      current.delete(normalized);
    }

    this.stateSubject.next({
      ...this.state,
      [role]: this.features
        .map((feature) => feature.route)
        .filter((featureRoute) => current.has(featureRoute))
    });

    this.http.put<PermissionState>('/api/role-permissions', { role, route: normalized, enabled }).subscribe({
      next: (state) => this.stateSubject.next(this.normalizeState(state)),
      error: () => undefined
    });
  }

  resetRole(role: ManagedRole): void {
    this.stateSubject.next({
      ...this.state,
      [role]: [...this.defaults[role]]
    });

    this.http.post<PermissionState>(`/api/role-permissions/${role}/reset`, {}).subscribe({
      next: (state) => this.stateSubject.next(this.normalizeState(state)),
      error: () => undefined
    });
  }

  roleLabel(role: UserRole, isArabic: boolean): string {
    switch (role) {
      case 'admin':
        return isArabic ? 'الإداري' : 'Admin';
      case 'supervisor':
        return isArabic ? 'المشرف' : 'Supervisor';
      case 'committee_chair':
        return isArabic ? 'رئيس اللجنة' : 'Committee Head';
      case 'committee_member':
        return isArabic ? 'عضو اللجنة' : 'Committee Member';
    }
  }

  private normalizeState(state: Partial<PermissionState>): PermissionState {
    return {
      supervisor: this.normalizeList(state.supervisor, this.defaults.supervisor),
      committee_chair: this.normalizeList(state.committee_chair, this.defaults.committee_chair),
      committee_member: this.normalizeList(state.committee_member, this.defaults.committee_member)
    };
  }

  private cloneDefaults(): PermissionState {
    return {
      supervisor: [...this.defaults.supervisor],
      committee_chair: [...this.defaults.committee_chair],
      committee_member: [...this.defaults.committee_member]
    };
  }

  private normalizeList(value: string[] | undefined, fallback: string[]): string[] {
    if (!Array.isArray(value)) {
      return [...fallback];
    }

    const knownRoutes = new Set(this.features.map((feature) => feature.route));
    const normalized = value.map((route) => this.normalize(route)).filter((route) => knownRoutes.has(route));
    return normalized.length ? normalized : [...fallback];
  }

  private normalize(route: string): string {
    if (route === '/results' || route.startsWith('/results/')) {
      return '/project-evaluation-forms';
    }

    if (route.startsWith('/project-evaluation-forms/')) {
      return '/project-evaluation-forms';
    }

    return route.replace(/\/$/, '') || '/';
  }
}

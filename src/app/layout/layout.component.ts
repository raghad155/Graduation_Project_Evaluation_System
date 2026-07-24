import { Component, inject } from '@angular/core';
import { IconComponent } from '../shared/components/icon/icon.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { UserRole } from '../core/models';
import { PreferencesService } from '../core/preferences.service';
import { RolePermissionsService } from '../core/role-permissions.service';

type NavIcon =
  | 'dashboard'
  | 'users'
  | 'students'
  | 'import'
  | 'supervisors'
  | 'projects'
  | 'members'
  | 'evaluations'
  | 'results'
  | 'permissions'
  | 'supervisor'
  | 'committee-chair'
  | 'committee-member'
  | 'audit'
  | 'settings';

interface NavLink {
  labelEn: string;
  labelAr: string;
  icon: NavIcon;
  route: string;
  roles: UserRole[];
}

const allRoles: UserRole[] = ['admin', 'supervisor', 'committee_chair', 'committee_member'];

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, IconComponent, RouterOutlet],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly permissions = inject(RolePermissionsService);
  readonly preferences = inject(PreferencesService);
  readonly preferenceState = toSignal(this.preferences.state$, { initialValue: this.preferences.state });
  readonly permissionState = toSignal(this.permissions.state$, { initialValue: this.permissions.state });

  sidebarOpen = false;

  readonly navLinks: NavLink[] = [
    { labelEn: 'Dashboard', labelAr: 'لوحة التحكم', icon: 'dashboard', route: '/dashboard', roles: ['admin', 'committee_chair'] },
    { labelEn: 'Supervisor Page', labelAr: 'صفحة المشرف', icon: 'supervisor', route: '/supervisor', roles: ['supervisor'] },
    { labelEn: 'Committee Head', labelAr: 'رئيس اللجنة', icon: 'committee-chair', route: '/committee-chair', roles: ['committee_chair'] },
    { labelEn: 'Committee Member', labelAr: 'عضو اللجنة', icon: 'committee-member', route: '/committee-member', roles: ['committee_member'] },
    { labelEn: 'Users', labelAr: 'المستخدمون', icon: 'users', route: '/users', roles: ['admin', 'committee_chair'] },
    { labelEn: 'Students', labelAr: 'الطلاب', icon: 'students', route: '/students', roles: ['admin', 'committee_chair'] },
    { labelEn: 'Excel Import', labelAr: 'استيراد Excel', icon: 'import', route: '/students/import', roles: ['admin', 'committee_chair'] },
    { labelEn: 'Supervisors', labelAr: 'المشرفون', icon: 'supervisors', route: '/supervisors', roles: ['admin', 'committee_chair'] },
    { labelEn: 'Committees', labelAr: 'لجان المناقشة', icon: 'committee-member', route: '/committees', roles: ['admin', 'committee_chair'] },
    { labelEn: 'Projects', labelAr: 'المشاريع', icon: 'projects', route: '/projects', roles: ['admin', 'committee_chair'] },
    { labelEn: 'Project Members', labelAr: 'أعضاء المشاريع', icon: 'members', route: '/project-members', roles: ['admin', 'committee_chair'] },
    { labelEn: 'Evaluation Setup', labelAr: 'إعداد التقييمات', icon: 'evaluations', route: '/evaluations', roles: ['admin', 'committee_chair', 'supervisor'] },
    { labelEn: 'Project Evaluation Forms', labelAr: 'نماذج تقييم المشاريع', icon: 'results', route: '/project-evaluation-forms', roles: allRoles },
    { labelEn: 'Supervisor Evaluation', labelAr: 'تقييم المشروع', icon: 'evaluations', route: '/supervisor-evaluation', roles: ['supervisor'] },
    { labelEn: 'Permissions', labelAr: 'الصلاحيات', icon: 'permissions', route: '/role-permissions', roles: ['admin', 'committee_chair'] },
    { labelEn: 'Audit Trails', labelAr: 'سجلات التدقيق', icon: 'audit', route: '/audit-logs', roles: ['admin', 'committee_chair'] },
    { labelEn: 'Settings', labelAr: 'الإعدادات', icon: 'settings', route: '/settings', roles: allRoles }
  ];

  get user() {
    return this.auth.currentUser;
  }

  get isArabic(): boolean {
    return this.preferenceState().language === 'ar';
  }

  get visibleLinks(): NavLink[] {
    const primaryRole = this.user?.role;
    const allRoles = this.user?.roles || (primaryRole ? [primaryRole] : []);
    this.permissionState();

    if (!primaryRole && allRoles.length === 0) {
      return [];
    }

    return this.navLinks.filter((link) => {
      return allRoles.some(role => {
        if (!link.roles.includes(role)) {
          return false;
        }
        return role === 'admin' || this.permissions.canAccess(role, link.route);
      });
    });
  }

  get showSettingsLink(): boolean {
    const primaryRole = this.user?.role;
    const allRoles = this.user?.roles || (primaryRole ? [primaryRole] : []);
    this.permissionState();
    return allRoles.some(role => role === 'admin' || this.permissions.canAccess(role, '/settings'));
  }

  get brandTitle(): string {
    return this.isArabic ? 'نظام التقييم' : 'GPE System';
  }

  get appTitle(): string {
    return this.isArabic ? 'نظام تقييم مشاريع التخرج' : 'Graduation Project Evaluation System';
  }

  get appSubtitle(): string {
    return this.isArabic ? 'إدارة المشاريع والتقييم' : 'Projects and evaluation';
  }

  get translatedRole(): string {
    const role = this.user?.role;
    return role ? this.permissions.roleLabel(role, this.isArabic) : '';
  }

  get menuTitle(): string {
    return this.isArabic ? 'القائمة' : 'Menu';
  }

  get mainNavigationLabel(): string {
    return this.isArabic ? 'التنقل الرئيسي' : 'Main navigation';
  }

  get sidebarLabel(): string {
    return this.isArabic ? 'القائمة الجانبية' : 'Sidebar';
  }

  get closeSidebarLabel(): string {
    return this.isArabic ? 'إغلاق القائمة الجانبية' : 'Close sidebar';
  }

  get logoutLabel(): string {
    return this.isArabic ? 'خروج' : 'Logout';
  }

  get settingsTitle(): string {
    return this.isArabic ? 'الإعدادات' : 'Settings';
  }

  get footerText(): string {
    return this.isArabic ? 'واجهة نظام تقييم مشاريع التخرج' : 'Graduation Project Evaluation UI';
  }

  navLabel(link: NavLink): string {
    return this.isArabic ? link.labelAr : link.labelEn;
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}

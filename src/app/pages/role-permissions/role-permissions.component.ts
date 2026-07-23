import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { PreferencesService } from '../../core/preferences.service';
import { ManagedRole, RolePermissionsService } from '../../core/role-permissions.service';

@Component({
  selector: 'app-role-permissions',
  standalone: true,
  templateUrl: './role-permissions.component.html',
  styleUrl: './role-permissions.component.scss'
})
export class RolePermissionsComponent {
  private readonly preferences = inject(PreferencesService);
  readonly permissions = inject(RolePermissionsService);
  readonly preferenceState = toSignal(this.preferences.state$, { initialValue: this.preferences.state });
  readonly permissionState = toSignal(this.permissions.state$, { initialValue: this.permissions.state });

  readonly roles = this.permissions.managedRoles;
  readonly features = this.permissions.features;

  get isArabic(): boolean {
    return this.preferenceState().language === 'ar';
  }

  get pageTitle(): string {
    return this.isArabic ? 'إدارة الصلاحيات' : 'Role Permissions';
  }

  get pageSubtitle(): string {
    return this.isArabic
      ? 'حددي الصفحات التي تظهر لكل دور داخل النظام.'
      : 'Choose which pages are visible and accessible for each role.';
  }

  get noteText(): string {
    return this.isArabic
      ? `${this.roles.length} أدوار / ${this.features.length} صفحات`
      : `${this.roles.length} roles / ${this.features.length} pages`;
  }

  roleLabel(role: ManagedRole): string {
    return this.permissions.roleLabel(role, this.isArabic);
  }

  featureLabel(route: string): string {
    const feature = this.features.find((item) => item.route === route);
    return feature ? (this.isArabic ? feature.labelAr : feature.labelEn) : route;
  }

  featureDescription(route: string): string {
    const feature = this.features.find((item) => item.route === route);
    return feature ? (this.isArabic ? feature.descriptionAr : feature.descriptionEn) : '';
  }

  enabled(role: ManagedRole, route: string): boolean {
    this.permissionState();
    return this.permissions.canAccess(role, route);
  }

  enabledCount(role: ManagedRole): number {
    this.permissionState();
    return this.features.filter((feature) => this.permissions.canAccess(role, feature.route)).length;
  }

  toggle(role: ManagedRole, route: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.permissions.setAccess(role, route, input.checked);
  }

  reset(role: ManagedRole): void {
    this.permissions.resetRole(role);
  }
}




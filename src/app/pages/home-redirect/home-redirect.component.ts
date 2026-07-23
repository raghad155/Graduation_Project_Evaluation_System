import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { RolePermissionsService } from '../../core/role-permissions.service';

@Component({
  selector: 'app-home-redirect',
  standalone: true,
  template: ''
})
export class HomeRedirectComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly permissions = inject(RolePermissionsService);

  ngOnInit(): void {
    this.router.navigateByUrl(this.permissions.firstAllowedRoute(this.auth.currentUser?.role));
  }
}




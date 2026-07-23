import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/auth.guard';
import { LayoutComponent } from './layout/layout.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/home-redirect/home-redirect.component').then((m) => m.HomeRedirectComponent)
      },
      {
        path: 'dashboard',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'committee_chair'] },
        loadComponent: () => import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent)
      },
      {
        path: 'users',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'committee_chair'] },
        loadComponent: () => import('./pages/users/users.component').then((m) => m.UsersComponent)
      },
      {
        path: 'settings',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'supervisor', 'committee_chair', 'committee_member'], permission: '/settings' },
        loadComponent: () => import('./pages/settings/settings.component').then((m) => m.SettingsComponent)
      },
      {
        path: 'role-permissions',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'committee_chair'] },
        loadComponent: () => import('./pages/role-permissions/role-permissions.component').then((m) => m.RolePermissionsComponent)
      },
      {
        path: 'students',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'committee_chair'] },
        loadComponent: () => import('./pages/students/students.component').then((m) => m.StudentsComponent)
      },
      {
        path: 'students/import',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'committee_chair'] },
        loadComponent: () => import('./pages/student-import/student-import.component').then((m) => m.StudentImportComponent)
      },
      {
        path: 'supervisors',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'committee_chair'] },
        loadComponent: () => import('./pages/supervisors/supervisors.component').then(m => m.SupervisorsComponent),
        title: 'Supervisors | إدارة المشرفين',
      },
      {
        path: 'committees',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'committee_chair'] },
        loadComponent: () => import('./pages/committees/committees.component').then(m => m.CommitteesComponent),
        title: 'Committees | لجان المناقشة',
      },
      {
        path: 'projects',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'committee_chair'] },
        loadComponent: () => import('./pages/projects/projects.component').then((m) => m.ProjectsComponent)
      },
      {
        path: 'project-members',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'committee_chair'], permission: '/project-members' },
        loadComponent: () => import('./pages/project-members/project-members.component').then((m) => m.ProjectMembersComponent)
      },
      {
        path: 'audit-logs',
        loadComponent: () => import('./pages/audit-logs/audit-logs').then(m => m.AuditLogs),
        canActivate: [roleGuard],
        data: { roles: ['admin', 'committee_chair'] }
      },
      {
        path: 'evaluations',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'committee_chair', 'supervisor'], permission: '/evaluations' },
        loadComponent: () => import('./pages/evaluations/evaluations.component').then((m) => m.EvaluationsComponent)
      },
      {
        path: 'results',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'supervisor', 'committee_chair', 'committee_member'], permission: '/results' },
        loadComponent: () => import('./pages/results/results.component').then((m) => m.ResultsComponent)
      },
      {
        path: 'results/:id',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'supervisor', 'committee_chair', 'committee_member'], permission: '/results' },
        loadComponent: () => import('./pages/project-result-details/project-result-details.component').then((m) => m.ProjectResultDetailsComponent)
      },
      {
        path: 'project-evaluation-forms',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'supervisor', 'committee_chair', 'committee_member'], permission: '/project-evaluation-forms' },
        loadComponent: () => import('./pages/results/results.component').then((m) => m.ResultsComponent)
      },
      {
        path: 'project-evaluation-forms/:id',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'supervisor', 'committee_chair', 'committee_member'], permission: '/project-evaluation-forms' },
        loadComponent: () => import('./pages/project-result-details/project-result-details.component').then((m) => m.ProjectResultDetailsComponent)
      },
      {
        path: 'supervisor',
        canActivate: [roleGuard],
        data: { roles: ['supervisor'], permission: '/supervisor' },
        loadComponent: () => import('./pages/supervisor/supervisor.component').then((m) => m.SupervisorComponent)
      },
      {
        path: 'supervisor-evaluation',
        canActivate: [roleGuard],
        data: { roles: ['supervisor'], permission: '/supervisor-evaluation' },
        loadComponent: () => import('./pages/supervisor-evaluation/supervisor-evaluation.component').then((m) => m.SupervisorEvaluationComponent),
        title: 'تقييم المشرف'
      },
      {
        path: 'committee-chair',
        canActivate: [roleGuard],
        data: { roles: ['committee_chair'], permission: '/committee-chair' },
        loadComponent: () => import('./pages/committee-chair/committee-chair.component').then((m) => m.CommitteeChairComponent)
      },
      {
        path: 'committee-member',
        canActivate: [roleGuard],
        data: { roles: ['committee_member'], permission: '/committee-member' },
        loadComponent: () => import('./pages/committee-member/committee-member.component').then((m) => m.CommitteeMemberComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];

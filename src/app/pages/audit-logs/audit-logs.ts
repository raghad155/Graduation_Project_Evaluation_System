import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminDataService } from '../../core/admin-data.service';
import { PreferencesService } from '../../core/preferences.service';
import { AuditLogRecord } from '../../core/models';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './audit-logs.html',
  styleUrl: './audit-logs.scss'
})
export class AuditLogs implements OnInit {
  private api = inject(AdminDataService);
  private prefs = inject(PreferencesService);

  logs: AuditLogRecord[] = [];
  loading = true;
  errorMessage = '';

  get isArabic() {
    return this.prefs.state.language === 'ar';
  }

  ngOnInit() {
    this.api.getAuditLogs().subscribe({
      next: (data) => {
        this.logs = data;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err.message || JSON.stringify(err);
        this.loading = false;
      }
    });
  }
}


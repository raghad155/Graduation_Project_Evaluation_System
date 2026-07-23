import { Component, computed, inject, signal } from '@angular/core';
import { NgClass, JsonPipe } from '@angular/common';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { AdminDataService } from '../../core/admin-data.service';
import { ProjectRecord, StatCard, StudentRecord, SupervisorRecord, EvaluationGroupRecord } from '../../core/models';
import { PreferencesService } from '../../core/preferences.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  private readonly data = inject(AdminDataService);
  private readonly preferences = inject(PreferencesService);

  readonly preferenceState = toSignal(this.preferences.state$, { initialValue: this.preferences.state });
  readonly students = toSignal(this.data.students$, { initialValue: [] as StudentRecord[] });
  readonly supervisors = toSignal(this.data.supervisors$, { initialValue: [] as SupervisorRecord[] });
  readonly projects = toSignal(this.data.projects$, { initialValue: [] as ProjectRecord[] });
  readonly evaluationGroups = toSignal(this.data.evaluationGroups$, { initialValue: [] as EvaluationGroupRecord[] });

  get isArabic(): boolean {
    return this.preferenceState().language === 'ar';
  }

  constructor() {
    this.loadDashboardData();
  }

  readonly systemStats = signal<any>(null);
  readonly highestProject = signal<any>(null);
  readonly lowestProject = signal<any>(null);
  readonly chartData = signal<any[]>([]);

  private loadDashboardData() {
    this.data.fetchDashboardStats().subscribe({
      next: (res) => this.systemStats.set(res)
    });

    this.data.fetchTopLowProjects().subscribe({
      next: (res) => {
        this.highestProject.set(res.highest_project);
        this.lowestProject.set(res.lowest_project);
      }
    });

    this.data.fetchChartsData().subscribe({
      next: (res) => this.chartData.set(res)
    });
  }

  readonly stats = computed<StatCard[]>(() => {
    const isArabic = this.isArabic;
    const sys = this.systemStats();

    if (!sys) return [];

    return [
      {
        title: isArabic ? 'المشاريع' : 'Projects',
        value: String(sys.projects_count),
        note: isArabic ? 'إجمالي المشاريع.' : 'Total projects.',
        tone: 'primary'
      },
      {
        title: isArabic ? 'متوسط النظام' : 'System Average',
        value: sys.average_score + '%',
        note: isArabic ? 'متوسط الدرجات العام.' : 'Overall average score.',
        tone: 'accent'
      },
      {
        title: isArabic ? 'التقييمات' : 'Evaluations',
        value: String(sys.evaluations_count),
        note: isArabic ? 'إجمالي عدد التقييمات.' : 'Total evaluations submitted.',
        tone: 'warning'
      },
      {
        title: isArabic ? 'بدون مشرف' : 'Missing Supervisor',
        value: String(this.projects().filter(p => !p.supervisor_id).length),
        note: isArabic ? 'مشاريع غير مربوطة بمشرف.' : 'Projects not linked to a supervisor.',
        tone: 'danger'
      },
      {
        title: isArabic ? 'بدون لجنة' : 'Missing Committee',
        value: String(this.projects().filter(p => !p.committee_id).length),
        note: isArabic ? 'مشاريع غير مرتبطة بلجنة.' : 'Projects without a committee.',
        tone: 'danger'
      },
      {
        title: isArabic ? 'بدون نموذج تقييم' : 'No Eval Form',
        value: String(this.projects().filter(p => !p.specialization_id || !this.evaluationGroups().some(g => g.specialization_id == p.specialization_id)).length),
        note: isArabic ? 'مشاريع تفتقر لمرايل تقييم جاهزة.' : 'Projects missing a ready evaluation form.',
        tone: 'danger'
      }
    ];
  });
}

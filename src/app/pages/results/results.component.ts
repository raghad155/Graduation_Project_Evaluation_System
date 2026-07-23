import { IconComponent } from 'src/app/shared/components/icon/icon.component';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AdminDataService } from '../../core/admin-data.service';
import {
  EvaluationCriterionRecord,
  EvaluationGroupRecord,
  ProjectMemberRecord,
  ProjectRecord,
  ProjectScoreRecord,
  StudentRecord,
  SupervisorRecord
} from '../../core/models';
import { PreferencesService } from '../../core/preferences.service';

interface ProjectResultSummary {
  project: ProjectRecord;
  supervisor: string;
  earned: number;
  total: number;
  percent: number;
  completedItems: number;
  totalItems: number;
  studentResults: StudentResultSummary[];
}

interface StudentResultSummary {
  student: StudentRecord;
  earned: number;
  total: number;
  percent: number;
  completedCriteria: number;
  totalCriteria: number;
}

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [RouterLink, IconComponent],
  templateUrl: './results.component.html',
  styleUrl: './results.component.scss'
})
export class ResultsComponent {
  private readonly data = inject(AdminDataService);
  readonly preferences = inject(PreferencesService);

  readonly projects = toSignal(this.data.projects$, { initialValue: [] as ProjectRecord[] });
  readonly students = toSignal(this.data.students$, { initialValue: [] as StudentRecord[] });
  readonly members = toSignal(this.data.projectMembers$, { initialValue: [] as ProjectMemberRecord[] });
  readonly supervisors = toSignal(this.data.supervisors$, { initialValue: [] as SupervisorRecord[] });
  readonly groups = toSignal(this.data.evaluationGroups$, { initialValue: [] as EvaluationGroupRecord[] });
  readonly scores = toSignal(this.data.projectScores$, { initialValue: [] as ProjectScoreRecord[] });

  readonly supervisorName = computed(() => new Map(this.supervisors().map((supervisor) => [supervisor.id, supervisor.fullName])));
  readonly allCriteria = computed(() => this.groups().flatMap((group) => group.criteria));
  readonly totalMaxScore = computed(() => this.allCriteria().reduce((total, criterion) => total + this.criterionMaxScore(criterion), 0));
  readonly summaries = computed<ProjectResultSummary[]>(() => {
    const criteria = this.allCriteria();
    const total = this.totalMaxScore();

    return this.projects().map((project) => {
      const students = this.projectStudents(project.id);
      const studentResults = students.map((student) => {
        const earned = this.studentEarnedScore(project.id, student.id);
        const completedCriteria = this.studentCompletedCriteria(project.id, student.id);

        return {
          student,
          earned,
          total,
          percent: total ? Math.round((earned / total) * 100) : 0,
          completedCriteria,
          totalCriteria: criteria.length
        };
      }).sort((first, second) => second.percent - first.percent || first.student.fullName.localeCompare(second.student.fullName));
      const earnedTotal = studentResults.reduce((sum, result) => sum + result.earned, 0);
      const earned = students.length ? Math.round((earnedTotal / students.length) * 100) / 100 : 0;
      const completedItems = studentResults.reduce((sum, result) => sum + result.completedCriteria, 0);

      return {
        project,
        supervisor: project.supervisor_id ? this.supervisorName().get(project.supervisor_id) ?? '' : '',
        earned,
        total,
        percent: total ? Math.round((earned / total) * 100) : 0,
        completedItems,
        totalItems: criteria.length * Math.max(students.length, 1),
        studentResults
      };
    }).sort((first, second) => second.percent - first.percent);
  });

  constructor() {
    this.data.loadAll();
  }

  get isArabic(): boolean {
    return this.preferences.state.language === 'ar';
  }

  private projectStudents(projectId: number): StudentRecord[] {
    const studentIds = new Set<number>();

    this.members()
      .filter((member) => Number(member.projectId) === projectId)
      .forEach((member) => studentIds.add(Number(member.studentId)));

    this.students()
      .filter((student) => Number(student.projectId) === projectId)
      .forEach((student) => studentIds.add(Number(student.id)));

    return this.students().filter((student) => studentIds.has(Number(student.id)));
  }

  private criterionMaxScore(criterion: EvaluationCriterionRecord): number {
    return criterion.items.reduce((max, item) => Math.max(max, item.maxScore), criterion.weight);
  }

  private studentEarnedScore(projectId: number, studentId: number): number {
    return this.allCriteria().reduce((total, criterion) => {
      const earned = criterion.items.reduce((max, item) => {
        return Math.max(max, Math.min(this.scoreValue(projectId, studentId, item.id), item.maxScore));
      }, 0);

      return total + earned;
    }, 0);
  }

  private studentCompletedCriteria(projectId: number, studentId: number): number {
    return this.allCriteria().filter((criterion) => {
      return criterion.items.some((item) => this.scoreValue(projectId, studentId, item.id) > 0);
    }).length;
  }

  private scoreValue(projectId: number, studentId: number, itemId: number): number {
    return this.scores().find((score) => {
      return Number(score.projectId) === projectId && Number(score.studentId) === studentId && Number(score.itemId) === itemId;
    })?.score ?? 0;
  }
}


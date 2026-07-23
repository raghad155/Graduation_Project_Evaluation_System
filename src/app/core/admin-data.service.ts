import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, forkJoin, map, of, tap, shareReplay } from 'rxjs';
import { AuthService } from './auth.service';
import {
  EvaluationCriterionRecord,
  EvaluationGroupRecord,
  EvaluationItemRecord,
  FeedbackRecord,
  ImportResult,
  ProjectMemberRecord,
  ProjectRecord,
  ProjectScoreRecord,
  StudentRecord,
  SupervisorRecord,
  DepartmentOption,
  CommitteeRecord
} from './models';

interface AdminDataPayload {
  students: StudentRecord[];
  supervisors: SupervisorRecord[];
  projects: ProjectRecord[];
  projectMembers: ProjectMemberRecord[];
  evaluationGroups: EvaluationGroupRecord[];
  projectScores: ProjectScoreRecord[];
}

interface StudentImportResponse {
  message?: string;
  imported?: number;
  updated?: number;
  skipped?: number;
  errors?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminDataService {
  private readonly http = inject(HttpClient);

  private readonly studentsSubject = new BehaviorSubject<StudentRecord[]>([]);
  private readonly supervisorsSubject = new BehaviorSubject<SupervisorRecord[]>([]);
  private readonly projectsSubject = new BehaviorSubject<ProjectRecord[]>([]);
  private readonly projectMembersSubject = new BehaviorSubject<ProjectMemberRecord[]>([]);
  private readonly evaluationGroupsSubject = new BehaviorSubject<EvaluationGroupRecord[]>([]);
  private readonly projectScoresSubject = new BehaviorSubject<ProjectScoreRecord[]>([]);
  private readonly departmentsSubject = new BehaviorSubject<DepartmentOption[]>([]);
  private readonly _committees = new BehaviorSubject<CommitteeRecord[]>([]);

  readonly students$ = this.studentsSubject.asObservable();
  readonly supervisors$ = this.supervisorsSubject.asObservable();
  readonly projects$ = this.projectsSubject.asObservable();
  readonly projectMembers$ = this.projectMembersSubject.asObservable();
  readonly evaluationGroups$ = this.evaluationGroupsSubject.asObservable();
  readonly projectScores$ = this.projectScoresSubject.asObservable();
  readonly departments$ = this.departmentsSubject.asObservable();
  readonly committees$ = this._committees.asObservable();

  constructor() {
    if (localStorage.getItem('gpe-ui-token')) {
      this.loadAll();
    }

    inject(AuthService).user$.subscribe((user) => {
      if (user) {
        this.loadAll();
        this.loadCommittees();
      }
    });
  }

  loadAll(): void {
    this.http.get<AdminDataPayload>('/api/admin-data').subscribe({
      next: (payload) => this.setPayload(this.normalizePayload(payload)),
      error: () => undefined
    });

    this.http.get<any[]>('/api/specializations').subscribe({
      next: (specs) => {
        const mapped = specs.map(s => ({
          value: s.id,
          labelEn: s.name_en,
          labelAr: s.name_ar
        }));
        this.departmentsSubject.next(mapped);
      },
      error: () => undefined
    });
  }

  loadCommittees(): void {
    this.http.get<CommitteeRecord[]>('/api/committees').subscribe({
      next: (committees) => this._committees.next(committees),
      error: (err) => console.error('Error loading committees', err)
    });
  }

  upsertCommittee(committee: Partial<CommitteeRecord> & { user_ids?: number[] }): Observable<any> {
    const isEditing = !!committee.id;
    const req = isEditing
      ? this.http.put<any>(`/api/committees/${committee.id}`, committee)
      : this.http.post<any>('/api/committees', committee);

    req.subscribe({
      next: (res) => {
        const saved = res.committee || res;
        const list = this._committees.value;
        if (isEditing) {
          this._committees.next(list.map(c => c.id === saved.id ? saved : c));
        } else {
          this._committees.next([...list, saved]);
        }
      },
      error: err => console.error('Error saving committee', err)
    });
    return req;
  }

  deleteCommittee(id: number): void {
    this.http.delete(`/api/committees/${id}`).subscribe({
      next: () => {
        this._committees.next(this._committees.value.filter(c => c.id !== id));
      },
      error: err => console.error('Error deleting committee', err)
    });
  }

  upsertStudent(student: Omit<StudentRecord, 'id'> & { id?: number }): void {
    const request = student.id
      ? this.http.put<StudentRecord>(`/api/students/${student.id}`, student)
      : this.http.post<StudentRecord>('/api/students', student);

    this.refreshAfter(request);
  }

  deleteStudent(id: number): void {
    this.refreshAfter(this.http.delete(`/api/students/${id}`));
  }

  upsertSupervisor(supervisor: Omit<SupervisorRecord, 'id' | 'activeProjects'> & { id?: number; activeProjects?: number }): void {
    const request = supervisor.id
      ? this.http.put<SupervisorRecord>(`/api/supervisors/${supervisor.id}`, supervisor)
      : this.http.post<SupervisorRecord>('/api/supervisors', supervisor);

    this.refreshAfter(request);
  }

  deleteSupervisor(id: number): void {
    this.refreshAfter(this.http.delete(`/api/supervisors/${id}`));
  }

  upsertProject(project: Omit<ProjectRecord, 'id'> & { id?: number }): void {
    const request = project.id
      ? this.http.put<ProjectRecord>(`/api/projects/${project.id}`, project)
      : this.http.post<ProjectRecord>('/api/projects', project);

    this.refreshAfter(request);
  }

  deleteProject(id: number): void {
    this.refreshAfter(this.http.delete(`/api/projects/${id}`));
  }

  toggleProjectLock(id: number): Observable<{ message: string, is_locked: boolean }> {
    return this.http.post<{ message: string, is_locked: boolean }>(`/api/projects/${id}/toggle-lock`, {}).pipe(
      tap(() => this.loadAll())
    );
  }

  upsertProjectMember(member: Omit<ProjectMemberRecord, 'id' | 'joinedAt'> & { id?: number; joinedAt?: string }): void {
    this.refreshAfter(this.http.post<ProjectMemberRecord>('/api/project-members', member));
  }

  deleteProjectMember(id: number): void {
    this.refreshAfter(this.http.delete(`/api/project-members/${id}`));
  }

  upsertEvaluationGroup(group: Omit<EvaluationGroupRecord, 'id' | 'criteria'> & { id?: number; criteria?: EvaluationCriterionRecord[] }): Observable<EvaluationGroupRecord> {
    const request = (group.id
      ? this.http.put<EvaluationGroupRecord>(`/api/evaluation-groups/${group.id}`, group)
      : this.http.post<EvaluationGroupRecord>('/api/evaluation-groups', group)).pipe(
        tap(() => this.loadAll()),
        shareReplay(1)
      );

    this.refreshAfter(request);
    return request;
  }

  duplicateEvaluationGroup(id: number): void {
    this.refreshAfter(this.http.post(`/api/evaluation-groups/${id}/duplicate`, {}));
  }

  deleteEvaluationGroup(id: number): void {
    this.refreshAfter(this.http.delete(`/api/evaluation-groups/${id}`));
  }

  upsertEvaluationCriterion(groupId: number, criterion: Omit<EvaluationCriterionRecord, 'id' | 'items'> & { id?: number; items?: EvaluationItemRecord[] }): Observable<EvaluationCriterionRecord> {
    const request = (criterion.id
      ? this.http.put<EvaluationCriterionRecord>(`/api/evaluation-groups/${groupId}/criteria/${criterion.id}`, criterion)
      : this.http.post<EvaluationCriterionRecord>(`/api/evaluation-groups/${groupId}/criteria`, criterion)).pipe(
        tap(() => this.loadAll()),
        shareReplay(1)
      );

    this.refreshAfter(request);
    return request;
  }

  deleteEvaluationCriterion(groupId: number, criterionId: number): void {
    this.refreshAfter(this.http.delete(`/api/evaluation-groups/${groupId}/criteria/${criterionId}`));
  }

  replaceEvaluationItems(groupId: number, criterionId: number, items: Array<Omit<EvaluationItemRecord, 'id'> & { id?: number }>): Observable<EvaluationItemRecord[]> {
    return this.http.put<EvaluationItemRecord[]>(
      `/api/evaluation-groups/${groupId}/criteria/${criterionId}/items`,
      { items }
    ).pipe(
      tap(() => this.loadAll())
    );
  }

  upsertProjectScore(score: ProjectScoreRecord): void {
    this.http.post<ProjectScoreRecord>('/api/project-scores', score).subscribe({
      next: (savedScore) => this.mergeProjectScore(savedScore),
      error: () => undefined
    });
  }

  getFeedbacks(projectId: number): Observable<FeedbackRecord[]> {
    return this.http.get<FeedbackRecord[]>(`/api/projects/${projectId}/feedbacks`);
  }

  fetchFinalReport(projectId: number): Observable<any> {
    return this.http.get<any>(`/api/projects/${projectId}/report`);
  }

  fetchDashboardStats(): Observable<any> {
    return this.http.get<any>(`/api/dashboard/stats`);
  }

  fetchTopLowProjects(): Observable<any> {
    return this.http.get<any>(`/api/dashboard/top-low-projects`);
  }

  fetchChartsData(): Observable<any[]> {
    return this.http.get<any[]>(`/api/dashboard/charts`);
  }

  addFeedback(projectId: number, content: string): Observable<FeedbackRecord> {
    return this.http.post<FeedbackRecord>(`/api/projects/${projectId}/feedbacks`, { content });
  }

  deleteFeedback(id: number): Observable<void> {
    return this.http.delete<void>(`/api/feedbacks/${id}`);
  }

  uploadStudentsFile(file: File): Observable<ImportResult> {
    return this.uploadImportFile(file, '/api/students/import', 'Students imported successfully.');
  }

  uploadSupervisorsFile(file: File): Observable<ImportResult> {
    return this.uploadImportFile(file, '/api/supervisors/import', 'Supervisors imported successfully.');
  }

  uploadProjectsFile(file: File): Observable<ImportResult> {
    return this.uploadImportFile(file, '/api/projects/import', 'Projects imported successfully.');
  }

  private uploadImportFile(file: File, endpoint: string, defaultMessage: string): Observable<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<StudentImportResponse>(endpoint, formData).pipe(
      tap(() => this.loadAll()),
      map((response) => {
        const errors = response.errors ?? [];
        const details = [
          `File: ${file.name}`,
          `Added: ${response.imported ?? 0}`,
          `Updated: ${response.updated ?? 0}`,
          `Skipped: ${response.skipped ?? 0}`,
          ...errors
        ];

        return {
          type: errors.length ? 'error' as const : 'success' as const,
          message: response.message ?? defaultMessage,
          details
        };
      }),
      catchError((error: HttpErrorResponse) => {
        const errors = error.error?.errors;
        const details = Array.isArray(errors)
          ? errors.map(String)
          : errors
            ? Object.values(errors).flat().map(String)
            : [error.error?.message ?? 'Make sure the Laravel server is running and the file format is valid.'];

        return of({
          type: 'error' as const,
          message: 'Import failed.',
          details
        });
      })
    );
  }

  private refreshAfter(request: Observable<unknown>): void {
    request.subscribe({
      next: () => this.loadAll(),
      error: (err) => {
        console.error('Backend operation failed:', err);
        const errObj = err.error || err;
        const errMsg = errObj.message ? errObj.message : JSON.stringify(errObj);
        alert('حدث خطأ أثناء حفظ البيانات في السيرفر:\n' + errMsg);
      }
    });
  }

  private setPayload(payload: AdminDataPayload): void {
    this.studentsSubject.next(payload.students ?? []);
    this.supervisorsSubject.next(payload.supervisors ?? []);
    this.projectsSubject.next(payload.projects ?? []);
    this.projectMembersSubject.next(payload.projectMembers ?? []);
    this.evaluationGroupsSubject.next(payload.evaluationGroups ?? []);
    this.projectScoresSubject.next(payload.projectScores ?? []);
  }

  private normalizePayload(payload: AdminDataPayload): AdminDataPayload {
    return {
      students: (payload.students ?? []).map((student) => this.normalizeStudent(student)),
      supervisors: (payload.supervisors ?? []).map((supervisor) => this.normalizeSupervisor(supervisor)),
      projects: (payload.projects ?? []).map((project) => this.normalizeProject(project)),
      projectMembers: (payload.projectMembers ?? []).map((member) => this.normalizeProjectMember(member)),
      evaluationGroups: (payload.evaluationGroups ?? []).map((group) => this.normalizeEvaluationGroup(group)),
      projectScores: (payload.projectScores ?? []).map((score) => this.normalizeProjectScore(score))
    };
  }

  private normalizeStudent(student: StudentRecord): StudentRecord {
    return {
      id: this.readNumber(student, ['id']) ?? 0,
      fullName: this.readString(student, ['fullName', 'full_name', 'name']) ?? '',
      academicNumber: this.readString(student, ['academicNumber', 'academic_number', 'studentNumber']) ?? '',
      specialization: this.readNumber(student, ['specialization_id', 'specialization', 'specialty', 'department']) ?? '',
      projectId: this.readNumber(student, ['projectId', 'project_id']) ?? null
    };
  }

  private normalizeSupervisor(supervisor: SupervisorRecord): SupervisorRecord {
    return {
      id: this.readNumber(supervisor, ['id']) ?? 0,
      fullName: this.readString(supervisor, ['fullName', 'full_name', 'name', 'supervisor_name']) ?? '',
      phoneNumber: this.readString(supervisor, ['phoneNumber', 'phone_number', 'phone']) ?? '',
      department: this.readNumber(supervisor, ['specialization_id', 'department_id', 'department', 'department_name', 'departmentName']) ?? '',
      activeProjects: this.readNumber(supervisor, ['activeProjects', 'active_projects', 'activeProjectCount', 'active_projects_count']) ?? 0
    };
  }

  private normalizeProject(project: ProjectRecord): ProjectRecord {
    return {
      id: this.readNumber(project, ['id']) ?? 0,
      title: this.readString(project, ['title', 'name']) ?? '',
      description: this.readString(project, ['description', 'details']) ?? '',
      supervisor_id: this.readNumber(project, ['supervisorId', 'supervisor_id']) ?? null,
      specialization_id: this.readNumber(project, ['specialization_id', 'specializationId']) ?? null,
      committee_id: this.readNumber(project, ['committee_id', 'committeeId']) ?? null,
      max_students: this.readNumber(project, ['max_students', 'maxStudents']) ?? 1,
      is_locked: !!this.readNumber(project, ['is_locked', 'isLocked'])
    };
  }

  private normalizeProjectMember(member: ProjectMemberRecord): ProjectMemberRecord {
    return {
      id: this.readNumber(member, ['id']) ?? 0,
      projectId: this.readNumber(member, ['projectId', 'project_id']) ?? 0,
      studentId: this.readNumber(member, ['studentId', 'student_id']) ?? 0,
      notes: this.readString(member, ['notes', 'note']) ?? '',
      joinedAt: this.readString(member, ['joinedAt', 'joined_at', 'createdAt']) ?? ''
    };
  }

  private normalizeEvaluationGroup(group: EvaluationGroupRecord): EvaluationGroupRecord {
    return {
      id: this.readNumber(group, ['id']) ?? 0,
      title: this.readString(group, ['title', 'name']) ?? '',
      description: this.readString(group, ['description', 'details']) ?? '',
      weight: this.readNumber(group, ['weight']) ?? 0,
      criteria: (group.criteria ?? []).map((criterion) => ({
        id: this.readNumber(criterion, ['id']) ?? 0,
        title: this.readString(criterion, ['title', 'name']) ?? '',
        weight: this.readNumber(criterion, ['weight']) ?? 0,
        items: (criterion.items ?? []).map((item) => ({
          id: this.readNumber(item, ['id']) ?? 0,
          title: this.readString(item, ['title', 'name']) ?? '',
          description: this.readString(item, ['description', 'details']) ?? '',
          maxScore: this.readNumber(item, ['maxScore', 'max_score']) ?? 0
        }))
      }))
    };
  }

  private normalizeProjectScore(score: ProjectScoreRecord): ProjectScoreRecord {
    return {
      projectId: this.readNumber(score, ['projectId', 'project_id']) ?? 0,
      studentId: this.readNumber(score, ['studentId', 'student_id']) ?? null,
      itemId: this.readNumber(score, ['itemId', 'item_id']) ?? 0,
      score: this.readNumber(score, ['score']) ?? 0,
      notes: this.readString(score, ['notes', 'note']) ?? ''
    };
  }

  private readString(source: Record<string, unknown>, keys: string[]): string | undefined {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    return undefined;
  }

  private readNumber(source: Record<string, unknown>, keys: string[]): number | undefined {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'number') {
        return value;
      }

      if (typeof value === 'string' && value.trim()) {
        const parsed = Number(value);
        if (!Number.isNaN(parsed)) {
          return parsed;
        }
      }
    }

    return undefined;
  }
  private mergeProjectScore(score: ProjectScoreRecord): void {
    const scores = this.projectScoresSubject.value;
    const exists = scores.some((item) => {
      return item.projectId === score.projectId
        && item.studentId === score.studentId
        && item.itemId === score.itemId;
    });

    this.projectScoresSubject.next(exists
      ? scores.map((item) => item.projectId === score.projectId && item.studentId === score.studentId && item.itemId === score.itemId ? score : item)
      : [...scores, score]);
  } // تم إبقاء قوس إغلاق الدالة فقط وحذف قوس إغلاق الكلاس الزائد من هنا

  downloadJsonBackup() {
    return this.http.get('/api/backup/download', {
      responseType: 'blob'
    });
  }

  getAuditLogs(): Observable<any[]> {
    return this.http.get<any[]>('/api/audit-logs');
  }

  createSupervisor(data: any) {
    return this.http.post('/api/supervisors', data);
  }

  updateSupervisor(id: number, data: any) {
    return this.http.put(`/api/supervisors/${id}`, data);
  }

  getSupervisors() {
    return this.http.get('/api/supervisors');
  }

  submitEvaluationToBackend(payload: { projectId: number, score: number, notes: string }) {
    return this.http.post('/api/evaluations', payload);
  }
} // <--- هذا القوس الآن في نهاية الملف تماماً لإغلاق الكلاس الرئيسي بنجاح
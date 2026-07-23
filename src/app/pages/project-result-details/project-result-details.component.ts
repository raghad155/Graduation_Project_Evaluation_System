import { Component, computed, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/auth.service';
import { AdminDataService } from '../../core/admin-data.service';
import {
  EvaluationCriterionRecord,
  EvaluationGroupRecord,
  EvaluationItemRecord,
  FeedbackRecord,
  ProjectMemberRecord,
  ProjectRecord,
  ProjectScoreRecord,
  StudentRecord
} from '../../core/models';
import { PreferencesService } from '../../core/preferences.service';

@Component({
  selector: 'app-project-result-details',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe],
  templateUrl: './project-result-details.component.html',
  styleUrl: './project-result-details.component.scss'
})
export class ProjectResultDetailsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly data = inject(AdminDataService);
  private readonly auth = inject(AuthService);
  readonly preferences = inject(PreferencesService);
  private readonly rubricPercentages = [25, 50, 75, 100] as const;

  private readonly routeParams = toSignal(this.route.paramMap, { initialValue: this.route.snapshot.paramMap });

  readonly selectedStudentId = signal(0);
  readonly projectId = computed(() => Number(this.routeParams().get('id') ?? 0));
  readonly projects = toSignal(this.data.projects$, { initialValue: [] as ProjectRecord[] });
  readonly students = toSignal(this.data.students$, { initialValue: [] as StudentRecord[] });
  readonly members = toSignal(this.data.projectMembers$, { initialValue: [] as ProjectMemberRecord[] });
  readonly groups = toSignal(this.data.evaluationGroups$, { initialValue: [] as EvaluationGroupRecord[] });
  readonly scores = toSignal(this.data.projectScores$, { initialValue: [] as ProjectScoreRecord[] });

  readonly isCommitteeHead = computed(() => ['committee_chair', 'admin'].includes(this.auth.currentUser?.role ?? ''));

  readonly project = computed(() => this.projects().find((item) => Number(item.id) === this.projectId()) ?? null);

  readonly canEdit = computed(() => {
    const proj = this.project();
    if (!proj) return false;
    return !proj.is_locked || this.isCommitteeHead();
  });

  readonly projectStudents = computed(() => {
    const projectId = this.projectId();
    const studentIds = new Set<number>();

    this.members()
      .filter((member) => Number(member.projectId) === projectId)
      .forEach((member) => studentIds.add(Number(member.studentId)));

    this.students()
      .filter((student) => Number(student.projectId) === projectId)
      .forEach((student) => studentIds.add(Number(student.id)));

    return this.students()
      .filter((student) => studentIds.has(Number(student.id)))
      .sort((first, second) => first.fullName.localeCompare(second.fullName));
  });
  readonly activeStudentId = computed(() => {
    const selected = this.selectedStudentId();
    const students = this.projectStudents();

    return students.some((student) => Number(student.id) === selected) ? selected : Number(students[0]?.id ?? 0);
  });
  readonly activeStudent = computed(() => this.projectStudents().find((student) => Number(student.id) === this.activeStudentId()) ?? null);
  readonly allCriteria = computed(() => this.groups().flatMap((group) => group.criteria));
  readonly allItems = computed(() => this.allCriteria().flatMap((criterion) => criterion.items));
  readonly totalMaxScore = computed(() => this.allCriteria().reduce((total, criterion) => total + this.criterionMaxScore(criterion), 0));
  readonly earnedScore = computed(() => this.allCriteria().reduce((total, criterion) => total + this.criterionEarnedScore(criterion), 0));
  readonly completedItems = computed(() => this.allCriteria().filter((criterion) => this.selectedCriterionItem(criterion)).length);
  readonly remainingItems = computed(() => Math.max(0, this.allCriteria().length - this.completedItems()));
  readonly resultPercent = computed(() => {
    const total = this.totalMaxScore();
    return total ? Math.floor((this.earnedScore() / total) * 100) : 0;
  });

  savedMessage = '';
  feedbackMessage = '';
  newFeedbackContent = '';
  readonly feedbacks = signal<FeedbackRecord[]>([]);

  readonly finalReport = signal<any>(null);
  readonly showFinalReportModal = signal(false);
  readonly hasDiscrepancy = signal(false);

  constructor() {
    this.data.loadAll();

    effect(() => {
      const selectedId = this.selectedStudentId();
      const projId = this.projectId();

      if (projId && !this.feedbacks().length) {
        this.loadFeedbacks(projId);
        this.checkDiscrepancy(); // Check silently on load
      }

      if (this.projects().length && !selectedId) {
        const studentId = this.projectStudents()[0]?.id;
        if (studentId) {
          this.selectStudent(studentId);
        }
      }
    });
  }

  checkDiscrepancy() {
    const projId = this.projectId();
    if (!projId) return;
    this.data.fetchFinalReport(projId).subscribe({
      next: (res) => {
        this.hasDiscrepancy.set(res.has_discrepancy === true);
      }
    });
  }

  loadFeedbacks(projectId: number): void {
    this.data.getFeedbacks(projectId).subscribe((items) => {
      this.feedbacks.set(items);
    });
  }

  addGeneralFeedback(): void {
    const content = this.newFeedbackContent.trim();
    if (!content) return;

    this.data.addFeedback(this.projectId(), content).subscribe((feedback) => {
      this.feedbacks.update((current) => [...current, feedback]);
      this.newFeedbackContent = '';
      this.feedbackMessage = this.isArabic ? 'تم حفظ الملاحظة' : 'Feedback saved';
      setTimeout(() => this.feedbackMessage = '', 3000);
    });
  }

  deleteFeedback(id: number): void {
    if (!confirm(this.isArabic ? 'هل تريدين حذف هذه الملاحظة؟' : 'Delete this feedback?')) return;

    this.data.deleteFeedback(id).subscribe(() => {
      this.feedbacks.update((current) => current.filter(f => f.id !== id));
      this.feedbackMessage = this.isArabic ? 'تم حذف الملاحظة' : 'Feedback deleted';
      setTimeout(() => this.feedbackMessage = '', 3000);
    });
  }

  toggleLock(): void {
    const pid = this.projectId();
    if (!pid) return;

    this.data.toggleProjectLock(pid).subscribe({
      next: (res) => {
        this.savedMessage = res.message;
        // Data service loadAll() triggered, which will eventually update this.project()
      },
      error: (err) => {
        this.savedMessage = err.error?.message || 'Error occurred while toggling lock.';
      }
    });
  }

  loadFinalReport(): void {
    const pid = this.projectId();
    if (!pid) return;

    this.data.fetchFinalReport(pid).subscribe({
      next: (report) => {
        this.finalReport.set(report);
        this.showFinalReportModal.set(true);
      },
      error: (err) => {
        this.savedMessage = this.isArabic ? 'حدث خطأ أثناء تحميل النتيجة النهائية.' : 'Error loading final report.';
      }
    });
  }

  get isArabic(): boolean {
    return this.preferences.state.language === 'ar';
  }

  selectStudent(studentId: number | string): void {
    this.selectedStudentId.set(Number(studentId));
    this.savedMessage = '';
  }

  sortedItems(criterion: EvaluationCriterionRecord): EvaluationItemRecord[] {
    return [...criterion.items].sort((first, second) => first.maxScore - second.maxScore || first.id - second.id);
  }

  scoreValue(itemId: number): number {
    return this.scoreValueForStudent(itemId, this.activeStudentId());
  }

  scoreNotes(itemId: number): string {
    return this.scoreNotesForStudent(itemId, this.activeStudentId());
  }

  isItemScored(itemId: number): boolean {
    return this.scoreValue(itemId) > 0;
  }

  isLevelSelected(criterion: EvaluationCriterionRecord, itemId: number): boolean {
    return Number(this.selectedCriterionItem(criterion)?.id ?? 0) === Number(itemId);
  }

  selectCriterionLevel(criterion: EvaluationCriterionRecord, selectedItem: EvaluationItemRecord): void {
    const studentId = this.activeStudentId();

    if (!studentId) {
      this.savedMessage = this.isArabic ? 'اختاري طالبًا من ترويسة الطلاب قبل التقييم.' : 'Select a student from the student header before scoring.';
      return;
    }

    this.savedMessage = '';

    this.sortedItems(criterion).forEach((item) => {
      this.data.upsertProjectScore({
        projectId: this.projectId(),
        studentId,
        itemId: item.id,
        score: item.id === selectedItem.id ? selectedItem.maxScore : 0,
        notes: item.id === selectedItem.id ? this.scoreNotes(item.id) : ''
      });
    });
  }

  selectCriterionLevelForStudent(criterion: EvaluationCriterionRecord, selectedItem: EvaluationItemRecord, studentId: number | string): void {
    const targetStudentId = Number(studentId);

    if (!targetStudentId) {
      return;
    }

    this.selectedStudentId.set(targetStudentId);
    this.savedMessage = '';

    this.sortedItems(criterion).forEach((item) => {
      this.data.upsertProjectScore({
        projectId: this.projectId(),
        studentId: targetStudentId,
        itemId: item.id,
        score: item.id === selectedItem.id ? selectedItem.maxScore : 0,
        notes: item.id === selectedItem.id ? this.scoreNotesForStudent(item.id, targetStudentId) : ''
      });
    });
  }

  isLevelSelectedForStudent(criterion: EvaluationCriterionRecord, itemId: number, studentId: number | string): boolean {
    return Number(this.selectedCriterionItemForStudent(criterion, Number(studentId))?.id ?? 0) === Number(itemId);
  }

  selectedCriterionItemForStudent(criterion: EvaluationCriterionRecord, studentId: number): EvaluationItemRecord | null {
    return this.sortedItems(criterion)
      .filter((item) => this.scoreValueForStudent(item.id, studentId) > 0)
      .sort((first, second) => this.scoreValueForStudent(second.id, studentId) - this.scoreValueForStudent(first.id, studentId))[0] ?? null;
  }

  studentTotalScore(studentId: number | string): number {
    const targetStudentId = Number(studentId);
    return this.allCriteria().reduce((total, criterion) => total + this.studentCriterionScore(criterion, targetStudentId), 0);
  }

  studentGroupScore(group: EvaluationGroupRecord, studentId: number | string): number {
    const targetStudentId = Number(studentId);
    return group.criteria.reduce((total, criterion) => total + this.studentCriterionScore(criterion, targetStudentId), 0);
  }

  studentCriterionScore(criterion: EvaluationCriterionRecord, studentId: number | string): number {
    const targetStudentId = Number(studentId);
    const selectedItem = this.selectedCriterionItemForStudent(criterion, targetStudentId);

    return selectedItem ? this.scoreForRubricPercent(criterion, selectedItem.id) : 0;
  }

  rubricScoreLabel(item: EvaluationItemRecord, criterion: EvaluationCriterionRecord): string {
    const maxScore = this.criterionMaxScore(criterion);
    const percent = this.rubricPercentForItem(criterion, item.id);

    return this.isArabic ? `${percent}% من ${maxScore}` : `${percent}% of ${maxScore}`;
  }

  rubricPercentForItem(criterion: EvaluationCriterionRecord, itemId: number): number {
    const index = this.sortedItems(criterion).findIndex((item) => Number(item.id) === Number(itemId));

    return this.rubricPercentages[index] ?? 0;
  }

  setNotes(itemId: number, value: string): void {
    const studentId = this.activeStudentId();

    if (!studentId) {
      return;
    }

    this.savedMessage = '';
    this.data.upsertProjectScore({
      projectId: this.projectId(),
      studentId,
      itemId,
      score: this.scoreValue(itemId),
      notes: value
    });
  }

  markCriterionFullForAll(criterion: EvaluationCriterionRecord, checked: boolean): void {
    const students = this.projectStudents();
    const items = this.sortedItems(criterion);
    const fullItem = items[items.length - 1];

    if (!students.length || !fullItem) {
      this.savedMessage = this.isArabic ? 'لا يوجد طلاب أو بنود لهذا المعيار.' : 'No students or items are available for this criterion.';
      return;
    }

    if (!checked) {
      students.forEach((student) => {
        items.forEach((item) => {
          this.data.upsertProjectScore({
            projectId: this.projectId(),
            studentId: Number(student.id),
            itemId: item.id,
            score: 0,
            notes: ''
          });
        });
      });

      this.savedMessage = this.isArabic
        ? `تم إلغاء التعبئة الكاملة لمعيار "${criterion.title}" لكل الطلاب.`
        : `Full scores were cleared for "${criterion.title}" for all students.`;
      return;
    }

    students.forEach((student) => {
      items.forEach((item) => {
        this.data.upsertProjectScore({
          projectId: this.projectId(),
          studentId: Number(student.id),
          itemId: item.id,
          score: item.id === fullItem.id ? fullItem.maxScore : 0,
          notes: item.id === fullItem.id ? this.scoreNotesForStudent(item.id, student.id) : ''
        });
      });
    });

    this.savedMessage = this.isArabic
      ? `تم تقييم جميع الطلاب 100% في معيار "${criterion.title}".`
      : `All students were scored 100% for "${criterion.title}".`;
  }

  isCriterionPerfectForAll(criterion: EvaluationCriterionRecord): boolean {
    const students = this.projectStudents();
    const items = this.sortedItems(criterion);
    const fullItem = items[items.length - 1];

    if (!students.length || !fullItem) {
      return false;
    }

    return students.every((student) => this.scoreValueForStudent(fullItem.id, student.id) >= fullItem.maxScore);
  }

  groupMaxScore(group: EvaluationGroupRecord): number {
    return group.criteria.reduce((total, criterion) => total + this.criterionMaxScore(criterion), 0);
  }

  groupEarnedScore(group: EvaluationGroupRecord): number {
    return group.criteria.reduce((total, criterion) => total + this.criterionEarnedScore(criterion), 0);
  }

  groupPercent(group: EvaluationGroupRecord): number {
    const max = this.groupMaxScore(group);
    return max ? Math.floor((this.groupEarnedScore(group) / max) * 100) : 0;
  }

  criterionMaxScore(criterion: EvaluationCriterionRecord): number {
    return this.sortedItems(criterion).reduce((max, item) => Math.max(max, item.maxScore), criterion.weight);
  }

  criterionEarnedScore(criterion: EvaluationCriterionRecord): number {
    const selectedItem = this.selectedCriterionItem(criterion);

    return selectedItem ? this.scoreForRubricPercent(criterion, selectedItem.id) : 0;
  }

  criterionPercent(criterion: EvaluationCriterionRecord): number {
    const max = this.criterionMaxScore(criterion);
    return max ? Math.floor((this.criterionEarnedScore(criterion) / max) * 100) : 0;
  }

  goToProject(projectId: string | number): void {
    const id = Number(projectId);

    if (id && id !== this.projectId()) {
      this.savedMessage = '';
      this.selectedStudentId.set(0);
      this.router.navigate(['/project-evaluation-forms', id]);
    }
  }

  saveEvaluation(): void {
    this.savedMessage = this.isArabic
      ? 'تم حفظ درجات الطالب المحدد في قاعدة البيانات.'
      : 'The selected student scores were saved to the database.';
  }

  selectedCriterionItem(criterion: EvaluationCriterionRecord): EvaluationItemRecord | null {
    return this.sortedItems(criterion)
      .filter((item) => this.scoreValue(item.id) > 0)
      .sort((first, second) => this.scoreValue(second.id) - this.scoreValue(first.id))[0] ?? null;
  }

  private scoreForRubricPercent(criterion: EvaluationCriterionRecord, itemId: number): number {
    return (this.criterionMaxScore(criterion) * this.rubricPercentForItem(criterion, itemId)) / 100;
  }

  private scoreValueForStudent(itemId: number, studentId: number): number {
    if (!studentId) {
      return 0;
    }

    return this.scoreRecord(itemId, studentId)?.score ?? 0;
  }

  private scoreNotesForStudent(itemId: number, studentId: number): string {
    if (!studentId) {
      return '';
    }

    return this.scoreRecord(itemId, studentId)?.notes ?? '';
  }

  private scoreRecord(itemId: number, studentId: number): ProjectScoreRecord | undefined {
    return this.scores().find((score) => {
      return Number(score.projectId) === this.projectId()
        && Number(score.studentId) === studentId
        && Number(score.itemId) === itemId;
    });
  }
}

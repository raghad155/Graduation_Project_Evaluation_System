import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { AdminDataService } from '../../core/admin-data.service';
import { ProjectMemberRecord, ProjectRecord, StudentRecord, SupervisorRecord } from '../../core/models';
import { PreferencesService } from '../../core/preferences.service';

@Component({
  selector: 'app-project-members',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './project-members.component.html',
  styleUrl: './project-members.component.scss'
})
export class ProjectMembersComponent {
  private readonly fb = inject(FormBuilder);
  private readonly data = inject(AdminDataService);
  readonly preferences = inject(PreferencesService);

  readonly projects = toSignal(this.data.projects$, { initialValue: [] as ProjectRecord[] });
  readonly students = toSignal(this.data.students$, { initialValue: [] as StudentRecord[] });
  readonly supervisors = toSignal(this.data.supervisors$, { initialValue: [] as SupervisorRecord[] });
  readonly members = toSignal(this.data.projectMembers$, { initialValue: [] as ProjectMemberRecord[] });

  readonly selectedProjectId = signal(0);
  readonly studentName = computed(() => new Map(this.students().map((student) => [student.id, student.fullName])));
  readonly studentNumber = computed(() => new Map(this.students().map((student) => [student.id, student.academicNumber])));
  readonly supervisorName = computed(() => new Map(this.supervisors().map((supervisor) => [supervisor.id, supervisor.fullName])));
  readonly selectedProject = computed(() => this.projects().find((project) => project.id === this.selectedProjectId()) ?? null);
  readonly selectedMembers = computed(() => {
    return this.members()
      .filter((member) => member.projectId === this.selectedProjectId())
      .sort((first, second) => {
        const firstName = this.studentName().get(first.studentId) ?? '';
        const secondName = this.studentName().get(second.studentId) ?? '';

        return firstName.localeCompare(secondName);
      });
  });
  readonly availableStudents = computed(() => {
    const selectedProject = this.selectedProjectId();
    const assignedStudentIds = new Set(this.members()
      .filter((member) => member.projectId === selectedProject)
      .map((member) => member.studentId));

    return this.students().filter((student) => !assignedStudentIds.has(student.id));
  });

  message = '';
  tableExpanded = false;
  messageType: 'success' | 'error' = 'success';

  readonly form = this.fb.nonNullable.group({
    projectId: [0, [Validators.required, Validators.min(1)]],
    studentId: [0, [Validators.required, Validators.min(1)]],
    notes: ['']
  });

  get isArabic(): boolean {
    return this.preferences.state.language === 'ar';
  }

  selectProject(value: string | number): void {
    const projectId = Number(value);
    this.selectedProjectId.set(projectId);
    this.form.patchValue({ projectId, studentId: 0 });
    this.message = '';
  }

  submit(): void {
    this.message = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.showMessage(this.isArabic ? 'اختاري المشروع والطالب قبل الإضافة.' : 'Select a project and student before adding.', 'error');
      return;
    }

    const value = this.form.getRawValue();
    const duplicate = this.members().some((member) => {
      return member.projectId === value.projectId && member.studentId === value.studentId;
    });

    if (duplicate) {
      this.showMessage(this.isArabic ? 'هذا الطالب موجود بالفعل ضمن أعضاء المشروع.' : 'This student is already a project member.', 'error');
      return;
    }

    this.data.upsertProjectMember({
      projectId: value.projectId,
      studentId: value.studentId,
      notes: value.notes.trim()
    });

    this.showMessage(this.isArabic ? 'تمت إضافة عضو المشروع بنجاح.' : 'Project member added successfully.', 'success');
    this.form.patchValue({ studentId: 0, notes: '' });
  }

  remove(member: ProjectMemberRecord): void {
    const name = this.studentName().get(member.studentId) ?? '';
    const confirmed = confirm(this.isArabic
      ? `هل تريدين حذف "${name}" من أعضاء المشروع؟`
      : `Remove "${name}" from this project?`);

    if (!confirmed) {
      return;
    }

    this.data.deleteProjectMember(member.id);
    this.showMessage(this.isArabic ? 'تم حذف العضو من المشروع.' : 'Project member removed.', 'success');
  }

  joinedDate(value: string): string {
    return new Intl.DateTimeFormat(this.isArabic ? 'ar' : 'en', { dateStyle: 'medium' }).format(new Date(value));
  }

  private showMessage(message: string, type: 'success' | 'error'): void {
    this.message = message;
    this.messageType = type;
  }
}

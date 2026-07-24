import { IconComponent } from '../../shared/components/icon/icon.component';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { AdminDataService } from '../../core/admin-data.service';
import { ProjectRecord, SupervisorRecord } from '../../core/models';
import { PreferencesService } from '../../core/preferences.service';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent],
  templateUrl: './projects.component.html'
})
export class ProjectsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly data = inject(AdminDataService);
  readonly preferences = inject(PreferencesService);

  readonly specializations = toSignal(this.data.departments$, { initialValue: [] as any[] });
  readonly projects = toSignal(this.data.projects$, { initialValue: [] as ProjectRecord[] });
  readonly supervisors = toSignal(this.data.supervisors$, { initialValue: [] as SupervisorRecord[] });
  readonly committees = toSignal(this.data.committees$, { initialValue: [] });
  readonly supervisorName = computed(() => new Map(this.supervisors().map((supervisor) => [supervisor.id, supervisor.fullName])));
  readonly query = signal('');
  readonly filteredProjects = computed(() => {
    const query = this.query().trim().toLowerCase();

    return this.projects()
      .filter((project) => {
        const supervisor = project.supervisor_id ? this.supervisorName().get(project.supervisor_id) ?? '' : '';

        return !query
          || project.title.toLowerCase().includes(query)
          || (project.description ?? '').toLowerCase().includes(query)
          || supervisor.toLowerCase().includes(query);
      })
      .sort((first, second) => first.title.localeCompare(second.title));
  });

  editingId: number | null = null;
  tableExpanded = false;
  message = '';
  messageType: 'success' | 'error' = 'success';

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    specialization_id: ['' as string | number, Validators.required],
    supervisor_id: ['' as string | number, Validators.required],
    committee_id: ['' as string | number],
    description: [''],
    max_students: [4, [Validators.required, Validators.min(1), Validators.max(10)]]
  });

  get isArabic(): boolean {
    return this.preferences.state.language === 'ar';
  }

  setQuery(value: string): void {
    this.query.set(value);
  }

  submit(): void {
    this.message = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.showMessage(this.isArabic ? 'يرجى تعبئة جميع الحقول المطلوبة.' : 'Please complete all required fields.', 'error');
      return;
    }

    const value = this.form.getRawValue();
    const duplicate = this.projects().some((project) => {
      return project.title.toLowerCase() === value.title.trim().toLowerCase() && project.id !== this.editingId;
    });

    if (duplicate) {
      this.showMessage(this.isArabic ? 'عنوان المشروع موجود مسبقًا.' : 'Project title already exists.', 'error');
      return;
    }

    const payload = {
      id: this.editingId ?? undefined,
      title: value.title.trim(),
      description: value.description.trim(),
      specialization_id: value.specialization_id ? Number(value.specialization_id) : null,
      supervisor_id: value.supervisor_id ? Number(value.supervisor_id) : null,
      committee_id: value.committee_id ? Number(value.committee_id) : null,
      max_students: value.max_students
    };

    this.data.upsertProject(payload);

    this.showMessage(
      this.editingId
        ? (this.isArabic ? 'تم تحديث المشروع بنجاح.' : 'Project updated successfully.')
        : (this.isArabic ? 'تمت إضافة المشروع بنجاح.' : 'Project added successfully.'),
      'success'
    );
    this.resetForm();
  }

  edit(project: ProjectRecord): void {
    this.editingId = project.id;
    this.form.setValue({
      title: project.title ?? '',
      description: project.description ?? '',
      specialization_id: project.specialization_id ?? '',
      supervisor_id: project.supervisor_id ?? '',
      committee_id: project.committee_id ?? '',
      max_students: project.max_students ?? 4
    });
  }

  delete(id: number): void {
    const project = this.projects().find((item) => item.id === id);

    const confirmed = project && confirm(this.isArabic
      ? `هل تريدين حذف المشروع "${project.title}"؟ سيتم إلغاء ربط الطلاب به.`
      : `Delete project "${project.title}"? Students linked to it will be unassigned.`);

    if (!confirmed) {
      return;
    }

    this.data.deleteProject(id);
    this.showMessage(this.isArabic ? 'تم حذف المشروع.' : 'Project deleted.', 'success');
  }

  resetForm(): void {
    this.editingId = null;
    this.form.reset({
      title: '',
      description: '',
      specialization_id: '',
      supervisor_id: '',
      committee_id: '',
      max_students: 4
    });
  }

  private showMessage(message: string, type: 'success' | 'error'): void {
    this.message = message;
    this.messageType = type;
  }
}


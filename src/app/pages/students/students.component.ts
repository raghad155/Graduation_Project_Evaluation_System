import { Component, computed, inject, signal } from '@angular/core';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { AdminDataService } from '../../core/admin-data.service';
import { ProjectRecord, StudentRecord } from '../../core/models';
import { PreferencesService } from '../../core/preferences.service';

interface SpecializationOption {
  value: string | number;
  labelEn: string;
  labelAr: string;
}

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent],
  templateUrl: './students.component.html'
})
export class StudentsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly data = inject(AdminDataService);
  readonly preferences = inject(PreferencesService);
  private readonly pageSize = 6;

  readonly students = toSignal(this.data.students$, { initialValue: [] as StudentRecord[] });
  readonly projects = toSignal(this.data.projects$, { initialValue: [] as ProjectRecord[] });
  readonly projectName = computed(() => new Map(this.projects().map((project) => [project.id, project.title])));
  readonly query = signal('');
  readonly page = signal(1);
  readonly specializations = toSignal(this.data.departments$, { initialValue: [] as SpecializationOption[] });

  readonly filteredStudents = computed(() => {
    const query = this.query().trim().toLowerCase();
    return this.students()
      .filter((student) => {
        return !query
          || student.fullName.toLowerCase().includes(query)
          || student.academicNumber.toLowerCase().includes(query)
          || String(this.specializationLabel(student.specialization)).toLowerCase().includes(query);
      })
      .sort((first, second) => first.fullName.localeCompare(second.fullName));
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredStudents().length / this.pageSize)));
  readonly pagedStudents = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filteredStudents().slice(start, start + this.pageSize);
  });

  editingId: number | null = null;
  tableExpanded = false;
  message = '';
  messageType: 'success' | 'error' = 'success';

  readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    academicNumber: ['', [Validators.required, Validators.minLength(4)]],
    specialization: ['' as string | number, [Validators.required]],
    projectId: [0]
  });

  get isArabic(): boolean {
    return this.preferences.state.language === 'ar';
  }

  setQuery(value: string): void {
    this.query.set(value);
    this.page.set(1);
  }

  nextPage(): void {
    this.page.set(Math.min(this.page() + 1, this.totalPages()));
  }

  previousPage(): void {
    this.page.set(Math.max(this.page() - 1, 1));
  }

  specializationLabel(value: string | number): string {
    const option = this.specializationOption(value);

    if (!option) {
      return String(value);
    }

    return this.isArabic ? option.labelAr : option.labelEn;
  }

  submit(): void {
    this.message = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.showMessage(this.isArabic ? 'يرجى تعبئة جميع الحقول المطلوبة.' : 'Please complete all required fields.', 'error');
      return;
    }

    const value = this.form.getRawValue();
    const duplicate = this.students().some((student) => {
      return student.academicNumber === value.academicNumber && student.id !== this.editingId;
    });

    if (duplicate) {
      this.showMessage(this.isArabic ? 'الرقم الأكاديمي موجود مسبقًا.' : 'Academic number already exists.', 'error');
      return;
    }

    this.data.upsertStudent({
      id: this.editingId ?? undefined,
      fullName: value.fullName.trim(),
      academicNumber: value.academicNumber.trim(),
      specialization: value.specialization,
      projectId: value.projectId || null
    });

    this.showMessage(
      this.editingId
        ? (this.isArabic ? 'تم تحديث الطالب بنجاح.' : 'Student updated successfully.')
        : (this.isArabic ? 'تمت إضافة الطالب بنجاح.' : 'Student added successfully.'),
      'success'
    );
    this.resetForm();
  }

  edit(student: StudentRecord): void {
    this.editingId = student.id;
    this.form.setValue({
      fullName: student.fullName,
      academicNumber: student.academicNumber,
      specialization: this.specializationValue(student.specialization),
      projectId: student.projectId ?? 0
    });
  }

  delete(id: number): void {
    const student = this.students().find((item) => item.id === id);

    const confirmed = student && confirm(this.isArabic
      ? `هل تريدين حذف الطالب "${student.fullName}"؟`
      : `Delete student "${student.fullName}"?`);

    if (!confirmed) {
      return;
    }

    this.data.deleteStudent(id);
    this.showMessage(this.isArabic ? 'تم حذف الطالب.' : 'Student deleted.', 'success');
  }

  resetForm(): void {
    this.editingId = null;
    this.form.reset({ fullName: '', academicNumber: '', specialization: '', projectId: 0 });
  }

  private showMessage(message: string, type: 'success' | 'error'): void {
    this.message = message;
    this.messageType = type;
  }

  private specializationValue(value: string | number): string | number {
    return this.specializationOption(value)?.value ?? value;
  }

  private specializationOption(value: string | number): SpecializationOption | undefined {
    const normalized = String(value).trim().toLowerCase();

    return this.specializations().find((option) => {
      return String(option.value) === normalized
        || option.labelEn.toLowerCase() === normalized
        || option.labelAr.toLowerCase() === normalized;
    });
  }
}


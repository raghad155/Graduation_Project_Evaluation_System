import { IconComponent } from '../../shared/components/icon/icon.component';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { AdminDataService } from '../../core/admin-data.service';
import { SupervisorRecord } from '../../core/models';
import { PreferencesService } from '../../core/preferences.service';

interface DepartmentOption {
  value: string | number;
  labelEn: string;
  labelAr: string;
}

@Component({
  selector: 'app-supervisors',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent],
  templateUrl: './supervisors.component.html'
})
export class SupervisorsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly data = inject(AdminDataService);
  readonly preferences = inject(PreferencesService);

  readonly supervisors = toSignal(this.data.supervisors$, { initialValue: [] as SupervisorRecord[] });
  readonly query = signal('');
  readonly departments = toSignal(this.data.departments$, { initialValue: [] as DepartmentOption[] });

  readonly filteredSupervisors = computed(() => {
    const query = this.query().trim().toLowerCase();

    return this.supervisors()
      .filter((supervisor) => !query
        || (supervisor.fullName ?? '').toLowerCase().includes(query)
        || (supervisor.phoneNumber ?? '').toLowerCase().includes(query)
        || String(supervisor.department ?? '').toLowerCase().includes(query)
        || String(this.departmentLabel(supervisor.department ?? '')).toLowerCase().includes(query))
      .sort((first, second) => (first.fullName ?? '').localeCompare(second.fullName ?? ''));
  });

  editingId: number | null = null;
  tableExpanded = false;
  message = '';
  messageType: 'success' | 'error' = 'success';

  readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    phoneNumber: ['', [Validators.required, Validators.pattern(/^7[0-9]{8}$/)]],
    department: ['' as string | number, [Validators.required]]
  });

  get isArabic(): boolean {
    return this.preferences.state.language === 'ar';
  }

  setQuery(value: string): void {
    this.query.set(value);
  }

  departmentLabel(value: string | number): string {
    const option = this.departmentOption(value);

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
    const duplicate = this.supervisors().some((supervisor) => {
      return (supervisor.phoneNumber ?? '') === value.phoneNumber.trim() && supervisor.id !== this.editingId;
    });

    if (duplicate) {
      this.showMessage(this.isArabic ? 'رقم الهاتف موجود مسبقًا.' : 'Phone number already exists.', 'error');
      return;
    }

    this.data.upsertSupervisor({
      id: this.editingId ?? undefined,
      fullName: value.fullName.trim(),
      phoneNumber: value.phoneNumber.trim(),
      department: value.department
    });

    this.showMessage(
      this.editingId
        ? (this.isArabic ? 'تم تحديث بيانات المشرف بنجاح.' : 'Supervisor updated successfully.')
        : (this.isArabic ? 'تمت إضافة المشرف بنجاح.' : 'Supervisor added successfully.'),
      'success'
    );
    this.resetForm();
  }

  edit(supervisor: SupervisorRecord): void {
    this.editingId = supervisor.id;
    this.form.setValue({
      fullName: supervisor.fullName ?? '',
      phoneNumber: supervisor.phoneNumber ?? '',
      department: this.departmentValue(supervisor.department ?? '')
    });
  }

  delete(id: number): void {
    const supervisor = this.supervisors().find((item) => item.id === id);

    const confirmed = supervisor && confirm(this.isArabic
      ? `هل تريدين حذف المشرف "${supervisor.fullName ?? ''}"؟ سيتم إلغاء ربط مشاريعه.`
      : `Delete supervisor "${supervisor.fullName ?? ''}"? Related projects will be unassigned.`);

    if (!confirmed) {
      return;
    }

    this.data.deleteSupervisor(id);
    this.showMessage(this.isArabic ? 'تم حذف المشرف.' : 'Supervisor deleted.', 'success');
  }

  resetForm(): void {
    this.editingId = null;
    this.form.reset({ fullName: '', phoneNumber: '', department: '' });
  }

  private showMessage(message: string, type: 'success' | 'error'): void {
    this.message = message;
    this.messageType = type;
  }

  private departmentValue(value: string | number): string | number {
    return this.departmentOption(value)?.value ?? value;
  }

  private departmentOption(value: string | number): DepartmentOption | undefined {
    const normalized = String(value).trim().toLowerCase();

    return this.departments().find((option) => {
      return String(option.value) === normalized
        || option.labelEn.toLowerCase() === normalized
        || option.labelAr.toLowerCase() === normalized;
    });
  }
}




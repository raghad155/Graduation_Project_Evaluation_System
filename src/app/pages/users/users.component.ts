import { IconComponent } from 'src/app/shared/components/icon/icon.component';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { PreferencesService } from '../../core/preferences.service';

interface UserRecord {
    id: number;
    full_name: string;
    email: string;
    phone_number: string;
    roles: string[];
    role: string;
    role_label: string;
    created_at: string;
}

const ROLES = [
    { value: 'admin', labelAr: 'رئيس لجنة مناقشة', labelEn: 'Committee Head' },
    { value: 'supervisor', labelAr: 'مشرف', labelEn: 'Supervisor' },
    { value: 'committee_member', labelAr: 'عضو لجنة', labelEn: 'Committee Member' },
    { value: 'committee_head', labelAr: 'رئيس لجنة مناقشة', labelEn: 'Committee Head' },
];

@Component({
    selector: 'app-users',
    standalone: true,
    imports: [ReactiveFormsModule, IconComponent],
    templateUrl: './users.component.html',
    styleUrl: './users.component.scss'
})
export class UsersComponent {
    private readonly http = inject(HttpClient);
    private readonly fb = inject(FormBuilder);
    readonly preferences = inject(PreferencesService);

    readonly roles = ROLES;
    readonly users = signal<UserRecord[]>([]);
    readonly loading = signal(false);
    readonly message = signal('');
    readonly messageType = signal<'success' | 'error'>('success');
    readonly editingId = signal<number | null>(null);
    readonly showForm = signal(false);

    // الأدوار المحددة حالياً
    selectedRoles = new Set<string>();

    readonly form = this.fb.nonNullable.group({
        full_name: ['', [Validators.required, Validators.minLength(3)]],
        phone_number: ['', [Validators.required, Validators.pattern(/^7[0-9]{8}$/)]],
        email: [''],
        password: ['', [Validators.minLength(6)]],
    });

    get isArabic(): boolean {
        return this.preferences.state.language === 'ar';
    }

    get isEditing(): boolean {
        return this.editingId() !== null;
    }

    /** هل الدور محدد؟ */
    isRoleSelected(roleValue: string): boolean {
        return this.selectedRoles.has(roleValue);
    }

    /** تبديل اختيار دور */
    toggleRole(roleValue: string): void {
        if (this.selectedRoles.has(roleValue)) {
            this.selectedRoles.delete(roleValue);
        } else {
            this.selectedRoles.add(roleValue);
        }
    }

    roleLabelFor(roles: string[]): string {
        return roles.map(r => {
            const found = ROLES.find(x => x.value === r);
            return found ? (this.isArabic ? found.labelAr : found.labelEn) : r;
        }).join(' + ');
    }

    ngOnInit(): void {
        this.loadUsers();
    }

    loadUsers(): void {
        this.loading.set(true);
        this.http.get<UserRecord[]>('/api/users').subscribe({
            next: (users) => {
                this.users.set(users);
                this.loading.set(false);
            },
            error: () => {
                this.showMessage(this.isArabic ? 'فشل تحميل المستخدمين.' : 'Failed to load users.', 'error');
                this.loading.set(false);
            }
        });
    }

    openAddForm(): void {
        this.editingId.set(null);
        this.form.reset();
        this.selectedRoles = new Set();
        this.form.controls.password.setValidators([Validators.required, Validators.minLength(6)]);
        this.form.controls.password.updateValueAndValidity();
        this.message.set('');
        this.showForm.set(true);
    }

    openEditForm(user: UserRecord): void {
        this.editingId.set(user.id);
        this.form.patchValue({
            full_name: user.full_name,
            phone_number: user.phone_number,
            email: user.email,
            password: '',
        });
        this.selectedRoles = new Set(user.roles ?? (user.role ? [user.role] : []));
        this.form.controls.password.clearValidators();
        this.form.controls.password.updateValueAndValidity();
        this.message.set('');
        this.showForm.set(true);
    }

    cancelForm(): void {
        this.showForm.set(false);
        this.editingId.set(null);
        this.form.reset();
        this.selectedRoles = new Set();
        this.message.set('');
    }

    save(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.showMessage(
                this.isArabic ? 'يرجى تعبئة جميع الحقول المطلوبة.' : 'Please fill all required fields.',
                'error'
            );
            return;
        }

        if (this.selectedRoles.size === 0) {
            this.showMessage(
                this.isArabic ? 'يرجى اختيار دور واحد على الأقل.' : 'Please select at least one role.',
                'error'
            );
            return;
        }

        const value = this.form.getRawValue();
        const payload: Record<string, any> = {
            full_name: value.full_name.trim(),
            phone_number: value.phone_number.trim(),
            roles: Array.from(this.selectedRoles),
        };
        if (value.email.trim()) payload['email'] = value.email.trim();
        if (value.password.trim()) payload['password'] = value.password.trim();

        const id = this.editingId();
        const request = id
            ? this.http.put<any>(`/api/users/${id}`, payload)
            : this.http.post<any>('/api/users', payload);

        request.subscribe({
            next: () => {
                this.showMessage(
                    id
                        ? (this.isArabic ? '✅ تم تحديث المستخدم بنجاح.' : '✅ User updated.')
                        : (this.isArabic ? '✅ تم إنشاء الحساب بنجاح.' : '✅ Account created.'),
                    'success'
                );
                this.cancelForm();
                this.loadUsers();
            },
            error: (err) => {
                const errMsg = err?.error?.message || (this.isArabic ? 'فشلت العملية.' : 'Operation failed.');
                this.showMessage(errMsg, 'error');
            }
        });
    }

    deleteUser(user: UserRecord): void {
        const confirmed = confirm(
            this.isArabic
                ? `هل أنتِ متأكدة من حذف "${user.full_name}"؟`
                : `Delete user "${user.full_name}"?`
        );
        if (!confirmed) return;

        this.http.delete(`/api/users/${user.id}`).subscribe({
            next: () => {
                this.showMessage(this.isArabic ? '✅ تم الحذف.' : '✅ Deleted.', 'success');
                this.loadUsers();
            },
            error: () => this.showMessage(this.isArabic ? 'فشل الحذف.' : 'Delete failed.', 'error')
        });
    }

    private showMessage(msg: string, type: 'success' | 'error'): void {
        this.message.set(msg);
        this.messageType.set(type);
        setTimeout(() => this.message.set(''), 5000);
    }
}


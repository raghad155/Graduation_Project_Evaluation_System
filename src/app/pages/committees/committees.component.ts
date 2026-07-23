import { IconComponent } from '../../shared/components/icon/icon.component';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { AdminDataService } from '../../core/admin-data.service';
import { CommitteeRecord, AppUser } from '../../core/models';
import { PreferencesService } from '../../core/preferences.service';

@Component({
    selector: 'app-committees',
    standalone: true,
    imports: [ReactiveFormsModule, IconComponent],
    templateUrl: './committees.component.html',
    styleUrl: './committees.component.scss' // we can just use management-page generic styles but we'll create one
})
export class CommitteesComponent {
    private readonly fb = inject(FormBuilder);
    private readonly data = inject(AdminDataService);
    private readonly http = inject(HttpClient);
    readonly preferences = inject(PreferencesService);

    readonly committees = toSignal(this.data.committees$, { initialValue: [] as CommitteeRecord[] });
    readonly systemUsers = toSignal(this.http.get<AppUser[]>('/api/users'), { initialValue: [] as AppUser[] });
    readonly projects = toSignal(this.data.projects$, { initialValue: [] as any[] });

    // Only Committee Members and Committee Heads can be assigned to a committee
    readonly availableMembers = computed(() => {
        const users = this.systemUsers() || [];
        return users.filter((u: any) =>
            u.roles?.includes('committee_member') ||
            u.roles?.includes('committee_head') ||
            u.role === 'committee_member' ||
            u.role === 'committee_chair' ||
            u.role === 'admin'
        );
    });

    // Calculate unassigned projects and projects assigned to THIS editing committee
    readonly availableProjects = computed(() => {
        const editingId = this.editingId;
        return this.projects().filter(p => !p.committee_id || p.committee_id === editingId);
    });

    readonly query = signal('');

    readonly filteredCommittees = computed(() => {
        const q = this.query().trim().toLowerCase();
        return this.committees().filter(c => !q || c.name.toLowerCase().includes(q));
    });

    editingId: number | null = null;
    message = '';
    messageType: 'success' | 'error' = 'success';

    selectedUsers = new Set<number>();
    selectedProjects = new Set<number>();

    readonly form = this.fb.nonNullable.group({
        name: ['', [Validators.required, Validators.minLength(3)]],
    });

    get isArabic(): boolean {
        return this.preferences.state.language === 'ar';
    }

    setQuery(value: string): void {
        this.query.set(value);
    }

    isUserSelected(id: number): boolean {
        return this.selectedUsers.has(id);
    }

    toggleUser(id: number): void {
        if (this.selectedUsers.has(id)) {
            this.selectedUsers.delete(id);
        } else {
            this.selectedUsers.add(id);
        }
    }

    isProjectSelected(id: number): boolean {
        return this.selectedProjects.has(id);
    }

    projectsDropdownOpen = false;

    toggleProjectsDropdown(): void {
        this.projectsDropdownOpen = !this.projectsDropdownOpen;
    }

    toggleProject(id: number, event?: Event): void {
        event?.stopPropagation(); // Prevent closing dropdown
        if (this.selectedProjects.has(id)) {
            this.selectedProjects.delete(id);
        } else {
            this.selectedProjects.add(id);
        }
    }

    submit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.showMessage(this.isArabic ? 'يرجى إدخال اسم اللجنة' : 'Please enter committee name', 'error');
            return;
        }

        const value = this.form.getRawValue();
        const payload = {
            id: this.editingId ?? undefined,
            name: value.name.trim(),
            user_ids: Array.from(this.selectedUsers),
            project_ids: Array.from(this.selectedProjects)
        };

        this.data.upsertCommittee(payload).subscribe({
            next: () => {
                this.showMessage(
                    this.editingId
                        ? (this.isArabic ? 'تم تحديث اللجنة' : 'Committee updated')
                        : (this.isArabic ? 'تم إضافة اللجنة بنجاح' : 'Committee added'),
                    'success'
                );
                this.resetForm();
                this.data.loadAll(); // reload to reflect project assignments
            },
            error: () => this.showMessage(this.isArabic ? 'فشلت العملية' : 'Operation failed', 'error')
        });
    }

    edit(committee: CommitteeRecord): void {
        this.editingId = committee.id;
        this.form.setValue({ name: committee.name });
        this.selectedUsers = new Set(committee.users?.map(u => u.id) || []);
        this.selectedProjects = new Set(committee.projects?.map((p: any) => p.id) || []);
    }

    delete(id: number): void {
        if (!confirm(this.isArabic ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete?')) return;
        this.data.deleteCommittee(id);
        this.showMessage(this.isArabic ? 'تم الحذف' : 'Deleted successfully', 'success');
        this.data.loadAll();
    }

    resetForm(): void {
        this.editingId = null;
        this.form.reset();
        this.selectedUsers.clear();
        this.selectedProjects.clear();
    }

    private showMessage(msg: string, type: 'success' | 'error'): void {
        this.message = msg;
        this.messageType = type;
        setTimeout(() => this.message = '', 5000);
    }
}





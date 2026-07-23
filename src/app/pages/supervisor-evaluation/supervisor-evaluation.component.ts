import { IconComponent } from '../../shared/components/icon/icon.component';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminDataService } from '../../core/admin-data.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../core/auth.service';

interface SupervisorProject {
    id: number;
    name: string;
    students: Array<{ id: number; name: string }>;
}

interface EvalGroup {
    id: number;
    title: string;
    weight: number;
    type: string;
    criteria: Array<{
        id: number;
        name: string;
        weight: number;
        items: Array<{ id: number; label: string; score: number }>;
    }>;
}

interface ScoreEntry {
    [itemId: number]: { score: number; notes: string };
}

@Component({
    selector: 'app-supervisor-evaluation',
    standalone: true,
    imports: [CommonModule, FormsModule, IconComponent],
    templateUrl: './supervisor-evaluation.component.html',
    styleUrls: ['./supervisor-evaluation.component.scss']
})
export class SupervisorEvaluationComponent implements OnInit {
    projects: SupervisorProject[] = [];
    supervisorGroups: EvalGroup[] = [];

    selectedProject: SupervisorProject | null = null;
    selectedStudent: { id: number; name: string } | null = null;

    // scores[criteriaId][itemId] = { score, notes }
    scores: { [criteriaId: number]: ScoreEntry } = {};

    saving = false;
    saveSuccess = false;
    saveError = '';
    loading = true;

    // For managing supervisor's own eval groups
    showGroupForm = false;
    newGroup = { title: '', description: '', weight: 10 };
    groupSaving = false;

    private apiBase = 'http://localhost:8000/api';

    constructor(private auth: AuthService, private http: HttpClient) { }

    ngOnInit() {
        this.loadData();
    }

    private getHeaders() {
        const token = this.auth.token;
        return new HttpHeaders({ Authorization: `Bearer ${token}` });
    }

    loadData() {
        this.loading = true;
        // Load supervisor's own projects
        this.http.get<any[]>(`${this.apiBase}/projects`, { headers: this.getHeaders() })
            .subscribe({
                next: (projects) => {
                    // Filter only supervisor's own projects
                    this.projects = (projects as any[]).map(p => ({
                        id: p.id,
                        name: p.name || p.title || `Project #${p.id}`,
                        students: p.students || []
                    }));
                    this.loading = false;
                },
                error: () => { this.loading = false; }
            });

        // Load supervisor-type evaluation groups
        this.http.get<EvalGroup[]>(`${this.apiBase}/evaluation-groups?type=supervisor`, { headers: this.getHeaders() })
            .subscribe({
                next: (groups) => { this.supervisorGroups = groups; },
            });
    }

    selectProject(project: SupervisorProject) {
        this.selectedProject = project;
        this.selectedStudent = null;
        this.scores = {};
        this.saveSuccess = false;
        this.saveError = '';
    }

    selectStudent(student: { id: number; name: string }) {
        this.selectedStudent = student;
        this.scores = {};
        this.saveSuccess = false;
        this.saveError = '';
        this.initScores();
    }

    initScores() {
        this.supervisorGroups.forEach(group => {
            group.criteria.forEach(criterion => {
                if (!this.scores[criterion.id]) {
                    this.scores[criterion.id] = {};
                }
                criterion.items.forEach(item => {
                    this.scores[criterion.id][item.id] = { score: 0, notes: '' };
                });
            });
        });
    }

    getScore(criteriaId: number, itemId: number): number {
        return this.scores[criteriaId]?.[itemId]?.score ?? 0;
    }

    setScore(criteriaId: number, itemId: number, val: number) {
        if (!this.scores[criteriaId]) this.scores[criteriaId] = {};
        if (!this.scores[criteriaId][itemId]) this.scores[criteriaId][itemId] = { score: 0, notes: '' };
        this.scores[criteriaId][itemId].score = val;
    }

    getNotes(criteriaId: number, itemId: number): string {
        return this.scores[criteriaId]?.[itemId]?.notes ?? '';
    }

    setNotes(criteriaId: number, itemId: number, val: string) {
        if (!this.scores[criteriaId]) this.scores[criteriaId] = {};
        if (!this.scores[criteriaId][itemId]) this.scores[criteriaId][itemId] = { score: 0, notes: '' };
        this.scores[criteriaId][itemId].notes = val;
    }

    computeTotal(): number {
        let total = 0;
        this.supervisorGroups.forEach(group => {
            group.criteria.forEach(criterion => {
                if (this.scores[criterion.id]) {
                    Object.values(this.scores[criterion.id]).forEach(entry => {
                        total += (entry.score * criterion.weight) / 100;
                    });
                }
            });
        });
        return Math.round(total * 100) / 100;
    }

    saveScores() {
        if (!this.selectedProject || !this.selectedStudent) return;
        this.saving = true;
        this.saveSuccess = false;
        this.saveError = '';

        const scoresList: Array<{ criteria_id: number; item_id: number; score: number; notes: string }> = [];
        Object.entries(this.scores).forEach(([criteriaId, items]) => {
            Object.entries(items).forEach(([itemId, entry]) => {
                scoresList.push({
                    criteria_id: Number(criteriaId),
                    item_id: Number(itemId),
                    score: entry.score,
                    notes: entry.notes
                });
            });
        });

        const payload = {
            projectId: this.selectedProject.id,
            studentId: this.selectedStudent.id,
            scores: scoresList,
            source: 'supervisor'
        };

        this.http.post(`${this.apiBase}/project-scores`, payload, { headers: this.getHeaders() })
            .subscribe({
                next: () => {
                    this.saving = false;
                    this.saveSuccess = true;
                },
                error: (err) => {
                    this.saving = false;
                    this.saveError = err?.error?.message || 'حدث خطأ أثناء الحفظ';
                }
            });
    }

    // Manage supervisor evaluation groups
    createGroup() {
        this.groupSaving = true;
        const payload = { ...this.newGroup, type: 'supervisor' };
        this.http.post<EvalGroup>(`${this.apiBase}/evaluation-groups`, payload, { headers: this.getHeaders() })
            .subscribe({
                next: (group) => {
                    this.supervisorGroups.push({ ...group, criteria: [] });
                    this.showGroupForm = false;
                    this.newGroup = { title: '', description: '', weight: 10 };
                    this.groupSaving = false;
                },
                error: () => { this.groupSaving = false; }
            });
    }

    deleteGroup(id: number) {
        if (!confirm('هل أنت متأكد من حذف نموذج التقييم هذا؟')) return;
        this.http.delete(`${this.apiBase}/evaluation-groups/${id}`, { headers: this.getHeaders() })
            .subscribe({
                next: () => {
                    this.supervisorGroups = this.supervisorGroups.filter(g => g.id !== id);
                }
            });
    }
}





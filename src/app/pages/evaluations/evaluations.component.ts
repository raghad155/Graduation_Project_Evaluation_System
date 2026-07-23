import { IconComponent } from 'src/app/shared/components/icon/icon.component';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { AdminDataService } from '../../core/admin-data.service';
import { EvaluationCriterionRecord, EvaluationGroupRecord, EvaluationItemRecord, ProjectRecord } from '../../core/models';
import { PreferencesService } from '../../core/preferences.service';

@Component({
  selector: 'app-evaluations',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, IconComponent],
  templateUrl: './evaluations.component.html',
  styleUrl: './evaluations.component.scss'
})
export class EvaluationsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly data = inject(AdminDataService);
  readonly preferences = inject(PreferencesService);
  readonly itemPercentages = [25, 50, 75, 100] as const;

  readonly groups = toSignal(this.data.evaluationGroups$, { initialValue: [] as EvaluationGroupRecord[] });
  readonly projects = toSignal(this.data.projects$, { initialValue: [] as ProjectRecord[] });
  readonly selectedGroupId = signal(0);
  readonly selectedCriterionId = signal(0);
  readonly selectedGroup = computed(() => this.groups().find((group) => group.id === this.selectedGroupId()) ?? null);
  readonly selectedCriterion = computed(() => {
    return this.selectedGroup()?.criteria.find((criterion) => criterion.id === this.selectedCriterionId()) ?? null;
  });
  readonly totalGroupWeight = computed(() => this.groups().reduce((total, group) => total + group.weight, 0));

  // „Ã„Ê⁄ «·œ—Ã«  «·≈Ã„«·Ì «·„Õ”Ê»  ·ﬁ«∆Ì« Ê«·–Ì ”Ìı—”· ··»«ﬂ ≈‰œ
  readonly totalMaxScore = computed(() => {
    return this.groups().reduce((total, group) => {
      return total + group.criteria.reduce((criteriaTotal, criterion) => {
        return criteriaTotal + this.criterionMaxScore(criterion);
      }, 0);
    }, 0);
  });

  groupMessage = '';
  criterionMessage = '';
  itemMessage = '';
  evaluationSubmitMessage = ''; // —”«·… ‰Ã«Õ √Ê ›‘· Õ›Ÿ «· ﬁÌÌ„ «·‰Â«∆Ì

  editingGroupId: number | null = null;
  editingCriterionId: number | null = null;

  readonly groupForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    weight: [25, [Validators.required, Validators.min(0), Validators.max(100)]],
    specialization_id: ['' as string | number]
  });

  readonly criterionForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    weight: [100, [Validators.required, Validators.min(1), Validators.max(100)]]
  });

  readonly itemForms = this.itemPercentages.map(() => this.fb.nonNullable.group({
    title: ['', [Validators.required]],
    description: ['']
  }));

  // ‰„Ê–Ã ≈œŒ«· «·„·«ÕŸ«  «·«Œ Ì«—Ì… ·· ﬁÌÌ„ «·‰Â«∆Ì ··„‘—Ê⁄
  readonly finalEvaluationForm = this.fb.nonNullable.group({
    projectId: [0, [Validators.required, Validators.min(1)]],
    notes: ['']
  });

  get isArabic(): boolean {
    return this.preferences.state.language === 'ar';
  }

  selectGroup(groupId: number | string): void {
    const numericGroupId = Number(groupId);
    this.selectedGroupId.set(numericGroupId);
    this.selectedCriterionId.set(this.selectedGroup()?.criteria[0]?.id ?? 0);
    this.criterionMessage = '';
    this.itemMessage = '';
    this.hydrateItemForms();
  }

  selectCriterion(criterionId: number | string): void {
    const numericCriterionId = Number(criterionId);
    this.selectedCriterionId.set(numericCriterionId);
    this.itemMessage = '';
    this.hydrateItemForms();
  }

  criterionMaxScore(criterion: EvaluationCriterionRecord): number {
    return this.sortedItems(criterion).reduce((max, item) => Math.max(max, item.maxScore), criterion.weight);
  }

  sortedItems(criterion: EvaluationCriterionRecord): EvaluationItemRecord[] {
    return [...criterion.items].sort((first, second) => first.maxScore - second.maxScore || first.id - second.id);
  }

  itemScoreForPercentage(criterion: EvaluationCriterionRecord | null, percentage: number): number {
    if (!criterion) {
      return 0;
    }
    return Math.max(1, Math.round((criterion.weight * percentage) / 100));
  }

  saveGroup(): void {
    this.groupMessage = '';

    if (this.groupForm.invalid) {
      this.groupForm.markAllAsTouched();
      this.groupMessage = this.isArabic ? '√ﬂ„·Ì »Ì«‰«  ›∆… «· ﬁÌÌ„.' : 'Complete the evaluation category fields.';
      return;
    }

    const value = this.groupForm.getRawValue();
    this.data.upsertEvaluationGroup({
      id: this.editingGroupId ?? undefined,
      title: value.title.trim(),
      description: value.description.trim(),
      weight: value.weight,
      specialization_id: value.specialization_id ? Number(value.specialization_id) : null
    }).subscribe({
      next: (res) => {
        if (res?.id) {
          this.selectGroup(res.id);
          this.editingGroupId = res.id;
        }
      }
    });

    this.groupMessage = this.editingGroupId
      ? (this.isArabic ? ' „  ÕœÌÀ «·›∆….' : 'Category updated.')
      : (this.isArabic ? ' „  ≈÷«›… «·›∆….' : 'Category added.');
  }

  editGroup(group: EvaluationGroupRecord): void {
    this.editingGroupId = group.id;
    this.groupForm.setValue({
      title: group.title,
      description: group.description,
      weight: group.weight,
      specialization_id: group.specialization_id ?? ''
    });
    this.selectGroup(group.id);
  }

  deleteGroup(group: EvaluationGroupRecord): void {
    if (!confirm(this.isArabic ? 'Â·  —ÌœÌ‰ «·Õ–›ø' : 'Are you sure?')) return;
    this.data.deleteEvaluationGroup(group.id);
    this.groupMessage = (this.isArabic ? ' „ «·Õ–› »‰Ã«Õ' : 'Deleted successfully');
  }

  duplicateGroup(group: EvaluationGroupRecord): void {
    if (confirm(this.isArabic ? 'Â·  —ÌœÌ‰ «” ‰”«Œ Â–« «·»‰œ ÊÃ„Ì⁄ »‰ÊœÂ «·›—⁄Ì…ø' : 'Duplicate this evaluation group and its criteria?')) {
      this.data.duplicateEvaluationGroup(group.id);
      this.groupMessage = (this.isArabic ? ' „ «·‰”Œ »‰Ã«Õ' : 'Duplicated successfully');
    }
  }

  saveCriterion(): void {
    this.criterionMessage = '';
    const group = this.selectedGroup();

    if (!group) {
      this.criterionMessage = this.isArabic ? '«Œ «—Ì ›∆…  ﬁÌÌ„ √Ê·«.' : 'Select an evaluation category first.';
      return;
    }

    if (this.criterionForm.invalid) {
      this.criterionForm.markAllAsTouched();
      this.criterionMessage = this.isArabic ? '√ﬂ„·Ì »Ì«‰«  «·„⁄Ì«—.' : 'Complete the criterion fields.';
      return;
    }

    const value = this.criterionForm.getRawValue();
    this.data.upsertEvaluationCriterion(group.id, {
      id: this.editingCriterionId ?? undefined,
      title: value.title.trim(),
      weight: value.weight
    }).subscribe({
      next: (res) => {
        if (res?.id) {
          this.selectCriterion(res.id);
          this.editingCriterionId = res.id;
        }
      }
    });

    this.criterionMessage = this.editingCriterionId
      ? (this.isArabic ? ' „  ÕœÌÀ «·„⁄Ì«—.' : 'Criterion updated.')
      : (this.isArabic ? ' „  ≈÷«›… «·„⁄Ì«—.' : 'Criterion added.');

  }

  editCriterion(group: EvaluationGroupRecord, criterion: EvaluationCriterionRecord): void {
    this.selectGroup(group.id);
    this.selectCriterion(criterion.id);
    this.editingCriterionId = criterion.id;
    this.criterionForm.setValue({
      title: criterion.title,
      weight: criterion.weight
    });
  }

  deleteCriterion(group: EvaluationGroupRecord, criterion: EvaluationCriterionRecord): void {
    const confirmed = confirm(this.isArabic
      ? `Â·  —ÌœÌ‰ Õ–› „⁄Ì«— "${criterion.title}"ø`
      : `Delete criterion "${criterion.title}"?`);

    if (!confirmed) {
      return;
    }

    this.data.deleteEvaluationCriterion(group.id, criterion.id);
    if (this.selectedCriterionId() === criterion.id) {
      this.selectedCriterionId.set(0);
    }
  }

  saveCriterionItems(): void {
    this.itemMessage = '';
    const group = this.selectedGroup();
    const criterion = this.selectedCriterion();

    if (!group || !criterion) {
      this.itemMessage = this.isArabic ? '«Œ «—Ì ›∆… Ê„⁄Ì«—« ﬁ»· Õ›Ÿ «·„ﬁ«ÌÌ” «·√—»⁄….' : 'Select a category and criterion before saving the four scales.';
      return;
    }

    const invalid = this.itemForms.some((form) => form.invalid);

    if (invalid) {
      this.itemForms.forEach((form) => form.markAllAsTouched());
      this.itemMessage = this.isArabic ? '√œŒ·Ì √”„«¡ «·„ﬁ«ÌÌ” «·√—»⁄… ·Â–« «·„⁄Ì«—.' : 'Enter the four scale names for this criterion.';
      return;
    }

    const currentItems = this.sortedItems(criterion);

    const items = this.itemForms.map((form, index) => {
      const value = form.getRawValue();
      const existing = currentItems[index];
      const percentage = this.itemPercentages[index];

      return {
        id: existing?.id,
        title: value.title.trim(),
        description: value.description.trim(),
        maxScore: this.itemScoreForPercentage(criterion, percentage)
      };
    });

    this.data.replaceEvaluationItems(group.id, criterion.id, items).subscribe({
      next: () => {
        this.itemMessage = this.isArabic ? '?  „ Õ›Ÿ «·„ﬁ«ÌÌ” «·√—»⁄… ··„⁄Ì«— »‰Ã«Õ.' : '? The four criterion scales were saved successfully.';
      },
      error: (error) => {
        console.error('Error saving scales:', error);
        this.itemMessage = this.isArabic ? '? ›‘· Õ›Ÿ «·„ﬁ«ÌÌ”° Ì—ÃÏ «· Õﬁﬁ „‰ « ’«· «·”Ì—›—.' : '? Failed to save scales. Check server status.';
      }
    });
  }

  private hydrateItemForms(): void {
    const criterion = this.selectedCriterion();
    const items = criterion ? this.sortedItems(criterion) : [];

    this.itemForms.forEach((form, index) => {
      const item = items[index];
      form.reset({
        title: item?.title ?? '',
        description: item?.description ?? ''
      });
    });
  }

  /**
   * ?? «·œ«·… «·„ÕœÀ… „⁄ Ãı„· ÿ»«⁄… ·· √ﬂœ „‰ ⁄„· «·“— ›Ì «·‹ Log
   */
  submitProjectEvaluation(): void {
    console.log('??  „ «·÷€ÿ ⁄·Ï “— «· ﬁÌÌ„ «·‰Â«∆Ì!');
    const projectId = this.finalEvaluationForm.value.projectId;
    console.log('«·„⁄—¯› «·„” ·„ (projectId):', projectId);

    this.evaluationSubmitMessage = '';

    //  › Ì‘ √„‰Ì: ≈–« ·„ Ì „  ÕœÌœ „‘—Ê⁄ √Ê «·„⁄—¯› 0° ‰»Â «·„ ’›Õ ›Ê—«
    if (!projectId || projectId === 0) {
      console.warn('??  ‰»ÌÂ: ·„ Ì „  „—Ì— „⁄—¯› „‘—Ê⁄ ’«·Õ («·„⁄—¯› «·Õ«·Ì 0 √Ê €Ì— „ÊÃÊœ).');
      this.evaluationSubmitMessage = this.isArabic
        ? '«·—Ã«¡ «Œ Ì«— „‘—Ê⁄ √Ê·« ·· ﬁÌÌ„.'
        : 'Please select a project first to evaluate.';
      return;
    }

    const payload = {
      projectId: projectId,
      score: this.totalMaxScore(),
      notes: this.finalEvaluationForm.value.notes?.trim() || (this.isArabic ? ' ﬁÌÌ„  ·ﬁ«∆Ì „‰ «·‰Ÿ«„' : 'Automated evaluation note')
    };

    console.log('?? «·»Ì«‰«  «·„—”·… ≈·Ï «·”Ì—›—:', payload);

    this.data.submitEvaluationToBackend(payload).subscribe({
      next: (response) => {
        console.log('? ‰ÃÕ «·Õ›Ÿ! —œ «·”Ì—›—:', response);
        this.evaluationSubmitMessage = this.isArabic
          ? '??  „ ≈—”«· ÊÕ›Ÿ «· ﬁÌÌ„ »‰Ã«Õ ›Ì ﬁ«⁄œ… «·»Ì«‰« !'
          : '?? Evaluation successfully saved to the database!';
        this.finalEvaluationForm.reset();
      },
      error: (error) => {
        console.error('? Œÿ√ „‰ «·”Ì—›— √À‰«¡ Õ›Ÿ «· ﬁÌÌ„:', error);
        this.evaluationSubmitMessage = this.isArabic
          ? '? ›‘· Õ›Ÿ «· ﬁÌÌ„° Ì—ÃÏ «· Õﬁﬁ „‰ « ’«· «·”Ì—›—.'
          : '? Failed to save evaluation. Check server status.';
      }
    });
  }
}

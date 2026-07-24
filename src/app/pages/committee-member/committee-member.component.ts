import { Component, inject } from '@angular/core';
import { PreferencesService } from '../../core/preferences.service';

@Component({
  selector: 'app-committee-member',
  standalone: true,
  templateUrl: './committee-member.component.html',
  styleUrl: './committee-member.component.scss'
})
export class CommitteeMemberComponent {
  private readonly preferences = inject(PreferencesService);

  get isArabic(): boolean {
    return this.preferences.state.language === 'ar';
  }
}

import { Component, inject } from '@angular/core';
import { PreferencesService } from '../../core/preferences.service';

@Component({
  selector: 'app-committee-chair',
  standalone: true,
  templateUrl: './committee-chair.component.html',
  styleUrl: './committee-chair.component.scss'
})
export class CommitteeChairComponent {
  private readonly preferences = inject(PreferencesService);

  get isArabic(): boolean {
    return this.preferences.state.language === 'ar';
  }
}


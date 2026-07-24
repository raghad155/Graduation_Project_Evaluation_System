import { Component, inject } from '@angular/core';
import { PreferencesService } from '../../core/preferences.service';

@Component({
  selector: 'app-supervisor',
  standalone: true,
  templateUrl: './supervisor.component.html',
  styleUrl: './supervisor.component.scss'
})
export class SupervisorComponent {
  private readonly preferences = inject(PreferencesService);

  get isArabic(): boolean {
    return this.preferences.state.language === 'ar';
  }
}


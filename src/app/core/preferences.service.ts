import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type AppLanguage = 'en' | 'ar';
export type AppTheme = 'light' | 'dark';

interface PreferencesState {
  language: AppLanguage;
  theme: AppTheme;
}

@Injectable({
  providedIn: 'root'
})
export class PreferencesService {
  private readonly document = inject(DOCUMENT);
  private readonly storageKey = 'gpe-ui-preferences';
  private readonly stateSubject = new BehaviorSubject<PreferencesState>(this.readState());

  readonly state$ = this.stateSubject.asObservable();

  get state(): PreferencesState {
    return this.stateSubject.value;
  }

  init(): void {
    this.apply(this.state);
  }

  setLanguage(language: AppLanguage): void {
    this.update({ ...this.state, language });
  }

  setTheme(theme: AppTheme): void {
    this.update({ ...this.state, theme });
  }

  private update(state: PreferencesState): void {
    localStorage.setItem(this.storageKey, JSON.stringify(state));
    this.stateSubject.next(state);
    this.apply(state);
  }

  private apply(state: PreferencesState): void {
    const html = this.document.documentElement;
    const body = this.document.body;

    html.lang = state.language;
    html.dir = state.language === 'ar' ? 'rtl' : 'ltr';
    body.classList.toggle('theme-dark', state.theme === 'dark');
    body.classList.toggle('theme-light', state.theme === 'light');
  }

  private readState(): PreferencesState {
    const fallback: PreferencesState = { language: 'en', theme: 'light' };
    const raw = localStorage.getItem(this.storageKey);

    if (!raw) {
      return fallback;
    }

    try {
      return { ...fallback, ...JSON.parse(raw) };
    } catch {
      localStorage.removeItem(this.storageKey);
      return fallback;
    }
  }
}

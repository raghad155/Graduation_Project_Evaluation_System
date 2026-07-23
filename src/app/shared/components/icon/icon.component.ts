import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-icon',
    standalone: true,
    styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1em;
      height: 1em;
      vertical-align: middle;
    }
    svg {
      width: 100%;
      height: 100%;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    :host.colored svg {
      stroke: var(--primary-color, #4A90E2);
    }
  `],
    template: `
    @switch (name) {
      @case ('dashboard') {
        <svg viewBox="0 0 24 24">
          <rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
          <rect x="14" y="3" width="7" height="7" rx="1.5"></rect>
          <rect x="3" y="14" width="7" height="7" rx="1.5"></rect>
          <rect x="14" y="14" width="7" height="7" rx="1.5"></rect>
        </svg>
      }
      @case ('users') {
        <svg viewBox="0 0 24 24">
          <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"></path>
          <circle cx="9.5" cy="7" r="4"></circle>
          <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      }
      @case ('students') {
        <svg viewBox="0 0 24 24">
          <path d="M12 4l9 4-9 4-9-4 9-4z"></path>
          <path d="M21 8v5"></path>
          <path d="M7 9v4.5c0 1.5 2.5 3 5 3s5-1.5 5-3V9"></path>
          <circle cx="12" cy="14" r="3"></circle>
          <path d="M7 22a5 5 0 0 1 10 0"></path>
        </svg>
      }
      @case ('import') {
        <svg viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <path d="M14 2v6h6"></path>
          <path d="M12 12v6"></path>
          <path d="M9 15l3 3 3-3"></path>
        </svg>
      }
      @case ('supervisors') {
        <svg viewBox="0 0 24 24">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M16 11l2 2 4-4"></path>
        </svg>
      }
      @case ('projects') {
        <svg viewBox="0 0 24 24">
          <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        </svg>
      }
      @case ('members') {
        <svg viewBox="0 0 24 24">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      }
      @case ('evaluations') {
        <svg viewBox="0 0 24 24">
          <path d="M9 11l2 2 4-4"></path>
          <path d="M21 12a9 9 0 1 1-9-9"></path>
          <path d="M21 3l-9 9"></path>
        </svg>
      }
      @case ('results') {
        <svg viewBox="0 0 24 24">
          <path d="M3 3v18h18"></path>
          <rect x="7" y="12" width="3" height="5" rx="1"></rect>
          <rect x="12" y="8" width="3" height="9" rx="1"></rect>
          <rect x="17" y="5" width="3" height="12" rx="1"></rect>
        </svg>
      }
      @case ('permissions') {
        <svg viewBox="0 0 24 24">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          <path d="M9 12l2 2 4-4"></path>
          <path d="M12 7v2"></path>
        </svg>
      }
      @case ('supervisor') {
        <svg viewBox="0 0 24 24">
          <rect x="4" y="3" width="16" height="18" rx="2"></rect>
          <path d="M9 7h6"></path>
          <path d="M9 11h6"></path>
          <path d="M9 15h3"></path>
        </svg>
      }
      @case ('committee-chair') {
        <svg viewBox="0 0 24 24">
          <path d="M4 20h16"></path>
          <path d="M5 17l1.5-9 4 4 4-7 4 7 4-4 1.5 9z"></path>
        </svg>
      }
      @case ('committee-member') {
        <svg viewBox="0 0 24 24">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          <path d="M9 12l2 2 4-4"></path>
        </svg>
      }
      @case ('settings') {
        <svg viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 16 4.6a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.22.35.35.75.4 1.1H21a2 2 0 1 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15z"></path>
        </svg>
      }
      @case ('audit') {
        <svg viewBox="0 0 24 24">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          <path d="M12 8v4"></path>
          <path d="M12 16h.01"></path>
        </svg>
      }
      @case ('trophy') {
        <svg viewBox="0 0 24 24">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
          <path d="M4 22h16"></path>
          <path d="M10 14.66V17c0 .55-.47.98-1 1.14a2 2 0 0 0-1.4 1.86v2"></path>
          <path d="M14 14.66V17c0 .55.47.98 1 1.14a2 2 0 0 1 1.4 1.86v2"></path>
          <path d="M18 4H6v5c0 3.31 2.69 6 6 6s6-2.69 6-6V4z"></path>
        </svg>
      }
      @case ('chart') {
        <svg viewBox="0 0 24 24">
          <path d="M3 3v18h18"></path>
          <path d="M18 9l-5 5-4-4-5 5"></path>
        </svg>
      }
    }
  `
})
export class IconComponent {
    @Input({ required: true }) name!: string;
}

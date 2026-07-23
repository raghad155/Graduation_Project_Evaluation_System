import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { AppLanguage, AppTheme, PreferencesService } from '../../core/preferences.service';
import { AdminDataService } from '../../core/admin-data.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly adminData = inject(AdminDataService);
  readonly preferences = inject(PreferencesService);

  readonly user = this.auth.currentUser;
  savingPassword = false;
  passwordMessage = '';
  passwordMessageType: 'success' | 'error' = 'success';

  readonly passwordForm = this.fb.nonNullable.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  });

  get isArabic(): boolean {
    return this.preferences.state.language === 'ar';
  }

  get translatedRole(): string {
    if (!this.isArabic) {
      return this.user?.roleLabel ?? '-';
    }

    switch (this.user?.role) {
      case 'admin':
        return 'الإداري';
      case 'supervisor':
        return 'المشرف';
      case 'committee_chair':
        return 'رئيس اللجنة';
      case 'committee_member':
        return 'عضو اللجنة';
      default:
        return '-';
    }
  }

  get passwordStrengthPercent(): number {
    const password = this.passwordForm.controls.newPassword.value;
    let score = 0;

    if (password.length >= 6) {
      score += 25;
    }

    if (password.length >= 10) {
      score += 25;
    }

    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) {
      score += 20;
    }

    if (/\d/.test(password)) {
      score += 15;
    }

    if (/[^A-Za-z0-9]/.test(password)) {
      score += 15;
    }

    return Math.min(score, 100);
  }

  get passwordStrengthLabel(): string {
    const percent = this.passwordStrengthPercent;

    if (!this.passwordForm.controls.newPassword.value) {
      return this.isArabic ? 'لم يتم الإدخال' : 'Not entered';
    }

    if (percent < 45) {
      return this.isArabic ? 'ضعيفة' : 'Weak';
    }

    if (percent < 75) {
      return this.isArabic ? 'متوسطة' : 'Medium';
    }

    return this.isArabic ? 'قوية' : 'Strong';
  }

  setLanguage(language: AppLanguage): void {
    this.preferences.setLanguage(language);
  }

  setTheme(theme: AppTheme): void {
    this.preferences.setTheme(theme);
  }

  changePassword(): void {
    this.passwordMessage = '';

    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const payload = this.passwordForm.getRawValue();

    if (payload.newPassword !== payload.confirmPassword) {
      this.passwordMessageType = 'error';
      this.passwordMessage = this.isArabic
        ? 'كلمة المرور الجديدة وتأكيدها غير متطابقين.'
        : 'New password and confirmation do not match.';
      return;
    }

    this.savingPassword = true;

    this.auth.changePassword(payload)
      .pipe(finalize(() => {
        this.savingPassword = false;
      }))
      .subscribe({
        next: (message) => {
          this.passwordMessageType = 'success';
          this.passwordMessage = this.isArabic ? 'تم تغيير كلمة المرور بنجاح.' : message;
          this.passwordForm.reset();
        },
        error: (error: Error) => {
          this.passwordMessageType = 'error';
          this.passwordMessage = this.isArabic ? this.passwordErrorArabic(error.message) : error.message;
        }
      });
  }

  private passwordErrorArabic(message: string): string {
    if (message.includes('current_password') || message.includes('current password')) {
      return 'كلمة المرور الحالية غير صحيحة.';
    }

    if (message.includes('password')) {
      return 'يرجى التحقق من حقول كلمة المرور.';
    }

    return 'تعذر تغيير كلمة المرور. يرجى المحاولة مرة أخرى.';
  }

  downloadBackup(): void {
    // We use fetch and download blob to be safe with Bearer token
    this.adminData.downloadJsonBackup().subscribe({
      next: (blob: Blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `system_backup_${new Date().getTime()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      },
      error: (err) => {
        console.error('Backup download failed', err);
        alert('حدث خطأ أثناء محاولة جلب النسخة الاحتياطية. يرجى المحاولة لاحقاً.');
      }
    });
  }
}

import { IconComponent } from '../../shared/components/icon/icon.component';
import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { PreferencesService } from '../../core/preferences.service';

type LoginControl = 'login' | 'password';

const usernameOrEmailValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = String(control.value ?? '').trim();

  if (!value) {
    return null;
  }

  if (value.includes('@')) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : { emailFormat: true };
  }

  if (value.length < 3 || value.length > 80) {
    return { usernameFormat: true };
  }

  return null;
};

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly preferences = inject(PreferencesService);

  readonly form = this.fb.nonNullable.group({
    login: ['', [Validators.required, usernameOrEmailValidator]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  submitting = false;
  errorMessage = '';

  get isArabic(): boolean {
    return this.preferences.state.language === 'ar';
  }

  submit(): void {
    this.errorMessage = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;

    this.auth.login(this.form.getRawValue())
      .pipe(finalize(() => {
        this.submitting = false;
      }))
      .subscribe({
        next: (user) => this.router.navigateByUrl(this.auth.homeForRole(user.role)),
        error: (error: Error) => {
          this.errorMessage = error.message;
        }
      });
  }

  isInvalid(controlName: LoginControl): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  fieldError(controlName: LoginControl): string {
    const control = this.form.controls[controlName];

    if (!this.isInvalid(controlName)) {
      return '';
    }

    if (control.errors?.['required']) {
      return controlName === 'login'
        ? (this.isArabic ? 'يرجى إدخال اسم المستخدم أو البريد.' : 'Please enter username or email')
        : (this.isArabic ? 'يرجى إدخال كلمة المرور.' : 'Please enter password');
    }

    if (control.errors?.['emailFormat']) {
      return this.isArabic ? 'يرجى إدخال بريد إلكتروني صحيح.' : 'Please enter a valid email address';
    }

    if (control.errors?.['usernameFormat']) {
      return this.isArabic
        ? 'اسم المستخدم يجب أن يكون من 3 إلى 80 حرفًا ويحتوي على حروف أو أرقام أو مسافة أو نقطة أو شرطة.'
        : 'Username must be 3-80 characters and use letters, numbers, spaces, dot, underscore, or dash';
    }

    if (control.errors?.['minlength']) {
      return this.isArabic ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.' : 'Password must be at least 6 characters';
    }

    return this.isArabic ? 'قيمة غير صحيحة.' : 'Invalid value';
  }

  translatedLoginError(): string {
    if (!this.errorMessage || !this.isArabic) {
      return this.errorMessage;
    }

    if (this.errorMessage.includes('Cannot connect')) {
      return 'لا يمكن الاتصال بخادم Laravel. تأكدي أن الخادم يعمل.';
    }

    if (this.errorMessage.includes('Invalid username') || this.errorMessage.includes('password')) {
      return 'اسم المستخدم أو كلمة المرور غير صحيحة.';
    }

    return 'تعذر تسجيل الدخول. يرجى المحاولة مرة أخرى.';
  }
}





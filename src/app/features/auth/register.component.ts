import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthApiService } from '../../core/api/auth-api.service';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { NotificationService } from '../../core/services/notification.service';
import { UserType } from '../../core/models/types';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authApi = inject(AuthApiService);
  private readonly authSession = inject(AuthSessionService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);

  readonly loadingSignal = signal(false);
  readonly showPasswordSignal = signal(false);
  readonly userTypeSignal = signal<UserType>(UserType.CUSTOMER);
  readonly UserType = UserType; // For template access

  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
    agreeToTerms: [false, [Validators.requiredTrue]],
  });

  get firstNameError(): string {
    const control = this.form.get('firstName');
    if (control?.hasError('required')) return 'First name is required';
    if (control?.hasError('minlength')) return 'First name must be at least 2 characters';
    return '';
  }

  get lastNameError(): string {
    const control = this.form.get('lastName');
    if (control?.hasError('required')) return 'Last name is required';
    if (control?.hasError('minlength')) return 'Last name must be at least 2 characters';
    return '';
  }

  get emailError(): string {
    const control = this.form.get('email');
    if (control?.hasError('required')) return 'Email is required';
    if (control?.hasError('email')) return 'Please enter a valid email';
    return '';
  }

  get phoneError(): string {
    const control = this.form.get('phone');
    if (control?.hasError('required')) return 'Phone number is required';
    if (control?.hasError('pattern')) return 'Phone must be 10 digits';
    return '';
  }

  get passwordError(): string {
    const control = this.form.get('password');
    if (control?.hasError('required')) return 'Password is required';
    if (control?.hasError('minlength')) return 'Password must be at least 8 characters';
    return '';
  }

  get confirmPasswordError(): string {
    const passwordControl = this.form.get('password');
    const confirmPasswordControl = this.form.get('confirmPassword');
    if (confirmPasswordControl?.hasError('required')) return 'Please confirm password';
    if (passwordControl?.value !== confirmPasswordControl?.value) return 'Passwords do not match';
    return '';
  }

  hasUpperCase(): boolean {
    return /[A-Z]/.test(this.form.get('password')?.value || '');
  }

  hasNumber(): boolean {
    return /[0-9]/.test(this.form.get('password')?.value || '');
  }

  togglePasswordVisibility(): void {
    this.showPasswordSignal.update((v) => !v);
  }

  setUserType(type: UserType): void {
    this.userTypeSignal.set(type);
  }

  submit(): void {
    if (this.form.invalid || this.loadingSignal()) {
      return;
    }

    this.loadingSignal.set(true);
    const { confirmPassword, agreeToTerms, ...payload } = this.form.getRawValue();
    const fullPayload = { ...payload, role: this.userTypeSignal() };

    this.authApi.register(fullPayload).subscribe({
      next: (response) => {
        this.authSession.setSession(response.access_token, response.user);
        this.notification.success('Account created', 'Welcome to FoodyWeb!');
        const homeRoute =
          response.user.role === 'customer' ? '/catalog' : '/dashboard';
        this.router.navigateByUrl(homeRoute);
      },
      error: (err) => {
        this.notification.error('Registration failed', err?.error?.message || 'Please try again');
        this.loadingSignal.set(false);
      },
      complete: () => {
        this.loadingSignal.set(false);
      },
    });
  }
}

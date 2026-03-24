import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthApiService } from '../../core/api/auth-api.service';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authApi = inject(AuthApiService);
  private readonly authSession = inject(AuthSessionService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);

  readonly loadingSignal = signal(false);
  readonly showPasswordSignal = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false],
  });

  get emailError(): string {
    const emailControl = this.form.get('email');
    if (emailControl?.hasError('required')) return 'Email is required';
    if (emailControl?.hasError('email')) return 'Please enter a valid email';
    return '';
  }

  get passwordError(): string {
    const passwordControl = this.form.get('password');
    if (passwordControl?.hasError('required')) return 'Password is required';
    if (passwordControl?.hasError('minlength')) return 'Password must be at least 6 characters';
    return '';
  }

  togglePasswordVisibility(): void {
    this.showPasswordSignal.update((v) => !v);
  }

  submit(): void {
    if (this.form.invalid || this.loadingSignal()) {
      return;
    }

    this.loadingSignal.set(true);
    const { rememberMe, ...loginPayload } = this.form.getRawValue();
    this.authApi.login(loginPayload).subscribe({
      next: (response) => {
        this.authSession.setSession(response.access_token, response.user);
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', loginPayload.email);
        }
        this.notification.success('Login successful', 'Welcome back!');
        const homeRoute =
          response.user.role === 'customer' ? '/catalog' : '/dashboard';
        this.router.navigateByUrl(homeRoute);
      },
      error: (err) => {
        this.notification.error('Login failed', err?.error?.message || 'Invalid email or password');
        this.loadingSignal.set(false);
      },
      complete: () => {
        this.loadingSignal.set(false);
      },
    });
  }
}

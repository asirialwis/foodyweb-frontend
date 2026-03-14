import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
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

  loading = false;

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  submit(): void {
    if (this.form.invalid || this.loading) {
      return;
    }

    this.loading = true;
    this.authApi.login(this.form.getRawValue()).subscribe({
      next: (response) => {
        this.authSession.setSession(response.access_token, response.user);
        this.notification.show({ type: 'success', text: 'Login successful' });
        const homeRoute =
          response.user.role === 'customer' ? '/catalog' : '/dashboard';
        this.router.navigateByUrl(homeRoute);
      },
      error: () => {
        this.notification.show({ type: 'error', text: 'Invalid email or password' });
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      },
    });
  }
}

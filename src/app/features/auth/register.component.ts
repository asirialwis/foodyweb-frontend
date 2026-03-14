import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthApiService } from '../../core/api/auth-api.service';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { NotificationService } from '../../core/services/notification.service';

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

  loading = false;

  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  submit(): void {
    if (this.form.invalid || this.loading) {
      return;
    }

    this.loading = true;
    const payload = this.form.getRawValue();
    this.authApi.register(payload).subscribe({
      next: (response) => {
        this.authSession.setSession(response.access_token, response.user);
        this.notification.show({ type: 'success', text: 'Account created successfully' });
        const homeRoute =
          response.user.role === 'customer' ? '/catalog' : '/dashboard';
        this.router.navigateByUrl(homeRoute);
      },
      error: () => {
        this.notification.show({ type: 'error', text: 'Registration failed' });
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      },
    });
  }
}

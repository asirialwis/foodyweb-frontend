import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DriversApiService } from '../../core/api/drivers-api.service';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { NotificationService } from '../../core/services/notification.service';
import { Driver } from '../../core/models/types';

@Component({
  selector: 'app-drivers',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './drivers.component.html',
  styleUrl: './drivers.component.scss',
})
export class DriversComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly driversApi = inject(DriversApiService);
  private readonly notification = inject(NotificationService);
  private readonly authSession = inject(AuthSessionService);

  readonly drivers = signal<Driver[]>([]);
  readonly myDriver = signal<Driver | null>(null);
  readonly isAdmin = computed(() => this.authSession.user()?.role === 'admin');

  readonly form = this.fb.nonNullable.group({
    vehicleType: ['motorcycle', Validators.required],
    vehicleNumber: ['', Validators.required],
    licenseNumber: ['', Validators.required],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const userId = this.authSession.user()?.id;

    this.driversApi.findAll().subscribe((drivers) => {
      this.drivers.set(drivers);
      this.myDriver.set(drivers.find((driver: Driver) => driver.userId === userId) ?? null);
    });
  }

  register(): void {
    if (this.form.invalid) {
      return;
    }

    const userId = this.authSession.user()?.id;
    if (!userId) {
      return;
    }

    this.driversApi
      .create({ userId, ...this.form.getRawValue() } as Driver)
      .subscribe(() => {
        this.notification.show({ type: 'success', text: 'Driver profile created' });
        this.load();
      });
  }

  toggleMyAvailability(): void {
    const id = this.myDriver()?._id ?? this.myDriver()?.id;
    if (!id) {
      return;
    }

    this.driversApi
      .updateAvailability(id, !(this.myDriver()?.isAvailable ?? false))
      .subscribe(() => {
        this.notification.show({ type: 'info', text: 'Availability updated' });
        this.load();
      });
  }

  deleteMyDriver(): void {
    const id = this.myDriver()?._id ?? this.myDriver()?.id;
    if (!id) {
      return;
    }

    this.driversApi.remove(id).subscribe(() => {
      this.notification.show({ type: 'info', text: 'Driver profile removed' });
      this.load();
    });
  }
}

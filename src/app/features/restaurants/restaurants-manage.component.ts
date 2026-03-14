import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RestaurantsApiService } from '../../core/api/restaurants-api.service';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { NotificationService } from '../../core/services/notification.service';
import { Restaurant } from '../../core/models/types';

@Component({
  selector: 'app-restaurants-manage',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './restaurants-manage.component.html',
  styleUrl: './restaurants-manage.component.scss',
})
export class RestaurantsManageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly restaurantsApi = inject(RestaurantsApiService);
  private readonly authSession = inject(AuthSessionService);
  private readonly notification = inject(NotificationService);

  readonly restaurants = signal<Restaurant[]>([]);
  readonly isAdmin = computed(() => this.authSession.user()?.role === 'admin');

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    cuisine: [''],
    phone: [''],
    city: [''],
    ownerId: [''],
  });

  ngOnInit(): void {
    if (!this.isAdmin()) {
      this.form.patchValue({ ownerId: this.authSession.user()?.id ?? '' });
    }

    this.load();
  }

  load(): void {
    const currentUserId = this.authSession.user()?.id;

    this.restaurantsApi.findAll().subscribe((data) => {
      if (this.isAdmin()) {
        this.restaurants.set(data);
        return;
      }

      this.restaurants.set(data.filter((restaurant) => restaurant.ownerId === currentUserId));
    });
  }

  create(): void {
    if (this.form.invalid) {
      return;
    }

    const payload = this.form.getRawValue();
    const ownerId = this.isAdmin()
      ? payload.ownerId.trim()
      : (this.authSession.user()?.id ?? '');

    if (!ownerId) {
      this.notification.show({ type: 'error', text: 'Owner account is required' });
      return;
    }

    this.restaurantsApi
      .create({
        name: payload.name,
        ownerId,
        phone: payload.phone || undefined,
        cuisine: payload.cuisine
          ? payload.cuisine.split(',').map((item) => item.trim()).filter(Boolean)
          : undefined,
        address: payload.city ? { city: payload.city } : undefined,
      } as Restaurant)
      .subscribe(() => {
        this.notification.show({ type: 'success', text: 'Restaurant created' });
        this.form.patchValue({ name: '', cuisine: '', phone: '', city: '' });
        this.load();
      });
  }

  toggleActive(restaurant: Restaurant): void {
    const id = restaurant._id ?? restaurant.id;
    if (!id) {
      return;
    }

    this.restaurantsApi
      .update(id, { isActive: !(restaurant.isActive ?? true) })
      .subscribe(() => {
        this.notification.show({ type: 'info', text: 'Restaurant updated' });
        this.load();
      });
  }

  remove(restaurant: Restaurant): void {
    const id = restaurant._id ?? restaurant.id;
    if (!id) {
      return;
    }

    this.restaurantsApi.remove(id).subscribe(() => {
      this.notification.show({ type: 'info', text: 'Restaurant removed' });
      this.load();
    });
  }
}

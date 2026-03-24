import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MenuItemsApiService } from '../../core/api/menu-items-api.service';
import { RestaurantsApiService } from '../../core/api/restaurants-api.service';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { NotificationService } from '../../core/services/notification.service';
import { MenuItem, Restaurant } from '../../core/models/types';

@Component({
  selector: 'app-menu-manage',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './menu-manage.component.html',
  styleUrl: './menu-manage.component.scss',
})
export class MenuManageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly menuApi = inject(MenuItemsApiService);
  private readonly restaurantsApi = inject(RestaurantsApiService);
  private readonly authSession = inject(AuthSessionService);
  private readonly notification = inject(NotificationService);

  readonly allRestaurants = signal<Restaurant[]>([]);
  readonly items = signal<MenuItem[]>([]);
  readonly isAdmin = computed(() => this.authSession.user()?.role === 'admin');

  readonly availableRestaurants = computed(() => {
    if (this.isAdmin()) {
      return this.allRestaurants();
    }

    const ownerId = this.authSession.user()?.id;
    return this.allRestaurants().filter((restaurant) => restaurant.ownerId === ownerId);
  });

  readonly form = this.fb.nonNullable.group({
    restaurantId: ['', Validators.required],
    name: ['', Validators.required],
    category: ['main', Validators.required],
    price: [0, Validators.required],
    description: [''],
  });

  ngOnInit(): void {
    this.restaurantsApi.findAll().subscribe((response) => {
      const restaurants = Array.isArray(response) ? response : response.restaurants;
      this.allRestaurants.set(restaurants as Restaurant[]);
      this.loadItems();
    });
  }

  loadItems(): void {
    this.menuApi.findAll().subscribe((response) => {
      const items = Array.isArray(response) ? response : response.items;
      const allowedRestaurantIds = new Set(
        this.availableRestaurants().map((restaurant) => restaurant._id ?? restaurant.id).filter((id): id is string => !!id),
      );

      if (this.isAdmin()) {
        this.items.set(items as MenuItem[]);
        return;
      }

      this.items.set(
        (items as MenuItem[]).filter((item) => allowedRestaurantIds.has(item.restaurantId)),
      );
    });
  }

  create(): void {
    if (this.form.invalid) {
      return;
    }

    const payload = this.form.getRawValue();

    this.menuApi
      .create({
        restaurantId: payload.restaurantId,
        name: payload.name,
        category: payload.category,
        price: Number(payload.price),
        description: payload.description || undefined,
      } as MenuItem)
      .subscribe(() => {
        this.notification.show({ type: 'success', text: 'Menu item added' });
        this.form.patchValue({ name: '', category: 'main', price: 0, description: '' });
        this.loadItems();
      });
  }

  toggleAvailability(item: MenuItem): void {
    const id = item._id ?? item.id;
    if (!id) {
      return;
    }

    this.menuApi
      .update(id, { isAvailable: !(item.isAvailable ?? true) })
      .subscribe(() => {
        this.notification.show({ type: 'info', text: 'Menu item updated' });
        this.loadItems();
      });
  }

  remove(item: MenuItem): void {
    const id = item._id ?? item.id;
    if (!id) {
      return;
    }

    this.menuApi.remove(id).subscribe(() => {
      this.notification.show({ type: 'info', text: 'Menu item removed' });
      this.loadItems();
    });
  }
}

import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { DriversApiService } from '../../core/api/drivers-api.service';
import { OrdersApiService } from '../../core/api/orders-api.service';
import { RestaurantsApiService } from '../../core/api/restaurants-api.service';
import { UsersApiService } from '../../core/api/users-api.service';
import { HealthApiService, HealthStatus } from '../../core/api/health-api.service';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { Delivery, Driver, User, Order, Restaurant } from '../../core/models/types';
import { DeliveriesApiService } from '../../core/api/deliveries-api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly healthApi = inject(HealthApiService);
  private readonly authSession = inject(AuthSessionService);
  private readonly restaurantsApi = inject(RestaurantsApiService);
  private readonly ordersApi = inject(OrdersApiService);
  private readonly deliveriesApi = inject(DeliveriesApiService);
  private readonly driversApi = inject(DriversApiService);
  private readonly usersApi = inject(UsersApiService);

  private readonly statuses = signal<HealthStatus[]>([]);
  private readonly restaurantCount = signal(0);
  private readonly orderCount = signal(0);
  private readonly deliveryCount = signal(0);
  private readonly userCount = signal(0);
  private readonly onlineDriverCount = signal(0);

  readonly role = computed(() => this.authSession.user()?.role ?? 'customer');

  readonly headline = computed(() => {
    switch (this.role()) {
      case 'restaurant_owner':
        return 'Run your restaurant with confidence';
      case 'delivery_driver':
        return 'Stay online and deliver on time';
      case 'admin':
        return 'Platform operations overview';
      default:
        return 'Hungry? Discover great food nearby';
    }
  });

  readonly subline = computed(() => {
    switch (this.role()) {
      case 'restaurant_owner':
        return 'Track restaurants, menu items, and incoming orders in one place.';
      case 'delivery_driver':
        return 'Manage active deliveries and keep your availability updated.';
      case 'admin':
        return 'Monitor users, merchant activity, and delivery performance.';
      default:
        return 'Browse restaurants, build your cart, and place orders in seconds.';
    }
  });

  readonly metrics = computed(() => {
    const base = [
      { label: 'Restaurants', value: this.restaurantCount() },
      { label: 'Orders', value: this.orderCount() },
    ];

    if (this.role() === 'delivery_driver') {
      return [
        { label: 'My Deliveries', value: this.deliveryCount() },
        { label: 'Online Drivers', value: this.onlineDriverCount() },
      ];
    }

    if (this.role() === 'admin') {
      return [
        ...base,
        { label: 'Deliveries', value: this.deliveryCount() },
        { label: 'Users', value: this.userCount() },
      ];
    }

    return base;
  });

  readonly actions = computed(() => {
    switch (this.role()) {
      case 'restaurant_owner':
        return [
          { label: 'Manage Restaurants', link: '/restaurants/manage' },
          { label: 'Manage Menu', link: '/menu/manage' },
          { label: 'View Orders', link: '/orders' },
        ];
      case 'delivery_driver':
        return [
          { label: 'Delivery Queue', link: '/deliveries' },
          { label: 'Driver Profile', link: '/drivers' },
        ];
      case 'admin':
        return [
          { label: 'Users', link: '/users' },
          { label: 'Orders', link: '/orders' },
          { label: 'Deliveries', link: '/deliveries' },
        ];
      default:
        return [
          { label: 'Start Ordering', link: '/catalog' },
          { label: 'My Orders', link: '/orders' },
        ];
    }
  });

  ngOnInit(): void {
    const userId = this.authSession.user()?.id;

    // Health checks
    forkJoin({
      user: this.healthApi.checkUserService(),
      restaurant: this.healthApi.checkRestaurantService(),
      order: this.healthApi.checkOrderService(),
      delivery: this.healthApi.checkDeliveryService(),
    }).subscribe({
      next: (result) => this.statuses.set(Object.values(result).filter(Boolean) as HealthStatus[]),
      error: () => {}, // silent
    });

    this.restaurantsApi.findAll().subscribe({
      next: (restaurants) => this.restaurantCount.set(restaurants.length),
      error: () => {},
    });

    this.ordersApi.findAll().subscribe({
      next: (orders) => this.orderCount.set(orders.length),
      error: () => {},
    });

    if (this.role() === 'delivery_driver' && userId) {
      forkJoin({
        deliveries: this.deliveriesApi.findAll(),
        drivers: this.driversApi.findAll({ isAvailable: true }),
      }).subscribe({
        next: ({ deliveries, drivers }) => {
          this.deliveryCount.set(
            deliveries.filter((d) => d.driverId === userId).length,
          );
          this.onlineDriverCount.set(drivers.length);
        },
        error: () => {},
      });
      return;
    }

    this.deliveriesApi.findAll().subscribe({
      next: (deliveries) => this.deliveryCount.set(deliveries.length),
      error: () => {},
    });

    if (this.role() === 'admin') {
      this.usersApi.findAll({ limit: 500 }).subscribe({
        next: (users) => this.userCount.set(users.length),
        error: () => {},
      });
    }
  }
}

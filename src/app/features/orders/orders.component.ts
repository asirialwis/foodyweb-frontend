import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, of, switchMap } from 'rxjs';
import { OrdersApiService } from '../../core/api/orders-api.service';
import { RestaurantsApiService } from '../../core/api/restaurants-api.service';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { NotificationService } from '../../core/services/notification.service';
import { Order, OrderStatus, PaymentStatus } from '../../core/models/types';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss',
})
export class OrdersComponent implements OnInit {
  private readonly ordersApi = inject(OrdersApiService);
  private readonly restaurantsApi = inject(RestaurantsApiService);
  private readonly authSession = inject(AuthSessionService);
  private readonly notification = inject(NotificationService);

  statusFilter = '';
  readonly orders = signal<Order[]>([]);

  readonly role = computed(() => this.authSession.user()?.role ?? 'customer');

  readonly pageTitle = computed(() => {
    if (this.role() === 'restaurant_owner') {
      return 'Restaurant orders';
    }
    if (this.role() === 'delivery_driver') {
      return 'Delivery-linked orders';
    }
    if (this.role() === 'admin') {
      return 'All platform orders';
    }
    return 'Your orders';
  });

  readonly pageSubtitle = computed(() => {
    if (this.role() === 'restaurant_owner') {
      return 'Track incoming demand and update preparation states.';
    }
    if (this.role() === 'delivery_driver') {
      return 'View active orders related to your delivery work.';
    }
    if (this.role() === 'admin') {
      return 'Monitor all order activity across the platform.';
    }
    return 'Track status, payments, and delivery progress.';
  });

  ngOnInit(): void {
    this.loadOrders();
  }

  canCreateOrder(): boolean {
    return this.role() === 'customer' || this.role() === 'admin';
  }

  canManageStatus(): boolean {
    return this.role() === 'restaurant_owner' || this.role() === 'admin';
  }

  canManagePayment(): boolean {
    return this.role() === 'admin';
  }

  canCancel(order: Order): boolean {
    if (this.role() === 'customer') {
      return ['pending', 'confirmed', 'preparing'].includes(order.status ?? 'pending');
    }
    return this.role() === 'admin';
  }

  loadOrders(): void {
    const user = this.authSession.user();
    const role = this.role();
    const status = this.statusFilter ? (this.statusFilter as OrderStatus) : undefined;

    if (!user) {
      this.orders.set([]);
      return;
    }

    if (role === 'customer') {
      this.ordersApi
        .findAll({ userId: user.id, status, page: 1, limit: 100 })
        .subscribe((orders) => this.orders.set(orders));
      return;
    }

    if (role === 'restaurant_owner') {
      this.restaurantsApi
        .findAll()
        .pipe(
          switchMap((restaurants) => {
            const ownedIds = restaurants
              .filter((restaurant) => restaurant.ownerId === user.id)
              .map((restaurant) => restaurant._id ?? restaurant.id)
              .filter((id): id is string => !!id);

            if (!ownedIds.length) {
              return of([] as Order[]);
            }

            return forkJoin(
              ownedIds.map((restaurantId) =>
                this.ordersApi.findAll({
                  restaurantId,
                  status,
                  page: 1,
                  limit: 100,
                }),
              ),
            ).pipe(
              switchMap((orderGroups) => of(orderGroups.flat())),
            );
          }),
        )
        .subscribe((orders) => this.orders.set(orders));
      return;
    }

    this.ordersApi
      .findAll({ status, page: 1, limit: 200 })
      .subscribe((orders) => this.orders.set(orders));
  }

  updateStatus(order: Order, status: string): void {
    const id = order._id ?? order.id;
    if (!id) {
      return;
    }

    this.ordersApi.updateStatus(id, status as OrderStatus).subscribe(() => {
      this.notification.show({ type: 'success', text: 'Order status updated' });
      this.loadOrders();
    });
  }

  updatePayment(order: Order, payment: string): void {
    const id = order._id ?? order.id;
    if (!id) {
      return;
    }

    this.ordersApi.updatePaymentStatus(id, payment as PaymentStatus).subscribe(() => {
      this.notification.show({ type: 'success', text: 'Payment updated' });
      this.loadOrders();
    });
  }

  cancel(order: Order): void {
    const id = order._id ?? order.id;
    if (!id) {
      return;
    }

    this.ordersApi.cancel(id).subscribe(() => {
      this.notification.show({ type: 'info', text: 'Order cancelled' });
      this.loadOrders();
    });
  }
}

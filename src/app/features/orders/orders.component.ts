import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { OrdersApiService } from '../../core/api/orders-api.service';
import { RestaurantsApiService } from '../../core/api/restaurants-api.service';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { NotificationService } from '../../core/services/notification.service';
import { Order, OrderStatus, Restaurant } from '../../core/models/types';

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

  readonly ordersSignal = signal<Order[]>([]);
  readonly restaurantsMapSignal = signal<Record<string, string>>({});
  readonly loadingSignal = signal(false);
  readonly statusFilterSignal = signal<OrderStatus | ''>('');
  readonly sortBySignal = signal<'newest' | 'oldest' | 'status'>('newest');
  readonly selectedOrderSignal = signal<Order | null>(null);
  readonly showDetailsSignal = signal(false);
  readonly updatingOrderSignal = signal<string | null>(null);

  readonly role = computed(() => this.authSession.user()?.role ?? 'customer');
  readonly userId = computed(() => this.authSession.user()?.id ?? '');

  readonly pageTitle = computed(() => {
    switch (this.role()) {
      case 'restaurant_owner': return 'Restaurant Orders';
      case 'delivery_driver': return 'Delivery Orders';
      case 'admin': return 'All Orders';
      default: return 'My Orders';
    }
  });

  readonly pageSubtitle = computed(() => {
    switch (this.role()) {
      case 'restaurant_owner': return 'Track and manage incoming orders from all your restaurants';
      case 'delivery_driver': return 'View and track your deliveries';
      case 'admin': return 'Monitor all platform orders';
      default: return 'View your order history and track deliveries';
    }
  });

  readonly filteredOrders = computed(() => {
    let filtered = this.ordersSignal();

    if (this.statusFilterSignal()) {
      filtered = filtered.filter(o => o.status === this.statusFilterSignal());
    }

    const sorted = [...filtered];
    switch (this.sortBySignal()) {
      case 'oldest': return sorted.reverse();
      case 'status': return sorted.sort((a, b) => (a.status || '').localeCompare(b.status || ''));
      default: return sorted;
    }
  });

  readonly totalOrders = computed(() => this.ordersSignal().length);
  readonly deliveredOrders = computed(() =>
    this.ordersSignal().filter(o => o.status === 'delivered').length
  );
  readonly activeOrders = computed(() =>
    this.ordersSignal().filter(o => !['delivered', 'cancelled'].includes(o.status ?? 'pending')).length
  );
  readonly pendingOrders = computed(() =>
    this.ordersSignal().filter(o => o.status === 'pending').length
  );

  // ── Status helpers ─────────────────────────────────────────

  readonly statusBadgeClass = (status: OrderStatus | undefined): string => {
    const base = 'status-pill';
    switch (status ?? 'pending') {
      case 'pending': return `${base} pill-pending`;
      case 'confirmed': return `${base} pill-confirmed`;
      case 'preparing': return `${base} pill-preparing`;
      case 'ready': return `${base} pill-ready`;
      case 'picked_up': return `${base} pill-pickup`;
      case 'delivered': return `${base} pill-delivered`;
      case 'cancelled': return `${base} pill-cancelled`;
      default: return base;
    }
  };

  readonly statusIcon = (status: OrderStatus | undefined): string => {
    switch (status ?? 'pending') {
      case 'pending': return '⏳';
      case 'confirmed': return '✅';
      case 'preparing': return '👨‍🍳';
      case 'ready': return '📦';
      case 'picked_up': return '🚗';
      case 'delivered': return '🎉';
      case 'cancelled': return '❌';
      default: return '•';
    }
  };

  // ── Lifecycle ──────────────────────────────────────────────

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loadingSignal.set(true);
    const role = this.role();
    const userId = this.userId();

    if (role === 'restaurant_owner') {
      // First get restaurants owned by this user, then load orders for all of them
      this.restaurantsApi.findAll().subscribe({
        next: (restaurants) => {
          const owned = (restaurants as Restaurant[]).filter(r => r.ownerId === userId);
          if (owned.length === 0) {
            this.ordersSignal.set([]);
            this.loadingSignal.set(false);
            return;
          }

          // Build restaurant name map for display
          const map: Record<string, string> = {};
          owned.forEach(r => {
            const id = r._id ?? r.id;
            if (id) map[id] = r.name;
          });
          this.restaurantsMapSignal.set(map);

          // Load orders for all owned restaurants in parallel
          const orderRequests = owned
            .map(r => r._id ?? r.id)
            .filter((id): id is string => !!id)
            .map(id => this.ordersApi.findByRestaurantId(id));

          if (orderRequests.length === 0) {
            this.ordersSignal.set([]);
            this.loadingSignal.set(false);
            return;
          }

          forkJoin(orderRequests).subscribe({
            next: (results) => {
              const allOrders = results.flat().sort((a, b) =>
                new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
              );
              // Attach restaurant name to each order for display
              const enriched = allOrders.map(o => ({
                ...o,
                restaurantName: map[o.restaurantId] ?? o.restaurantId,
              }));
              this.ordersSignal.set(enriched);
              this.loadingSignal.set(false);
            },
            error: (err: any) => {
              this.notification.error('Failed to load orders', err?.error?.message);
              this.loadingSignal.set(false);
            },
          });
        },
        error: (err: any) => {
          this.notification.error('Failed to load restaurants', err?.error?.message);
          this.loadingSignal.set(false);
        },
      });
    } else if (role === 'admin') {
      this.ordersApi.findAll().subscribe({
        next: (orders) => { this.ordersSignal.set(orders); this.loadingSignal.set(false); },
        error: (err: any) => {
          this.notification.error('Failed to load orders', err?.error?.message);
          this.loadingSignal.set(false);
        },
      });
    } else {
      // Customer: use dedicated /orders/user/:userId endpoint
      const obs = userId
        ? this.ordersApi.findByUserId(userId)
        : this.ordersApi.findAll({ userId });
      obs.subscribe({
        next: (orders) => { this.ordersSignal.set(orders); this.loadingSignal.set(false); },
        error: (err: any) => {
          this.notification.error('Failed to load orders', err?.error?.message);
          this.loadingSignal.set(false);
        },
      });
    }
  }

  // ── Order actions ─────────────────────────────────────────

  selectOrder(order: Order): void {
    this.selectedOrderSignal.set(order);
    this.showDetailsSignal.set(true);
  }

  closeDetails(): void {
    this.showDetailsSignal.set(false);
    setTimeout(() => this.selectedOrderSignal.set(null), 300);
  }

  cancelOrder(order: Order): void {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    const orderId = order._id ?? order.id;
    if (!orderId) return;

    this.updatingOrderSignal.set(orderId);
    this.ordersApi.cancel(orderId).subscribe({
      next: () => {
        this.notification.success('Order cancelled', 'Your order has been cancelled');
        this.updatingOrderSignal.set(null);
        this.loadOrders();
        this.closeDetails();
      },
      error: (err: any) => {
        this.notification.error('Cannot cancel', err?.error?.message || 'This order cannot be cancelled');
        this.updatingOrderSignal.set(null);
      },
    });
  }

  updateOrderStatus(order: Order, newStatus: OrderStatus): void {
    const orderId = order._id ?? order.id;
    if (!orderId) return;

    this.updatingOrderSignal.set(orderId);
    this.ordersApi.updateStatus(orderId, newStatus).subscribe({
      next: () => {
        this.notification.success(
          `Order updated`,
          `Status changed to ${newStatus.replace('_', ' ')}`
        );
        this.updatingOrderSignal.set(null);
        this.loadOrders();
        this.closeDetails();
      },
      error: (err: any) => {
        this.notification.error('Status update failed', err?.error?.message);
        this.updatingOrderSignal.set(null);
      },
    });
  }

  // ── Permission helpers ─────────────────────────────────────

  canCreateOrder(): boolean {
    return ['customer', 'admin'].includes(this.role());
  }

  canManageStatus(): boolean {
    return ['restaurant_owner', 'admin'].includes(this.role());
  }

  canCancel(order: Order): boolean {
    if (this.role() === 'customer') {
      return ['pending', 'confirmed', 'preparing'].includes(order.status ?? 'pending');
    }
    return this.role() === 'admin';
  }

  getNextStatus(currentStatus: OrderStatus | undefined): OrderStatus | null {
    const flow: Record<string, OrderStatus> = {
      pending: 'confirmed',
      confirmed: 'preparing',
      preparing: 'ready',
    };
    return flow[currentStatus ?? ''] ?? null;
  }

  getNextStatusLabel(currentStatus: OrderStatus | undefined): string {
    const labels: Record<string, string> = {
      pending: '✅ Accept Order',
      confirmed: '👨‍🍳 Start Preparing',
      preparing: '📦 Mark Ready',
    };
    return labels[currentStatus ?? ''] ?? '';
  }

  canUpdateStatus(order: Order): boolean {
    return this.canManageStatus() && ['pending', 'confirmed', 'preparing'].includes(order.status ?? '');
  }

  rateOrder(order: Order): void {
    this.notification.info('Rating feature coming soon!');
  }

  // ── Formatting ────────────────────────────────────────────

  getOrderShortId(orderId?: string): string {
    if (!orderId) return '';
    return orderId.substring(Math.max(0, orderId.length - 8)).toUpperCase();
  }

  formatDeliveryAddress(address: any): string {
    if (!address) return 'Address unavailable';
    if (typeof address === 'string') return address;
    const { street, apartment, city, state, zipCode, country } = address;
    return [street, apartment, city, state, zipCode, country]
      .filter(Boolean).join(', ') || 'Address unavailable';
  }

  getRestaurantName(order: Order): string {
    return order.restaurantName ?? this.restaurantsMapSignal()[order.restaurantId] ?? '—';
  }

  getItemsPreview(order: Order): string {
    if (!order.items?.length) return '';
    const preview = order.items.slice(0, 2).map(i => `${i.name} ×${i.quantity}`).join(', ');
    const extra = order.items.length > 2 ? ` +${order.items.length - 2} more` : '';
    return preview + extra;
  }
}

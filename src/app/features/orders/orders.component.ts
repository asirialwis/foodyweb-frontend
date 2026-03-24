import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { OrdersApiService } from '../../core/api/orders-api.service';
import { RestaurantsApiService } from '../../core/api/restaurants-api.service';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { NotificationService } from '../../core/services/notification.service';
import { Order, OrderStatus } from '../../core/models/types';

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
  readonly loadingSignal = signal(false);
  readonly statusFilterSignal = signal<OrderStatus | ''>('');
  readonly sortBySignal = signal<'newest' | 'oldest' | 'status'>('newest');
  readonly selectedOrderSignal = signal<Order | null>(null);
  readonly showDetailsSignal = signal(false);

  readonly role = computed(() => this.authSession.user()?.role ?? 'customer');
  readonly userId = computed(() => this.authSession.user()?.id ?? '');

  readonly pageTitle = computed(() => {
    switch (this.role()) {
      case 'restaurant_owner':
        return 'Restaurant Orders';
      case 'delivery_driver':
        return 'Delivery Orders';
      case 'admin':
        return 'All Orders';
      default:
        return 'My Orders';
    }
  });

  readonly pageSubtitle = computed(() => {
    switch (this.role()) {
      case 'restaurant_owner':
        return 'Track and manage incoming orders';
      case 'delivery_driver':
        return 'View and track deliveries';
      case 'admin':
        return 'Monitor all platform orders';
      default:
        return 'View your order history and track deliveries';
    }
  });

  readonly filteredOrders = computed(() => {
    let filtered = this.ordersSignal();
    
    if (this.statusFilterSignal()) {
      filtered = filtered.filter(o => o.status === this.statusFilterSignal());
    }

    const sorted = [...filtered];
    switch (this.sortBySignal()) {
      case 'oldest':
        return sorted.reverse();
      case 'status':
        return sorted.sort((a, b) => (a.status || '').localeCompare(b.status || ''));
      case 'newest':
      default:
        return sorted;
    }
  });

  readonly totalOrders = computed(() => this.filteredOrders().length);
  readonly deliveredOrders = computed(() => 
    this.ordersSignal().filter(o => o.status === 'delivered').length
  );
  readonly activeOrders = computed(() => 
    this.ordersSignal().filter(o => !['delivered', 'cancelled'].includes(o.status ?? 'pending')).length
  );

  readonly statusBadgeClass = (status: OrderStatus | undefined): string => {
    const baseClass = 'px-3 py-1 rounded-full text-sm font-semibold';
    const safeStatus = status ?? 'pending';
    switch (safeStatus) {
      case 'pending':
        return `${baseClass} bg-yellow-100 text-yellow-800`;
      case 'confirmed':
        return `${baseClass} bg-blue-100 text-blue-800`;
      case 'preparing':
        return `${baseClass} bg-purple-100 text-purple-800`;
      case 'ready':
        return `${baseClass} bg-green-100 text-green-800`;
      case 'picked_up':
        return `${baseClass} bg-cyan-100 text-cyan-800`;
      case 'in_transit':
        return `${baseClass} bg-orange-100 text-orange-800`;
      case 'delivered':
        return `${baseClass} bg-green-100 text-green-800`;
      case 'cancelled':
        return `${baseClass} bg-red-100 text-red-800`;
      default:
        return baseClass;
    }
  };

  readonly statusIcon = (status: OrderStatus | undefined): string => {
    const safeStatus = status ?? 'pending';
    switch (safeStatus) {
      case 'pending': return '⏳';
      case 'confirmed': return '✓';
      case 'preparing': return '👨‍🍳';
      case 'ready': return '📦';
      case 'picked_up': return '🚗';
      case 'in_transit': return '🚚';
      case 'delivered': return '✅';
      case 'cancelled': return '❌';
      default: return '•';
    }
  };

  getOrderShortId(orderId?: string): string {
    if (!orderId) return '';
    return orderId.substring(Math.max(0, orderId.length - 8)).toUpperCase();
  }

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loadingSignal.set(true);
    this.ordersApi.getMyOrders().subscribe({
      next: (orders) => {
        this.ordersSignal.set(orders);
      },
      error: (err: any) => {
        this.notification.error('Failed to load orders', err?.error?.message);
        this.loadingSignal.set(false);
      },
      complete: () => {
        this.loadingSignal.set(false);
      },
    });
  }

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
    
    this.ordersApi.cancel(orderId).subscribe({
      next: () => {
        this.notification.success('Order cancelled', 'Your order has been cancelled');
        this.loadOrders();
        this.closeDetails();
      },
      error: (err: any) => {
        this.notification.error('Cannot cancel', err?.error?.message || 'This order cannot be cancelled');
      },
    });
  }

  canCreateOrder(): boolean {
    return this.role() === 'customer' || this.role() === 'admin';
  }

  canManageStatus(): boolean {
    return this.role() === 'restaurant_owner' || this.role() === 'admin';
  }

  canCancel(order: Order): boolean {
    if (this.role() === 'customer') {
      return ['pending', 'confirmed', 'preparing'].includes(order.status ?? 'pending');
    }
    return this.role() === 'admin';
  }

  rateOrder(order: Order): void {
    const rating = prompt('Rate this order (1-5 stars):', '5');
    if (!rating) return;
    
    const orderId = order._id ?? order.id;
    if (!orderId) return;
    
    const stars = parseInt(rating);
    if (isNaN(stars) || stars < 1 || stars > 5) {
      this.notification.error('Invalid rating', 'Please provide a rating between 1 and 5');
      return;
    }

    this.ordersApi.rateOrder(orderId, { rating: stars, comment: '' } as any).subscribe({
      next: () => {
        this.notification.success('Thank you!', 'Your rating has been recorded');
        this.loadOrders();
      },
      error: (err: any) => {
        this.notification.error('Failed to rate order', err?.error?.message);
      },
    });
  }
}

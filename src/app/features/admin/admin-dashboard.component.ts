import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { UsersApiService } from '../../core/api/users-api.service';
import { OrdersApiService } from '../../core/api/orders-api.service';
import { DeliveriesApiService } from '../../core/api/deliveries-api.service';
import { DriversApiService } from '../../core/api/drivers-api.service';
import { RestaurantsApiService } from '../../core/api/restaurants-api.service';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { NotificationService } from '../../core/services/notification.service';
import { User, Order, Delivery, Driver, Restaurant } from '../../core/models/types';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly usersApi = inject(UsersApiService);
  private readonly ordersApi = inject(OrdersApiService);
  private readonly deliveriesApi = inject(DeliveriesApiService);
  private readonly driversApi = inject(DriversApiService);
  private readonly restaurantsApi = inject(RestaurantsApiService);
  private readonly authSession = inject(AuthSessionService);
  private readonly notification = inject(NotificationService);

  readonly loadingSignal = signal(false);
  readonly savingSignal = signal(false);

  // Dashboard Data
  readonly usersSignal = signal<User[]>([]);
  readonly ordersSignal = signal<Order[]>([]);
  readonly deliveriesSignal = signal<Delivery[]>([]);
  readonly driversSignal = signal<Driver[]>([]);
  readonly restaurantsSignal = signal<Restaurant[]>([]);

  readonly dashboardStatsSignal = signal({
    totalUsers: 0,
    activeOrders: 0,
    totalRevenue: 0,
    avgDeliveryTime: 0,
    totalRestaurants: 0,
    totalDrivers: 0,
  });

  // UI State
  readonly activeTabSignal = signal<'overview' | 'users' | 'orders' | 'deliveries' | 'drivers' | 'restaurants'>('overview');
  readonly selectedUserSignal = signal<User | null>(null);
  readonly selectedOrderSignal = signal<Order | null>(null);
  readonly selectedDeliverySignal = signal<Delivery | null>(null);

  setActiveTab(tab: string): void {
    this.activeTabSignal.set(tab as 'overview' | 'users' | 'orders' | 'deliveries' | 'drivers' | 'restaurants');
  }

  readonly userSearchSignal = signal('');
  readonly orderStatusFilterSignal = signal<string>('all');
  readonly deliveryStatusFilterSignal = signal<string>('all');

  readonly filteredUsers = computed(() => {
    const search = this.userSearchSignal().toLowerCase();
    return this.usersSignal().filter(
      u => u.firstName?.toLowerCase().includes(search) ||
           u.lastName?.toLowerCase().includes(search) ||
           u.email?.toLowerCase().includes(search)
    );
  });

  readonly filteredOrders = computed(() => {
    const status = this.orderStatusFilterSignal();
    if (status === 'all') return this.ordersSignal();
    return this.ordersSignal().filter(o => o.status === status);
  });

  readonly filteredDeliveries = computed(() => {
    const status = this.deliveryStatusFilterSignal();
    if (status === 'all') return this.deliveriesSignal();
    return this.deliveriesSignal().filter(d => d.status === status);
  });

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    this.loadingSignal.set(true);

    Promise.all([
      this.loadUsers(),
      this.loadOrders(),
      this.loadDeliveries(),
      this.loadDrivers(),
      this.loadRestaurants(),
      this.loadStats(),
    ])
      .then(() => {
        this.loadingSignal.set(false);
      })
      .catch((err) => {
        console.error('Error loading dashboard data:', err);
        this.notification.error('Error', 'Failed to load dashboard data');
        this.loadingSignal.set(false);
      });
  }

  private loadUsers(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.usersApi.findAll({ limit: 500 }).subscribe({
        next: (users) => {
          this.usersSignal.set(users);
          resolve();
        },
        error: reject,
      });
    });
  }

  private loadOrders(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ordersApi.findAll().subscribe({
        next: (orders) => {
          this.ordersSignal.set(orders.slice(0, 50));
          resolve();
        },
        error: reject,
      });
    });
  }

  private loadDeliveries(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.deliveriesApi.findAll().subscribe({
        next: (deliveries) => {
          this.deliveriesSignal.set(deliveries.slice(0, 50));
          resolve();
        },
        error: reject,
      });
    });
  }

  private loadDrivers(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.driversApi.findAll().subscribe({
        next: (drivers) => {
          this.driversSignal.set(drivers);
          resolve();
        },
        error: reject,
      });
    });
  }

  private loadRestaurants(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.restaurantsApi.findAll().subscribe({
        next: (restaurants) => {
          this.restaurantsSignal.set(restaurants);
          resolve();
        },
        error: reject,
      });
    });
  }

  private loadStats(): Promise<void> {
    return new Promise((resolve) => {
      const orders = this.ordersSignal();
      const deliveries = this.deliveriesSignal();
      const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status || '')).length;
      const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      const avgDeliveryTime = deliveries.length > 0
        ? deliveries.reduce((sum, d) => sum + (d.estimatedDeliveryTime ? parseInt(d.estimatedDeliveryTime) : 0), 0) / deliveries.length
        : 0;

      this.dashboardStatsSignal.set({
        totalUsers: this.usersSignal().length,
        activeOrders,
        totalRevenue,
        avgDeliveryTime,
        totalRestaurants: this.restaurantsSignal().length,
        totalDrivers: this.driversSignal().length,
      });

      resolve();
    });
  }

  selectUser(user: User): void {
    this.selectedUserSignal.set(user);
  }

  selectOrder(order: Order): void {
    this.selectedOrderSignal.set(order);
  }

  selectDelivery(delivery: Delivery): void {
    this.selectedDeliverySignal.set(delivery);
  }

  closeModals(): void {
    this.selectedUserSignal.set(null);
    this.selectedOrderSignal.set(null);
    this.selectedDeliverySignal.set(null);
  }

  toggleUserVerification(user: User): void {
    if (!user.id) return;

    this.savingSignal.set(true);
    this.usersApi
      .update(user.id, { role: user.role })
      .subscribe({
        next: (updated) => {
          const users = this.usersSignal().map(u => (u.id === updated.id ? updated : u));
          this.usersSignal.set(users);
          this.notification.success('Success', `User updated`);
          this.savingSignal.set(false);
        },
        error: (err) => {
          console.error('Error updating user:', err);
          this.notification.error('Error', 'Failed to update user');
          this.savingSignal.set(false);
        },
      });
  }

  deleteUser(user: User): void {
    if (!user.id) return;
    if (!confirm(`Are you sure you want to delete ${user.firstName} ${user.lastName}?`)) return;

    this.savingSignal.set(true);
    this.usersApi
      .remove(user.id)
      .subscribe({
        next: () => {
          const users = this.usersSignal().filter(u => u.id !== user.id);
          this.usersSignal.set(users);
          this.notification.success('Success', 'User deleted');
          this.selectedUserSignal.set(null);
          this.savingSignal.set(false);
        },
        error: (err) => {
          console.error('Error deleting user:', err);
          this.notification.error('Error', 'Failed to delete user');
          this.savingSignal.set(false);
        },
      });
  }

  getStatusBadgeClass(status: string | undefined): string {
    const classes: Record<string, string> = {
      // Order statuses
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-purple-100 text-purple-800',
      ready: 'bg-green-100 text-green-800',
      picked_up: 'bg-cyan-100 text-cyan-800',
      in_transit: 'bg-orange-100 text-orange-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      // Delivery statuses
      assigned: 'bg-blue-100 text-blue-800',
      failed: 'bg-red-100 text-red-800',
      // Generic
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      verified: 'bg-green-100 text-green-800',
    };
    return classes[status || ''] || 'bg-gray-100 text-gray-800';
  }

  getStatusIcon(status: string | undefined): string {
    const icons: Record<string, string> = {
      pending: '⏳',
      confirmed: '✓',
      preparing: '👨‍🍳',
      ready: '📦',
      picked_up: '🚗',
      in_transit: '🚚',
      delivered: '✅',
      cancelled: '❌',
      assigned: '✓',
      failed: '❌',
      active: '✓',
      inactive: '❌',
      verified: '✅',
    };
    return icons[status || ''] || '•';
  }

  formatCurrency(value: number): string {
    return `$${value.toFixed(2)}`;
  }
}

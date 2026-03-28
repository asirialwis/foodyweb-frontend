import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { OrdersApiService } from '../../core/api/orders-api.service';
import { RestaurantsApiService } from '../../core/api/restaurants-api.service';
import { MenuItemsApiService } from '../../core/api/menu-items-api.service';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { NotificationService } from '../../core/services/notification.service';
import { Restaurant, MenuItem, Order, OrderStatus } from '../../core/models/types';

export type RestaurantTab = 'overview' | 'menu' | 'orders' | 'settings';

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
  private readonly menuItemsApi = inject(MenuItemsApiService);
  private readonly ordersApi = inject(OrdersApiService);
  private readonly authSession = inject(AuthSessionService);
  private readonly notification = inject(NotificationService);

  readonly restaurantsSignal = signal<Restaurant[]>([]);
  readonly menuItemsSignal = signal<MenuItem[]>([]);
  readonly ordersSignal = signal<Order[]>([]);
  readonly loadingSignal = signal(false);
  readonly savingSignal = signal(false);
  readonly updatingOrderSignal = signal<string | null>(null);
  readonly selectedRestaurantSignal = signal<Restaurant | null>(null);
  readonly activeTabSignal = signal<RestaurantTab>('overview');
  readonly showRestaurantFormSignal = signal(false);
  readonly showMenuFormSignal = signal(false);
  readonly editingMenuItemSignal = signal<MenuItem | null>(null);
  readonly ordersFilterSignal = signal<OrderStatus | ''>('');
  readonly loadingOrdersSignal = signal(false);

  readonly tabs: RestaurantTab[] = ['overview', 'menu', 'orders', 'settings'];

  readonly tabIcons: Record<RestaurantTab, string> = {
    overview: '📊',
    menu: '🍽️',
    orders: '📋',
    settings: '⚙️',
  };

  // ── computed dashboard stats ──────────────────────────────────────────────

  readonly stats = computed(() => {
    const restaurants = this.restaurantsSignal();
    const orders = this.ordersSignal();
    const activeRestaurant = this.selectedRestaurantSignal();

    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const revenue = orders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + (o.totalAmount ?? 0), 0);

    return {
      totalRestaurants: restaurants.length,
      totalMenuItems: this.menuItemsSignal().length,
      activeRestaurants: restaurants.filter(r => r.isActive).length,
      avgRating: restaurants.length > 0
        ? (restaurants.reduce((sum, r) => sum + (r.rating ?? 0), 0) / restaurants.length).toFixed(1)
        : '0.0',
      pendingOrders,
      revenue: revenue.toFixed(2),
    };
  });

  readonly orderStats = computed(() => {
    const orders = this.ordersSignal();
    return {
      pending: orders.filter(o => o.status === 'pending').length,
      confirmed: orders.filter(o => o.status === 'confirmed').length,
      preparing: orders.filter(o => o.status === 'preparing').length,
      ready: orders.filter(o => o.status === 'ready').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      total: orders.length,
      revenue: orders
        .filter(o => o.status === 'delivered')
        .reduce((sum, o) => sum + (o.totalAmount ?? 0), 0).toFixed(2),
    };
  });

  readonly filteredOrders = computed(() => {
    const filter = this.ordersFilterSignal();
    const orders = this.ordersSignal();
    if (!filter) return orders;
    return orders.filter(o => o.status === filter);
  });

  // ── Form definitions ──────────────────────────────────────────────────────

  readonly restaurantForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    cuisine: [[] as string[]],
    phone: ['', [Validators.required]],
    email: ['', [Validators.email]],
    street: ['', [Validators.required]],
    city: ['', [Validators.required]],
    state: ['', [Validators.required]],
    zipCode: ['', [Validators.required]],
    country: ['LK'],
    openHour: ['09:00'],
    closeHour: ['22:00'],
    imageUrl: [''],
  });

  readonly menuItemForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    price: [0, [Validators.required, Validators.min(0.01)]],
    category: ['', [Validators.required]],
    imageUrl: [''],
    isAvailable: [true],
  });

  readonly cuisineOptions = [
    'italian', 'chinese', 'indian', 'mexican', 'american',
    'japanese', 'thai', 'mediterranean', 'fusion', 'fast_food', 'vegetarian', 'sri_lankan',
  ];

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.loadRestaurants();
  }

  // ── Restaurant CRUD ───────────────────────────────────────────────────────

  loadRestaurants(): void {
    this.loadingSignal.set(true);
    const userId = this.authSession.user()?.id;

    this.restaurantsApi.findAll().subscribe({
      next: (restaurants) => {
        const owned = (restaurants as Restaurant[]).filter(r => r.ownerId === userId);
        this.restaurantsSignal.set(owned);
        this.loadingSignal.set(false);
      },
      error: (err: any) => {
        this.notification.error('Failed to load restaurants', err?.error?.message);
        this.loadingSignal.set(false);
      },
    });
  }

  selectRestaurant(restaurant: Restaurant): void {
    this.selectedRestaurantSignal.set(restaurant);
    this.activeTabSignal.set('overview');
    this.ordersSignal.set([]);
    this.menuItemsSignal.set([]);
    const id = this.getRestaurantId(restaurant);
    if (id) {
      this.loadMenuItems(id);
      this.loadOrdersForRestaurant(id);
    }
  }

  openCreateRestaurantForm(): void {
    this.restaurantForm.reset({
      name: '',
      description: '',
      cuisine: [],
      phone: '',
      email: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'LK',
      openHour: '09:00',
      closeHour: '22:00',
      imageUrl: '',
    });
    this.showRestaurantFormSignal.set(true);
  }

  openEditRestaurantForm(): void {
    const r = this.selectedRestaurantSignal();
    if (!r) return;
    this.restaurantForm.patchValue({
      name: r.name,
      description: r.description ?? '',
      cuisine: (r.cuisine as string[]) ?? [],
      phone: r.phone ?? '',
      email: r.email ?? '',
      street: r.address?.street ?? '',
      city: r.address?.city ?? '',
      state: r.address?.state ?? '',
      zipCode: r.address?.zipCode ?? '',
      country: r.address?.country ?? 'LK',
      openHour: r.openingHours?.open ?? '09:00',
      closeHour: r.openingHours?.close ?? '22:00',
      imageUrl: r.imageUrl ?? '',
    });
    this.showRestaurantFormSignal.set(true);
  }

  saveRestaurant(): void {
    if (this.restaurantForm.invalid) {
      this.restaurantForm.markAllAsTouched();
      return;
    }

    this.savingSignal.set(true);
    const v = this.restaurantForm.getRawValue();

    const payload: Partial<Restaurant> = {
      name: v.name,
      description: v.description,
      cuisine: (v.cuisine as string[]),
      phone: v.phone,
      email: v.email,
      address: {
        street: v.street,
        city: v.city,
        state: v.state,
        zipCode: v.zipCode,
        country: v.country,
      },
      openingHours: { open: v.openHour, close: v.closeHour },
      imageUrl: v.imageUrl || undefined,
      ownerId: this.selectedRestaurantSignal()?.ownerId ?? this.authSession.user()?.id ?? '',
    };

    const isEditing = !!this.selectedRestaurantSignal();

    if (isEditing) {
      const id = this.getRestaurantId(this.selectedRestaurantSignal()!);
      if (!id) return;
      this.restaurantsApi.update(id, payload).subscribe({
        next: (updated) => {
          this.notification.success('Restaurant updated', 'Your changes have been saved');
          this.selectedRestaurantSignal.set(updated);
          this.showRestaurantFormSignal.set(false);
          this.savingSignal.set(false);
          this.loadRestaurants();
        },
        error: (err: any) => {
          this.notification.error('Update failed', err?.error?.message);
          this.savingSignal.set(false);
        },
      });
    } else {
      this.restaurantsApi.create(payload as Restaurant).subscribe({
        next: () => {
          this.notification.success('Restaurant created!', 'Your restaurant is now listed');
          this.showRestaurantFormSignal.set(false);
          this.savingSignal.set(false);
          this.loadRestaurants();
        },
        error: (err: any) => {
          this.notification.error('Create failed', err?.error?.message);
          this.savingSignal.set(false);
        },
      });
    }
  }

  toggleRestaurantActive(restaurant: Restaurant): void {
    const id = this.getRestaurantId(restaurant);
    if (!id) return;
    const newActive = !restaurant.isActive;
    this.restaurantsApi.update(id, { isActive: newActive }).subscribe({
      next: () => {
        this.notification.success(
          newActive ? 'Restaurant activated' : 'Restaurant deactivated',
          ''
        );
        this.loadRestaurants();
      },
      error: (err: any) => this.notification.error('Failed to update', err?.error?.message),
    });
  }

  deleteRestaurant(): void {
    const restaurant = this.selectedRestaurantSignal();
    if (!restaurant) return;
    if (!confirm(`Are you sure you want to delete "${restaurant.name}"? This action cannot be undone.`)) return;

    const id = this.getRestaurantId(restaurant);
    if (!id) return;

    this.restaurantsApi.remove(id).subscribe({
      next: () => {
        this.notification.success('Restaurant deleted', '');
        this.selectedRestaurantSignal.set(null);
        this.loadRestaurants();
      },
      error: (err: any) => this.notification.error('Delete failed', err?.error?.message),
    });
  }

  // ── Menu CRUD ─────────────────────────────────────────────────────────────

  loadMenuItems(restaurantId: string): void {
    this.menuItemsApi.findByRestaurantId(restaurantId).subscribe({
      next: (items) => this.menuItemsSignal.set(items),
      error: (err: any) => this.notification.error('Failed to load menu', err?.error?.message),
    });
  }

  openAddMenuItemForm(): void {
    this.editingMenuItemSignal.set(null);
    this.menuItemForm.reset({
      name: '',
      description: '',
      price: 0,
      category: '',
      imageUrl: '',
      isAvailable: true,
    });
    this.showMenuFormSignal.set(true);
  }

  editMenuItem(item: MenuItem): void {
    this.editingMenuItemSignal.set(item);
    this.menuItemForm.patchValue({
      name: item.name,
      description: item.description ?? '',
      price: item.price,
      category: item.category,
      imageUrl: item.imageUrl ?? '',
      isAvailable: item.isAvailable !== false,
    });
    this.showMenuFormSignal.set(true);
  }

  saveMenuItem(): void {
    if (this.menuItemForm.invalid || !this.selectedRestaurantSignal()) return;

    this.savingSignal.set(true);
    const v = this.menuItemForm.getRawValue();
    const restaurantId = this.getRestaurantId(this.selectedRestaurantSignal()!);
    if (!restaurantId) return;

    const payload: Partial<MenuItem> = {
      ...v,
      restaurantId,
      price: Number(v.price),
    };

    const editing = this.editingMenuItemSignal();
    if (editing) {
      const itemId = editing._id ?? editing.id;
      if (!itemId) return;
      this.menuItemsApi.update(itemId, payload).subscribe({
        next: () => {
          this.notification.success('Menu item updated', '');
          this.showMenuFormSignal.set(false);
          this.editingMenuItemSignal.set(null);
          this.savingSignal.set(false);
          this.loadMenuItems(restaurantId);
        },
        error: (err: any) => {
          this.notification.error('Update failed', err?.error?.message);
          this.savingSignal.set(false);
        },
      });
    } else {
      this.menuItemsApi.create(payload as MenuItem).subscribe({
        next: () => {
          this.notification.success('Menu item added!', '');
          this.showMenuFormSignal.set(false);
          this.savingSignal.set(false);
          this.loadMenuItems(restaurantId);
        },
        error: (err: any) => {
          this.notification.error('Create failed', err?.error?.message);
          this.savingSignal.set(false);
        },
      });
    }
  }

  toggleMenuItemAvailability(item: MenuItem): void {
    const id = item._id ?? item.id;
    if (!id) return;
    this.menuItemsApi.update(id, { isAvailable: !item.isAvailable }).subscribe({
      next: () => {
        const restaurantId = this.getRestaurantId(this.selectedRestaurantSignal()!);
        if (restaurantId) this.loadMenuItems(restaurantId);
      },
      error: (err: any) => this.notification.error('Failed', err?.error?.message),
    });
  }

  deleteMenuItem(item: MenuItem): void {
    const id = item._id ?? item.id;
    if (!id || !confirm(`Delete "${item.name}"?`)) return;

    this.menuItemsApi.remove(id).subscribe({
      next: () => {
        this.notification.success('Item deleted', '');
        const restaurantId = this.getRestaurantId(this.selectedRestaurantSignal()!);
        if (restaurantId) this.loadMenuItems(restaurantId);
      },
      error: (err: any) => this.notification.error('Delete failed', err?.error?.message),
    });
  }

  // ── Order Management ──────────────────────────────────────────────────────

  loadOrdersForRestaurant(restaurantId: string): void {
    this.loadingOrdersSignal.set(true);
    this.ordersApi.findByRestaurantId(restaurantId).subscribe({
      next: (orders) => {
        this.ordersSignal.set(orders);
        this.loadingOrdersSignal.set(false);
      },
      error: (err: any) => {
        this.notification.error('Failed to load orders', err?.error?.message);
        this.loadingOrdersSignal.set(false);
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
          `Order ${this.getShortId(orderId)} updated`,
          `Status: ${newStatus.replace('_', ' ').toUpperCase()}`
        );
        this.updatingOrderSignal.set(null);
        const restaurantId = this.getRestaurantId(this.selectedRestaurantSignal()!);
        if (restaurantId) this.loadOrdersForRestaurant(restaurantId);
      },
      error: (err: any) => {
        this.notification.error('Status update failed', err?.error?.message);
        this.updatingOrderSignal.set(null);
      },
    });
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
      pending: 'Accept Order',
      confirmed: 'Start Preparing',
      preparing: 'Mark Ready',
    };
    return labels[currentStatus ?? ''] ?? '';
  }

  canUpdateStatus(order: Order): boolean {
    return ['pending', 'confirmed', 'preparing'].includes(order.status ?? '');
  }

  // ── Cuisine toggle ────────────────────────────────────────────────────────

  toggleCuisine(cuisine: string): void {
    const current: string[] = this.restaurantForm.get('cuisine')?.value ?? [];
    if (current.includes(cuisine)) {
      this.restaurantForm.patchValue({ cuisine: current.filter(c => c !== cuisine) });
    } else {
      this.restaurantForm.patchValue({ cuisine: [...current, cuisine] });
    }
  }

  isCuisineSelected(cuisine: string): boolean {
    return (this.restaurantForm.get('cuisine')?.value ?? []).includes(cuisine);
  }

  // ── UI helpers ────────────────────────────────────────────────────────────

  setTab(tab: RestaurantTab): void {
    this.activeTabSignal.set(tab);
    if (tab === 'orders') {
      const id = this.getRestaurantId(this.selectedRestaurantSignal()!);
      if (id) this.loadOrdersForRestaurant(id);
    }
  }

  goBack(): void {
    this.selectedRestaurantSignal.set(null);
    this.ordersSignal.set([]);
    this.menuItemsSignal.set([]);
  }

  getRestaurantId(restaurant: Restaurant): string | undefined {
    return restaurant?._id ?? restaurant?.id;
  }

  getShortId(id: string = ''): string {
    return '#' + id.slice(-6).toUpperCase();
  }

  getOrderStatusClass(status: OrderStatus | undefined): string {
    const map: Record<string, string> = {
      pending: 'status-pending',
      confirmed: 'status-confirmed',
      preparing: 'status-preparing',
      ready: 'status-ready',
      picked_up: 'status-pickup',
      delivered: 'status-delivered',
      cancelled: 'status-cancelled',
    };
    return map[status ?? ''] ?? 'status-pending';
  }

  getOrderStatusIcon(status: OrderStatus | undefined): string {
    const map: Record<string, string> = {
      pending: '⏳',
      confirmed: '✅',
      preparing: '👨‍🍳',
      ready: '📦',
      picked_up: '🚗',
      delivered: '🎉',
      cancelled: '❌',
    };
    return map[status ?? ''] ?? '•';
  }

  getMenuItemsByCategory(): Record<string, MenuItem[]> {
    const items = this.menuItemsSignal();
    return items.reduce((acc, item) => {
      const cat = item.category || 'Other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {} as Record<string, MenuItem[]>);
  }

  getCategories(): string[] {
    return Object.keys(this.getMenuItemsByCategory());
  }

  formatAddress(restaurant: Restaurant): string {
    const a = restaurant.address;
    if (!a) return 'No address set';
    return [a.street, a.city, a.state, a.zipCode, a.country].filter(Boolean).join(', ');
  }

  formatOrderItems(order: Order): string {
    if (!order.items?.length) return 'No items';
    return order.items.slice(0, 2).map(i => `${i.name} x${i.quantity}`).join(', ')
      + (order.items.length > 2 ? ` +${order.items.length - 2} more` : '');
  }
}

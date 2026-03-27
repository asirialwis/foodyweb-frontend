import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MenuItemsApiService } from '../../core/api/menu-items-api.service';
import { OrdersApiService } from '../../core/api/orders-api.service';
import { CreateOrderPayload } from '../../core/api/orders-api.service';
import { RestaurantsApiService } from '../../core/api/restaurants-api.service';
import { CartService } from '../../core/services/cart.service';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { NotificationService } from '../../core/services/notification.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { RestaurantCardComponent } from '../../shared/components/restaurant-card.component';
import { MenuItemCardComponent } from '../../shared/components/menu-item-card.component';
import { MenuItem, Restaurant, CuisineType } from '../../core/models/types';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LoadingSpinnerComponent,
    RestaurantCardComponent,
    MenuItemCardComponent,
  ],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.scss',
})
export class CatalogComponent implements OnInit {
  private readonly restaurantsApi = inject(RestaurantsApiService);
  private readonly menuItemsApi = inject(MenuItemsApiService);
  private readonly ordersApi = inject(OrdersApiService);
  private readonly authSession = inject(AuthSessionService);
  private readonly notification = inject(NotificationService);
  private readonly cartService = inject(CartService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Signals
  private readonly restaurantsLoadingSignal = signal(false);
  private readonly menuItemsLoadingSignal = signal(false);
  readonly topRatedSignal = signal<Restaurant[]>([]);
  private readonly searchQuerySignal = signal('');
  readonly selectedCuisineSignal = signal<CuisineType | ''>('');
  readonly sortBySignal = signal<'rating' | 'distance' | 'deliveryTime' | 'newest'>('rating');
  readonly selectedCategorySignal = signal<string>('');

  readonly restaurants = signal<Restaurant[]>([]);
  readonly selectedRestaurant = signal<Restaurant | null>(null);
  readonly menuItems = signal<MenuItem[]>([]);
  readonly filteredMenuItems = computed(() => {
    const items = this.menuItems();
    const category = this.selectedCategorySignal();
    
    if (!category) return items;
    return items.filter(item => item.category === category);
  });

  readonly categories = computed(() => {
    const items = this.menuItems();
    const cats = new Set(items.map(item => item.category));
    return Array.from(cats);
  });

  readonly cartItems = this.cartService.items;
  readonly cartTotal = this.cartService.total;
  readonly cartCount = this.cartService.count;
  readonly subtotal = computed(() => Number(this.cartService.subtotal().toFixed(2)));
  readonly tax = computed(() => Number(this.cartService.tax().toFixed(2)));
  readonly deliveryFee = computed(() => this.cartService.deliveryFee());

  /** Derive restaurantId from cart items (survives page refresh) */
  readonly cartRestaurantId = computed(() => {
    const items = this.cartItems();
    return items.length > 0 ? items[0].restaurantId : null;
  });

  readonly restaurantsLoading = this.restaurantsLoadingSignal.asReadonly();
  readonly menuItemsLoading = this.menuItemsLoadingSignal.asReadonly();

  showCheckoutModal = signal(false);
  placingOrder = false;

  readonly cuisines: CuisineType[] = [
    'italian', 'chinese', 'indian', 'mexican', 'american',
    'japanese', 'thai', 'mediterranean', 'fusion', 'fast_food', 'vegetarian'
  ];

  readonly checkoutForm = this.fb.nonNullable.group({
    street: ['', Validators.required],
    apartment: [''],
    city: ['', Validators.required],
    state: ['', Validators.required],
    zipCode: ['', Validators.required],
    country: ['', Validators.required],
    paymentMethod: ['credit_card', Validators.required],
    specialInstructions: [''],
  });

  ngOnInit(): void {
    this.loadTopRated();
    this.loadRestaurants();
    
    // Check if restaurant ID is in route params
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.loadRestaurantMenu(params['id']);
      }
    });
  }

  loadTopRated(): void {
    this.restaurantsApi.findAll({ isActive: true }).subscribe({
      next: (restaurants) => {
        // Sort by rating descending and take top 4
        const sorted = [...restaurants].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        this.topRatedSignal.set(sorted.slice(0, 4));
      },
      error: (err) => console.error('Failed to load top rated', err),
    });
  }

  loadRestaurants(): void {
    this.restaurantsLoadingSignal.set(true);
    const query = this.searchQuerySignal().trim();
    const cuisine = this.selectedCuisineSignal();

    const filters: { cuisine?: string; isActive: boolean } = {
      isActive: true,
    };
    if (cuisine) filters.cuisine = cuisine;

    this.restaurantsApi.findAll(filters).subscribe({
      next: (restaurants) => {
        let result = restaurants;
        // Client-side search filter (backend doesn't have search endpoint)
        if (query) {
          const q = query.toLowerCase();
          result = result.filter(
            (r) =>
              r.name?.toLowerCase().includes(q) ||
              r.description?.toLowerCase().includes(q) ||
              r.cuisine?.some((c) => c.toLowerCase().includes(q)),
          );
        }
        this.restaurants.set(result);
      },
      error: (err) => {
        console.error('Failed to load restaurants', err);
        this.notification.error('Failed to load restaurants');
      },
      complete: () => this.restaurantsLoadingSignal.set(false),
    });
  }

  loadRestaurantMenu(restaurantId: string): void {
    this.menuItemsLoadingSignal.set(true);
    this.menuItemsApi.findByRestaurantId(restaurantId).subscribe({
      next: (items) => {
        this.menuItems.set(items.filter((item) => item.isAvailable !== false));
      },
      error: (err) => {
        console.error('Failed to load menu items', err);
        this.notification.error('Failed to load menu items');
      },
      complete: () => this.menuItemsLoadingSignal.set(false),
    });
  }

  selectRestaurant(restaurant: Restaurant): void {
    this.selectedRestaurant.set(restaurant);
    const restaurantId = restaurant._id ?? restaurant.id;
    if (restaurantId) {
      this.loadRestaurantMenu(restaurantId);
      this.selectedCategorySignal.set('');
      // Apply delivery fee from restaurant to cart
      this.cartService.setDeliveryFee(restaurant.deliveryFee ?? 0);
    }
  }

  addToCart(item: MenuItem): void {
    const selectedRestaurantId = this.selectedRestaurant()?._id ?? this.selectedRestaurant()?.id;

    if (!selectedRestaurantId) {
      this.notification.error('Please select a restaurant first');
      return;
    }

    const existingRestaurantIds = new Set(this.cartItems().map((cartItem) => cartItem.restaurantId));
    if (existingRestaurantIds.size > 0 && !existingRestaurantIds.has(selectedRestaurantId)) {
      this.notification.error('Cart can contain items from one restaurant at a time');
      return;
    }

    this.cartService.addItem({ ...item, restaurantId: selectedRestaurantId });
    this.notification.success(`${item.name} added to cart`);
  }

  increase(menuItemId: string): void {
    this.cartService.increase(menuItemId);
  }

  decrease(menuItemId: string): void {
    this.cartService.decrease(menuItemId);
  }

  removeFromCart(menuItemId: string): void {
    this.cartService.remove(menuItemId);
    this.notification.info('Item removed from cart');
  }

  onSearchChange(query: string): void {
    this.searchQuerySignal.set(query);
    // Debounce search
    setTimeout(() => {
      if (this.searchQuerySignal() === query) {
        this.loadRestaurants();
      }
    }, 500);
  }

  onCuisineChange(cuisine: CuisineType | ''): void {
    this.selectedCuisineSignal.set(cuisine);
    this.loadRestaurants();
  }

  onSortChange(sortBy: 'rating' | 'distance' | 'deliveryTime' | 'newest'): void {
    this.sortBySignal.set(sortBy);
    this.loadRestaurants();
  }

  selectCategory(category: string): void {
    this.selectedCategorySignal.set(this.selectedCategorySignal() === category ? '' : category);
  }

  canCheckout(): boolean {
    return this.cartItems().length > 0
      && this.checkoutForm.valid
      && !!(this.cartRestaurantId() || this.selectedRestaurant());
  }

  openCheckout(): void {
    if (this.cartItems().length === 0) {
      this.notification.warning('Your cart is empty');
      return;
    }
    if (!this.authSession.isAuthenticated()) {
      this.notification.warning('Please log in to place an order');
      this.router.navigate(['/login']);
      return;
    }
    this.showCheckoutModal.set(true);
  }

  closeCheckout(): void {
    this.showCheckoutModal.set(false);
  }

  checkout(): void {
    if (!this.canCheckout() || this.placingOrder) {
      return;
    }

    const userId = this.authSession.user()?.id;
    // Derive restaurantId from cart items (resilient to page refresh)
    const restaurantId = this.cartRestaurantId()
      ?? this.selectedRestaurant()?._id
      ?? this.selectedRestaurant()?.id;

    if (!userId || !restaurantId) {
      this.notification.error('Unable to place order. Please try again.');
      return;
    }

    const payload = this.checkoutForm.getRawValue();

    const orderPayload: CreateOrderPayload = {
      userId,
      restaurantId,
      items: this.cartItems().map((item) => ({
        menuItemId: item.menuItemId,
        name: item.name,
        quantity: item.quantity,
        price: item.discountPrice && item.discountPrice < item.price
          ? item.discountPrice
          : item.price,
      })),
      totalAmount: this.cartTotal(),
      paymentMethod: payload.paymentMethod,
      deliveryAddress: {
        street: payload.street,
        city: payload.city,
        state: payload.state,
        zipCode: payload.zipCode,
        country: payload.country,
      },
      specialInstructions: payload.specialInstructions || undefined,
    };

    this.placingOrder = true;
    this.ordersApi
      .create(orderPayload)
      .subscribe({
        next: () => {
          this.notification.success('Order placed successfully!');
          this.cartService.clear();
          this.checkoutForm.reset({ paymentMethod: 'credit_card' });
          this.showCheckoutModal.set(false);
          this.router.navigate(['/orders']);
        },
        error: (err) => {
          console.error('Could not place order', err);
          this.notification.error('Could not place order. Please try again.');
        },
        complete: () => {
          this.placingOrder = false;
        },
      });
  }

  clearCart(): void {
    if (confirm('Are you sure you want to clear your cart?')) {
      this.cartService.clear();
      this.notification.info('Cart cleared');
    }
  }

  formatAddress(restaurant: Restaurant | null): string {
    if (!restaurant?.address) return 'Address unavailable';
    const { street, city, state, country } = restaurant.address;
    return [street, city, state, country].filter(Boolean).join(', ') || 'Address unavailable';
  }
}

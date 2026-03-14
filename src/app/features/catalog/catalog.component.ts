import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MenuItemsApiService } from '../../core/api/menu-items-api.service';
import { OrdersApiService } from '../../core/api/orders-api.service';
import { RestaurantsApiService } from '../../core/api/restaurants-api.service';
import { CartService } from '../../core/services/cart.service';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { NotificationService } from '../../core/services/notification.service';
import { MenuItem, Restaurant } from '../../core/models/types';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
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

  cuisine = '';
  placingOrder = false;

  readonly restaurants = signal<Restaurant[]>([]);
  readonly selectedRestaurant = signal<Restaurant | null>(null);
  readonly menuItems = signal<MenuItem[]>([]);

  readonly cartItems = this.cartService.items;
  readonly subtotal = computed(() => Number(this.cartService.subtotal().toFixed(2)));

  readonly checkoutForm = this.fb.nonNullable.group({
    street: ['', Validators.required],
    city: ['', Validators.required],
    state: ['', Validators.required],
    zipCode: ['', Validators.required],
    country: ['', Validators.required],
    paymentMethod: ['credit_card', Validators.required],
    specialInstructions: [''],
  });

  ngOnInit(): void {
    this.loadRestaurants();
  }

  loadRestaurants(): void {
    const cuisine = this.cuisine.trim();
    this.restaurantsApi
      .findAll({ cuisine: cuisine || undefined, isActive: true })
      .subscribe((restaurants) => this.restaurants.set(restaurants));
  }

  selectRestaurant(restaurant: Restaurant): void {
    const selectedId = restaurant._id ?? restaurant.id;
    if (!selectedId) {
      return;
    }

    this.selectedRestaurant.set(restaurant);
    this.menuItemsApi.findByRestaurantId(selectedId).subscribe((items) => {
      this.menuItems.set(items.filter((item) => item.isAvailable !== false));
    });
  }

  addToCart(item: MenuItem): void {
    const selectedRestaurantId = this.selectedRestaurant()?._id ?? this.selectedRestaurant()?.id;

    if (!selectedRestaurantId) {
      this.notification.show({ type: 'error', text: 'Select a restaurant first' });
      return;
    }

    const existingRestaurantIds = new Set(this.cartItems().map((cartItem) => cartItem.restaurantId));
    if (existingRestaurantIds.size > 0 && !existingRestaurantIds.has(selectedRestaurantId)) {
      this.notification.show({
        type: 'error',
        text: 'Cart can contain items from one restaurant at a time',
      });
      return;
    }

    this.cartService.addItem({ ...item, restaurantId: selectedRestaurantId });
    this.notification.show({ type: 'success', text: `${item.name} added to cart` });
  }

  increase(menuItemId: string): void {
    this.cartService.increase(menuItemId);
  }

  decrease(menuItemId: string): void {
    this.cartService.decrease(menuItemId);
  }

  canCheckout(): boolean {
    return this.cartItems().length > 0 && this.checkoutForm.valid;
  }

  checkout(): void {
    if (!this.canCheckout() || this.placingOrder) {
      return;
    }

    const userId = this.authSession.user()?.id;
    const restaurantId = this.selectedRestaurant()?._id ?? this.selectedRestaurant()?.id;

    if (!userId || !restaurantId) {
      this.notification.show({ type: 'error', text: 'Unable to place order. Please try again.' });
      return;
    }

    const payload = this.checkoutForm.getRawValue();

    this.placingOrder = true;
    this.ordersApi
      .create({
        userId,
        restaurantId,
        items: this.cartItems().map((item) => ({
          menuItemId: item.menuItemId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        totalAmount: this.subtotal(),
        paymentMethod: payload.paymentMethod,
        deliveryAddress: {
          street: payload.street,
          city: payload.city,
          state: payload.state,
          zipCode: payload.zipCode,
          country: payload.country,
        },
        specialInstructions: payload.specialInstructions || undefined,
      } as never)
      .subscribe({
        next: () => {
          this.notification.show({ type: 'success', text: 'Order placed successfully' });
          this.cartService.clear();
          this.checkoutForm.patchValue({ specialInstructions: '' });
          this.router.navigateByUrl('/orders');
        },
        error: () => {
          this.notification.show({ type: 'error', text: 'Could not place order' });
          this.placingOrder = false;
        },
        complete: () => {
          this.placingOrder = false;
        },
      });
  }

  formatAddress(restaurant: Restaurant): string {
    const address = restaurant.address;
    if (!address) {
      return 'Address unavailable';
    }

    return [address.city, address.state, address.country].filter(Boolean).join(', ') || 'Address unavailable';
  }
}

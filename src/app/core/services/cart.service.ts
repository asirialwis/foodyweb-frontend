import { Injectable, computed, signal, effect } from '@angular/core';
import { CartItem, MenuItem } from '../models/types';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly STORAGE_KEY = 'foodyweb_cart';
  private readonly cartItemsSignal = signal<CartItem[]>(this.loadFromStorage());

  readonly items = this.cartItemsSignal.asReadonly();
  
  readonly count = computed(() =>
    this.cartItemsSignal().reduce((total, item) => total + item.quantity, 0),
  );
  
  readonly subtotal = computed(() =>
    this.cartItemsSignal().reduce((total, item) => {
      const price = item.discountPrice || item.price;
      return total + (price * item.quantity);
    }, 0),
  );

  readonly taxRate = 0.1; // 10% tax
  
  readonly tax = computed(() => {
    return Math.round(this.subtotal() * this.taxRate * 100) / 100;
  });

  readonly deliveryFee = signal<number>(0);

  readonly discount = signal<number>(0);

  readonly total = computed(() => {
    return this.subtotal() + this.tax() + this.deliveryFee() - this.discount();
  });

  readonly isEmpty = computed(() => this.cartItemsSignal().length === 0);

  readonly uniqueRestaurants = computed(() => {
    const restaurants = new Set(this.cartItemsSignal().map(item => item.restaurantId));
    return restaurants.size;
  });

  constructor() {
    // Persist to localStorage whenever cart changes
    effect(() => {
      const items = this.cartItemsSignal();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    });
  }

  private loadFromStorage(): CartItem[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  addItem(menuItem: MenuItem): void {
    const menuItemId = menuItem._id ?? menuItem.id;
    if (!menuItemId) {
      return;
    }

    // Check if adding item from different restaurant
    const existing = this.cartItemsSignal();
    if (existing.length > 0 && existing[0].restaurantId !== menuItem.restaurantId) {
      // Optionally clear cart when switching restaurants
      // For now, allow multi-restaurant items but track warning
      console.warn('Items from different restaurants in cart');
    }

    this.cartItemsSignal.update((items) => {
      const existingItem = items.find((item) => item.menuItemId === menuItemId);
      if (existingItem) {
        return items.map((item) =>
          item.menuItemId === menuItemId
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [
        ...items,
        {
          menuItemId,
          name: menuItem.name,
          price: menuItem.price,
          discountPrice: menuItem.discountPrice,
          quantity: 1,
          restaurantId: menuItem.restaurantId,
          imageUrl: menuItem.imageUrl,
        },
      ];
    });
  }

  updateItem(menuItemId: string, quantity: number): void {
    if (quantity <= 0) {
      this.remove(menuItemId);
      return;
    }

    this.cartItemsSignal.update((items) =>
      items.map((item) =>
        item.menuItemId === menuItemId
          ? { ...item, quantity }
          : item,
      ),
    );
  }

  increase(menuItemId: string): void {
    this.cartItemsSignal.update((items) =>
      items.map((item) =>
        item.menuItemId === menuItemId
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      ),
    );
  }

  decrease(menuItemId: string): void {
    this.cartItemsSignal.update((items) =>
      items
        .map((item) =>
          item.menuItemId === menuItemId
            ? { ...item, quantity: Math.max(0, item.quantity - 1) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  remove(menuItemId: string): void {
    this.cartItemsSignal.update((items) =>
      items.filter((item) => item.menuItemId !== menuItemId),
    );
  }

  clear(): void {
    this.cartItemsSignal.set([]);
    this.discount.set(0);
    this.deliveryFee.set(0);
  }

  setDeliveryFee(fee: number): void {
    this.deliveryFee.set(Math.max(0, fee));
  }

  applyDiscount(discountAmount: number): void {
    this.discount.set(Math.min(discountAmount, this.subtotal()));
  }

  getCartSummary() {
    return {
      items: this.items(),
      subtotal: this.subtotal(),
      tax: this.tax(),
      deliveryFee: this.deliveryFee(),
      discount: this.discount(),
      total: this.total(),
      itemCount: this.count(),
    };
  }
}

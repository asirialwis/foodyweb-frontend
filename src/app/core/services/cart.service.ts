import { Injectable, computed, signal } from '@angular/core';
import { CartItem, MenuItem } from '../models/types';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly cartItemsSignal = signal<CartItem[]>([]);

  readonly items = this.cartItemsSignal.asReadonly();
  readonly count = computed(() =>
    this.cartItemsSignal().reduce((total, item) => total + item.quantity, 0),
  );
  readonly subtotal = computed(() =>
    this.cartItemsSignal().reduce((total, item) => total + item.quantity * item.price, 0),
  );

  addItem(menuItem: MenuItem): void {
    const menuItemId = menuItem._id ?? menuItem.id;
    if (!menuItemId) {
      return;
    }

    this.cartItemsSignal.update((items) => {
      const existing = items.find((item) => item.menuItemId === menuItemId);
      if (existing) {
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
          quantity: 1,
          restaurantId: menuItem.restaurantId,
          imageUrl: menuItem.imageUrl,
        },
      ];
    });
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
            ? { ...item, quantity: item.quantity - 1 }
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
  }
}

import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RestaurantsApiService } from '../../core/api/restaurants-api.service';
import { MenuItemsApiService } from '../../core/api/menu-items-api.service';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { NotificationService } from '../../core/services/notification.service';
import { Restaurant, MenuItem, CuisineType, DietaryRestriction } from '../../core/models/types';

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
  private readonly authSession = inject(AuthSessionService);
  private readonly notification = inject(NotificationService);

  readonly restaurantsSignal = signal<Restaurant[]>([]);
  readonly menuItemsSignal = signal<MenuItem[]>([]);
  readonly loadingSignal = signal(false);
  readonly savingSignal = signal(false);
  readonly selectedRestaurantSignal = signal<Restaurant | null>(null);
  readonly activeTabSignal = signal<'overview' | 'menu' | 'orders' | 'settings'>('overview');
  readonly showRestaurantFormSignal = signal(false);
  readonly showMenuFormSignal = signal(false);
  readonly editingMenuItemSignal = signal<MenuItem | null>(null);

  readonly tabs = ['overview', 'menu', 'orders', 'settings'] as const;

  readonly cuisines: CuisineType[] = [
    'italian', 'chinese', 'indian', 'mexican', 'american', 
    'japanese', 'thai', 'mediterranean', 'fusion', 'fast_food', 'vegetarian'
  ];

  readonly dietaryRestrictions: DietaryRestriction[] = [
    'vegan', 'vegetarian', 'gluten_free', 'keto', 'halal', 'kosher'
  ];

  readonly restaurantForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    cuisines: [[] as CuisineType[], [Validators.required]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    email: ['', [Validators.required, Validators.email]],
    address: ['', [Validators.required]],
    city: ['', [Validators.required]],
    state: ['', [Validators.required]],
    zipCode: ['', [Validators.required]],
    deliveryTime: [30, [Validators.required, Validators.min(10), Validators.max(120)]],
    deliveryFee: [5, [Validators.required, Validators.min(0)]],
    minimumOrder: [0, [Validators.required, Validators.min(0)]],
    isOpen: [true],
    imageUrl: [''],
  });

  readonly menuItemForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required]],
    price: [0, [Validators.required, Validators.min(0)]],
    category: ['', [Validators.required]],
    isVegetarian: [false],
    isVegan: [false],
    isSpicy: [false],
    dietaryRestrictions: [[] as DietaryRestriction[]],
    imageUrl: [''],
    isAvailable: [true],
  });

  readonly stats = computed(() => ({
    totalRestaurants: this.restaurantsSignal().length,
    totalMenuItems: this.menuItemsSignal().length,
    openRestaurants: this.restaurantsSignal().filter(r => r.isOpen).length,
    avgRating: this.restaurantsSignal().length > 0 
      ? (this.restaurantsSignal().reduce((sum, r) => sum + (r.rating || 0), 0) / this.restaurantsSignal().length).toFixed(1)
      : '0',
  }));

  ngOnInit(): void {
    this.loadRestaurants();
  }

  loadRestaurants(): void {
    this.loadingSignal.set(true);
    const userId = this.authSession.user()?.id;
    
    if (!userId) {
      this.notification.error('Not authenticated', 'You must be logged in');
      this.loadingSignal.set(false);
      return;
    }

    this.restaurantsApi.findAll().subscribe({
      next: (response) => {
        // Handle both array and paginated responses
        const restaurants = Array.isArray(response) ? response : response.restaurants;
        // Filter to only show restaurants owned by current user
        const ownedRestaurants = (restaurants as Restaurant[]).filter((r: Restaurant) => r.ownerId === userId);
        this.restaurantsSignal.set(ownedRestaurants);
      },
      error: (err: any) => {
        this.notification.error('Failed to load restaurants', err?.error?.message);
        this.loadingSignal.set(false);
      },
      complete: () => {
        this.loadingSignal.set(false);
      },
    });
  }

  loadMenuItems(restaurantId: string): void {
    this.menuItemsApi.findByRestaurantId(restaurantId).subscribe({
      next: (items) => {
        this.menuItemsSignal.set(items);
      },
      error: (err) => {
        this.notification.error('Failed to load menu items', err?.error?.message);
      },
    });
  }

  selectRestaurant(restaurant: Restaurant): void {
    this.selectedRestaurantSignal.set(restaurant);
    this.activeTabSignal.set('overview');
    const restId = restaurant._id ?? restaurant.id;
    if (restId) this.loadMenuItems(restId);
  }

  saveRestaurant(): void {
    if (this.restaurantForm.invalid) return;

    this.savingSignal.set(true);
    const formData = this.restaurantForm.getRawValue();
    const payload: Partial<Restaurant> = {
      ...formData,
      ownerId: this.selectedRestaurantSignal()?.ownerId || this.authSession.user()?.id || '',
      address: {
        street: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
      },
    };

    if (this.selectedRestaurantSignal()) {
      // Update existing
      const restId = this.selectedRestaurantSignal()!._id ?? this.selectedRestaurantSignal()!.id;
      if (!restId) return;
      this.restaurantsApi.update(restId, payload).subscribe({
        next: () => {
          this.notification.success('Restaurant updated', 'Changes saved successfully');
          this.showRestaurantFormSignal.set(false);
          this.loadRestaurants();
        },
        error: (err: any) => {
          this.notification.error('Failed to update', err?.error?.message);
          this.savingSignal.set(false);
        },
      });
    } else {
      // Create new
      this.restaurantsApi.create(payload as Restaurant).subscribe({
        next: (restaurant) => {
          this.notification.success('Restaurant created', 'Your restaurant is now listed');
          this.restaurantForm.reset();
          this.showRestaurantFormSignal.set(false);
          this.loadRestaurants();
        },
        error: (err: any) => {
          this.notification.error('Failed to create', err?.error?.message);
          this.savingSignal.set(false);
        },
      });
    }
  }

  saveMenuItem(): void {
    if (this.menuItemForm.invalid || !this.selectedRestaurantSignal()) return;

    this.savingSignal.set(true);
    const formData = this.menuItemForm.getRawValue();
    const restaurantId = this.selectedRestaurantSignal()!._id ?? this.selectedRestaurantSignal()!.id;
    if (!restaurantId) return;

    const payload: MenuItem = {
      ...formData,
      restaurantId,
    } as MenuItem;

    if (this.editingMenuItemSignal()) {
      // Update existing
      const itemId = this.editingMenuItemSignal()?._id ?? this.editingMenuItemSignal()?.id;
      if (!itemId) return;
      this.menuItemsApi.update(itemId, payload).subscribe({
        next: () => {
          this.notification.success('Menu item updated', 'Changes saved');
          this.showMenuFormSignal.set(false);
          this.editingMenuItemSignal.set(null);
          this.loadMenuItems(restaurantId);
        },
        error: (err: any) => {
          this.notification.error('Failed to update', err?.error?.message);
          this.savingSignal.set(false);
        },
      });
    } else {
      // Create new
      this.menuItemsApi.create(payload).subscribe({
        next: () => {
          this.notification.success('Menu item added', 'New item added to menu');
          this.menuItemForm.reset();
          this.showMenuFormSignal.set(false);
          this.loadMenuItems(restaurantId);
        },
        error: (err: any) => {
          this.notification.error('Failed to create', err?.error?.message);
          this.savingSignal.set(false);
        },
      });
    }
  }

  editMenuItem(item: MenuItem): void {
    this.editingMenuItemSignal.set(item);
    this.menuItemForm.patchValue({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      isVegetarian: item.badges?.includes('vegetarian') || false,
      isVegan: item.badges?.includes('vegan') || false,
      isSpicy: item.badges?.includes('spicy') || false,
      dietaryRestrictions: item.dietaryRestrictions || [],
      imageUrl: item.imageUrl || '',
      isAvailable: item.isAvailable !== false,
    });
    this.showMenuFormSignal.set(true);
  }

  toggleCuisine(cuisine: CuisineType): void {
    const current = this.restaurantForm.get('cuisines')?.value || [];
    if (current.includes(cuisine)) {
      this.restaurantForm.patchValue({
        cuisines: current.filter(c => c !== cuisine),
      });
    } else {
      this.restaurantForm.patchValue({
        cuisines: [...current, cuisine],
      });
    }
  }

  deleteMenuItem(itemId: string): void {
    if (!confirm('Are you sure you want to delete this item?')) return;

    this.menuItemsApi.remove(itemId).subscribe({
      next: () => {
        this.notification.success('Item deleted', 'Menu item removed');
        const restId = this.selectedRestaurantSignal()?._id ?? this.selectedRestaurantSignal()?.id;
        if (restId) this.loadMenuItems(restId);
      },
      error: (err: any) => {
        this.notification.error('Failed to delete', err?.error?.message);
      },
    });
  }

  deleteRestaurant(restaurantId: string): void {
    if (!confirm('Are you sure? This cannot be undone.')) return;

    this.restaurantsApi.remove(restaurantId).subscribe({
      next: () => {
        this.notification.success('Restaurant deleted', '');
        this.selectedRestaurantSignal.set(null);
        this.loadRestaurants();
      },
      error: (err: any) => {
        this.notification.error('Failed to delete', err?.error?.message);
      },
    });
  }



  toggleActive(restaurant: Restaurant): void {
    const id = restaurant._id ?? restaurant.id;
    if (!id) {
      return;
    }

    this.restaurantsApi
      .update(id, { isActive: !(restaurant.isActive ?? true) })
      .subscribe(() => {
        this.notification.show({ type: 'info', text: 'Restaurant updated' });
        this.loadRestaurants();
      });
  }

  setTab(tab: string): void {
    if (['overview', 'menu', 'orders', 'settings'].includes(tab)) {
      this.activeTabSignal.set(tab as 'overview' | 'menu' | 'orders' | 'settings');
    }
  }

  remove(restaurant: Restaurant): void {
    const id = restaurant._id ?? restaurant.id;
    if (!id) {
      return;
    }

    this.restaurantsApi.remove(id).subscribe(() => {
      this.notification.show({ type: 'info', text: 'Restaurant removed' });
      this.loadRestaurants();
    });
  }
}

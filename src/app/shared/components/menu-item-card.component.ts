import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuItem } from '../../core/models/types';

@Component({
  selector: 'app-menu-item-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all">
      <!-- Image -->
      <div class="relative h-40 bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
        @if (menuItem.imageUrl) {
          <img 
            [src]="menuItem.imageUrl" 
            [alt]="menuItem.name"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform"
            loading="lazy"
          />
        } @else {
          <div class="w-full h-full flex items-center justify-center">
            <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        }
        
        <!-- Badges -->
        @if (menuItem.badges && menuItem.badges.length > 0) {
          <div class="absolute top-2 left-2 flex gap-1">
            @for (badge of menuItem.badges; track badge) {
              <span class="badge badge-secondary text-xs">{{ badge }}</span>
            }
          </div>
        }

        <!-- Availability --
        @if (!menuItem.isAvailable) {
          <div class="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <span class="bg-danger-500 text-white px-4 py-2 rounded-lg font-semibold">Out of Stock</span>
          </div>
        }
      </div>

      <!-- Content -->
      <div class="p-4">
        <h4 class="font-bold text-gray-900 mb-1 line-clamp-1">{{ menuItem.name }}</h4>
        
        @if (menuItem.description) {
          <p class="text-sm text-gray-600 mb-2 line-clamp-2">{{ menuItem.description }}</p>
        }

        <!-- Dietary/Allergy Info -->
        @if (menuItem.dietaryRestrictions && menuItem.dietaryRestrictions.length > 0) {
          <div class="flex flex-wrap gap-1 mb-2">
            @for (diet of menuItem.dietaryRestrictions.slice(0, 2); track diet) {
              <span class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">{{ diet }}</span>
            }
          </div>
        }

        <!-- Price & Rating -->
        <div class="flex items-baseline justify-between mb-3">
          <div class="flex items-baseline gap-2">
            <span class="text-lg font-bold text-gray-900">₹{{ menuItem.price }}</span>
            @if (menuItem.discountPrice && menuItem.discountPrice < menuItem.price) {
              <span class="text-sm text-gray-500 line-through">₹{{ menuItem.discountPrice }}</span>
            }
          </div>
          @if (menuItem.ratingCount && menuItem.ratingCount > 0) {
            <div class="flex items-center gap-1">
              <svg class="w-4 h-4 text-warning-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span class="text-xs font-semibold">{{ menuItem.ratings || 'N/A' }}</span>
            </div>
          }
        </div>

        <!-- Add to Cart Button -->
        <button 
          (click)="addToCart()"
          [disabled]="!menuItem.isAvailable"
          class="btn btn-primary w-full text-sm"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add to Cart
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host ::ng-deep {
      .line-clamp-1 {
        display: -webkit-box;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    }

    button:disabled {
      @apply opacity-50 cursor-not-allowed;
    }
  `]
})
export class MenuItemCardComponent {
  @Input() menuItem!: MenuItem;
  @Output() addedToCart = new EventEmitter<MenuItem>();

  addToCart(): void {
    if (this.menuItem.isAvailable) {
      this.addedToCart.emit(this.menuItem);
    }
  }
}

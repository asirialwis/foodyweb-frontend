import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Restaurant } from '../../core/models/types';

@Component({
  selector: 'app-restaurant-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card cursor-pointer hover:shadow-xl transform hover:-translate-y-1 transition-all" (click)="onSelect()">
      <!-- Restaurant Image -->
      <div class="relative h-40 -mx-6 -mt-6 mb-4 overflow-hidden rounded-t-xl bg-gradient-to-br from-gray-200 to-gray-300">
        @if (restaurant.imageUrl) {
          <img 
            [src]="restaurant.imageUrl" 
            [alt]="restaurant.name"
            class="w-full h-full object-cover"
            loading="lazy"
          />
        } @else {
          <div class="w-full h-full flex items-center justify-center">
            <svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        }
        <!-- Tags/Badges -->
        @if (restaurant.tags && restaurant.tags.length > 0) {
          <div class="absolute top-2 left-2 flex gap-1">
            @for (tag of restaurant.tags.slice(0, 2); track tag) {
              <span class="badge badge-primary text-xs">{{ tag }}</span>
            }
          </div>
        }
      </div>

      <!-- Content -->
      <h3 class="text-lg font-bold text-gray-900 mb-1 line-clamp-1">{{ restaurant.name }}</h3>
      
      @if (restaurant.description) {
        <p class="text-sm text-gray-600 mb-3 line-clamp-2">{{ restaurant.description }}</p>
      }

      <!-- Cuisine Tags -->
      @if (restaurant.cuisine && restaurant.cuisine.length > 0) {
        <div class="flex flex-wrap gap-1 mb-3">
          @for (cuisine of restaurant.cuisine.slice(0, 2); track cuisine) {
            <span class="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">{{ cuisine }}</span>
          }
        </div>
      }

      <!-- Rating & Info Footer -->
      <div class="flex items-center justify-between text-sm text-gray-600 border-t pt-3">
        <div class="flex items-center gap-1">
          <svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span class="font-semibold">{{ restaurant.rating || 'N/A' }}</span>
          @if (restaurant.ratingCount) {
            <span>({{ restaurant.ratingCount }})</span>
          }
        </div>

        <div class="flex items-center gap-1">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00-.293.707l-1.414 1.414a1 1 0 001.414 1.414l2-2A1 1 0 0011 9.414V6z" clip-rule="evenodd" />
          </svg>
          {{ restaurant.deliveryTime || '30' }} min
        </div>

        @if (restaurant.deliveryFee) {
          <div class="text-primary-600 font-semibold">₹{{ restaurant.deliveryFee }}</div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
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
  `]
})
export class RestaurantCardComponent {
  @Input() restaurant!: Restaurant;
  @Output() select = new EventEmitter<Restaurant>();

  onSelect(): void {
    this.select.emit(this.restaurant);
  }
}

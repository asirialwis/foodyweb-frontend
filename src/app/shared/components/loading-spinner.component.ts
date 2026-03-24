import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center justify-center" [style.height]="height || '400px'">
      <div class="text-center">
        <div class="loading-spinner mb-4"></div>
        @if (message) {
          <p class="text-gray-600 text-sm">{{ message }}</p>
        }
      </div>
    </div>
  `,
  styles: [`
    .loading-spinner {
      @apply inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-r-primary-500;
    }
  `]
})
export class LoadingSpinnerComponent {
  @Input() message = 'Loading...';
  @Input() height = '400px';
}

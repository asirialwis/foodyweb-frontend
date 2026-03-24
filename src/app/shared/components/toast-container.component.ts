import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-50 space-y-3 max-w-md w-full px-4 md:px-0">
      @for (message of notificationService.messages(); track message.id) {
        <div
          @toastAnimation
          class="toast"
          [ngClass]="'toast-' + message.type"
          role="alert"
        >
          <div class="toast-content">
            <div class="toast-header">
              <span class="toast-icon">
                @switch (message.type) {
                  @case ('success') {
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                  }
                  @case ('error') {
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                    </svg>
                  }
                  @case ('warning') {
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                  }
                  @default {
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                  }
                }
              </span>
              @if (message.title) {
                <h3 class="toast-title">{{ message.title }}</h3>
              }
              <button 
                (click)="notificationService.remove(message.id!)"
                class="ml-auto text-gray-400 hover:text-gray-600 transition"
                aria-label="Close notification"
              >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
            <p class="toast-message">{{ message.text }}</p>
            @if (message.action) {
              <button 
                (click)="message.action!.callback()"
                class="mt-2 text-sm font-semibold underline hover:opacity-80 transition"
              >
                {{ message.action.text }}
              </button>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast {
      @apply bg-white rounded-lg shadow-lg p-4 flex items-start gap-3;
    }

    .toast-success {
      @apply border-l-4 border-success-500;
    }

    .toast-success .toast-icon {
      @apply text-success-500;
    }

    .toast-error {
      @apply border-l-4 border-danger-500;
    }

    .toast-error .toast-icon {
      @apply text-danger-500;
    }

    .toast-warning {
      @apply border-l-4 border-warning-500;
    }

    .toast-warning .toast-icon {
      @apply text-warning-500;
    }

    .toast-info {
      @apply border-l-4 border-primary-500;
    }

    .toast-info .toast-icon {
      @apply text-primary-500;
    }

    .toast-content {
      @apply flex-1;
    }

    .toast-header {
      @apply flex items-center gap-2 mb-1;
    }

    .toast-icon {
      @apply flex-shrink-0;
    }

    .toast-title {
      @apply font-semibold text-gray-900 text-sm;
    }

    .toast-message {
      @apply text-gray-600 text-sm leading-relaxed;
    }
  `],
  animations: [
    trigger('toastAnimation', [
      transition(':enter', [
        style({ 
          opacity: 0,
          transform: 'translateX(400px)'
        }),
        animate('300ms ease-out', style({ 
          opacity: 1,
          transform: 'translateX(0)'
        }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ 
          opacity: 0,
          transform: 'translateX(400px)'
        }))
      ])
    ])
  ]
})
export class ToastContainerComponent {
  constructor(readonly notificationService: NotificationService) {}
}

import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  type: 'success' | 'error' | 'info';
  text: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly messageSignal = signal<ToastMessage | null>(null);
  readonly message = this.messageSignal.asReadonly();

  show(message: ToastMessage, timeoutMs = 3000): void {
    this.messageSignal.set(message);
    setTimeout(() => {
      if (this.messageSignal() === message) {
        this.messageSignal.set(null);
      }
    }, timeoutMs);
  }

  clear(): void {
    this.messageSignal.set(null);
  }
}

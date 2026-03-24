import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id?: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  text: string;
  duration?: number;
  action?: {
    text: string;
    callback: () => void;
  };
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly messagesSignal = signal<ToastMessage[]>([]);
  readonly messages = this.messagesSignal.asReadonly();

  private timeoutMap = new Map<string, any>();

  show(message: Omit<ToastMessage, 'id'>, durationMs = 4000): string {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const fullMessage: ToastMessage = { ...message, id };

    this.messagesSignal.update((messages) => [...messages, fullMessage]);

    if (durationMs > 0) {
      const timeout = setTimeout(() => this.remove(id), durationMs);
      this.timeoutMap.set(id, timeout);
    }

    return id;
  }

  success(text: string, title?: string, durationMs?: number): string {
    return this.show({ type: 'success', text, title, duration: durationMs }, durationMs);
  }

  error(text: string, title?: string, durationMs?: number): string {
    return this.show({ type: 'error', text, title, duration: durationMs || 5000 }, durationMs || 5000);
  }

  info(text: string, title?: string, durationMs?: number): string {
    return this.show({ type: 'info', text, title, duration: durationMs }, durationMs);
  }

  warning(text: string, title?: string, durationMs?: number): string {
    return this.show({ type: 'warning', text, title, duration: durationMs || 5000 }, durationMs || 5000);
  }

  remove(id: string): void {
    this.messagesSignal.update((messages) =>
      messages.filter((msg) => msg.id !== id),
    );

    const timeout = this.timeoutMap.get(id);
    if (timeout) {
      clearTimeout(timeout);
      this.timeoutMap.delete(id);
    }
  }

  clear(): void {
    // Clear all timeouts
    this.timeoutMap.forEach((timeout) => clearTimeout(timeout));
    this.timeoutMap.clear();
    this.messagesSignal.set([]);
  }

  getCount(): number {
    return this.messages().length;
  }
}

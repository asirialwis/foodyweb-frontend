import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { OrdersApiService } from '../../core/api/orders-api.service';
import { DeliveriesApiService } from '../../core/api/deliveries-api.service';
import { DriversApiService } from '../../core/api/drivers-api.service';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { NotificationService } from '../../core/services/notification.service';
import { Order, Delivery, DeliveryStatus } from '../../core/models/types';

interface DeliveryWithOrder extends Delivery {
  order?: Order;
}

@Component({
  selector: 'app-driver-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './driver-dashboard.component.html',
  styleUrl: './driver-dashboard.component.scss',
})
export class DriverDashboardComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly ordersApi = inject(OrdersApiService);
  private readonly deliveriesApi = inject(DeliveriesApiService);
  private readonly driversApi = inject(DriversApiService);
  private readonly authSession = inject(AuthSessionService);
  private readonly notification = inject(NotificationService);

  readonly loadingSignal = signal(false);
  readonly savingSignal = signal(false);
  readonly activeDeliveriesSignal = signal<DeliveryWithOrder[]>([]);
  readonly completedDeliveriesSignal = signal<DeliveryWithOrder[]>([]);
  readonly driverStatsSignal = signal({
    totalDeliveries: 0,
    completedToday: 0,
    activeDeliveries: 0,
    totalEarnings: 0,
    rating: 4.5,
  });

  readonly statusFilterSignal = signal<DeliveryStatus | 'all'>('all');
  readonly showRatingFormSignal = signal(false);
  readonly selectedDeliverySignal = signal<DeliveryWithOrder | null>(null);

  readonly availabilityForm = this.fb.nonNullable.group({
    isAvailable: [true],
  });

  readonly ratingForm = this.fb.nonNullable.group({
    rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
    comment: [''],
  });

  readonly filteredDeliveries = computed(() => {
    const status = this.statusFilterSignal();
    const active = this.activeDeliveriesSignal();
    
    if (status === 'all') return active;
    return active.filter(d => d.status === status);
  });

  readonly totalEarningsToday = computed(() => {
    const completed = this.completedDeliveriesSignal();
    return completed
      .filter(d => d.createdAt && new Date(d.createdAt).toDateString() === new Date().toDateString())
      .reduce((sum, d) => sum + (d.deliveryFee || 0), 0);
  });

  ngOnInit(): void {
    this.loadDeliveries();
    this.loadDriverStats();
  }

  loadDeliveries(): void {
    this.loadingSignal.set(true);
    const driverId = this.authSession.user()?.id;

    if (!driverId) {
      this.notification.error('Error', 'Driver ID not found');
      this.loadingSignal.set(false);
      return;
    }

    // Load active deliveries
    this.deliveriesApi
      .findByDriverId(driverId)
      .subscribe({
        next: (deliveries) => {
          // Filter by status
          const active = deliveries.filter(
            d => !['delivered', 'failed'].includes(d.status ?? 'pending')
          );
          const completed = deliveries.filter(
            d => ['delivered', 'failed'].includes(d.status ?? 'pending')
          );

          this.activeDeliveriesSignal.set(active);
          this.completedDeliveriesSignal.set(completed);
          this.loadingSignal.set(false);
        },
        error: (err) => {
          console.error('Error loading deliveries:', err);
          this.notification.error('Error', 'Failed to load deliveries');
          this.loadingSignal.set(false);
        },
      });
  }

  loadDriverStats(): void {
    this.driversApi.getDeliveryStats().subscribe({
      next: (stats) => {
        this.driverStatsSignal.set({
          totalDeliveries: stats.totalDeliveries || 0,
          completedToday: stats.completedToday || 0,
          activeDeliveries: this.filteredDeliveries().length,
          totalEarnings: stats.totalEarnings || 0,
          rating: stats.rating || 4.5,
        });
      },
      error: (err) => console.error('Error loading stats:', err),
    });
  }

  toggleAvailability(): void {
    this.savingSignal.set(true);
    const isAvailable = this.availabilityForm.get('isAvailable')?.value ?? false;

    this.driversApi
      .toggleAvailability(isAvailable)
      .subscribe({
        next: () => {
          this.notification.success(
            'Success',
            isAvailable ? 'You are now available' : 'You are now unavailable'
          );
          this.savingSignal.set(false);
        },
        error: (err) => {
          console.error('Error toggling availability:', err);
          this.notification.error('Error', 'Failed to update availability');
          this.savingSignal.set(false);
        },
      });
  }

  selectDelivery(delivery: DeliveryWithOrder): void {
    this.selectedDeliverySignal.set(delivery);
  }

  closeDetails(): void {
    this.selectedDeliverySignal.set(null);
  }

  acceptDelivery(delivery: DeliveryWithOrder): void {
    const deliveryId = delivery.id || delivery._id;
    if (!deliveryId) return;

    this.savingSignal.set(true);

    this.deliveriesApi
      .updateStatus(deliveryId, 'assigned')
      .subscribe({
        next: () => {
          this.notification.success('Success', 'Delivery accepted');
          this.loadDeliveries();
          this.savingSignal.set(false);
          this.selectedDeliverySignal.set(null);
        },
        error: (err) => {
          console.error('Error accepting delivery:', err);
          this.notification.error('Error', 'Failed to accept delivery');
          this.savingSignal.set(false);
        },
      });
  }

  pickupOrder(delivery: DeliveryWithOrder): void {
    const deliveryId = delivery.id || delivery._id;
    if (!deliveryId) return;

    this.savingSignal.set(true);

    this.deliveriesApi
      .updateStatus(deliveryId, 'picked_up')
      .subscribe({
        next: () => {
          this.notification.success('Success', 'Order picked up');
          this.loadDeliveries();
          this.savingSignal.set(false);
        },
        error: (err) => {
          console.error('Error picking up order:', err);
          this.notification.error('Error', 'Failed to pickup order');
          this.savingSignal.set(false);
        },
      });
  }

  startDelivery(delivery: DeliveryWithOrder): void {
    const deliveryId = delivery.id || delivery._id;
    if (!deliveryId) return;

    this.savingSignal.set(true);

    this.deliveriesApi
      .updateStatus(deliveryId, 'in_transit')
      .subscribe({
        next: () => {
          this.notification.success('Success', 'Delivery started');
          this.loadDeliveries();
          this.savingSignal.set(false);
        },
        error: (err) => {
          console.error('Error starting delivery:', err);
          this.notification.error('Error', 'Failed to start delivery');
          this.savingSignal.set(false);
        },
      });
  }

  completeDelivery(delivery: DeliveryWithOrder): void {
    const deliveryId = delivery.id || delivery._id;
    if (!deliveryId) return;

    this.savingSignal.set(true);

    this.deliveriesApi
      .updateStatus(deliveryId, 'delivered')
      .subscribe({
        next: () => {
          this.notification.success('Success', 'Delivery completed');
          this.loadDeliveries();
          this.savingSignal.set(false);
        },
        error: (err) => {
          console.error('Error completing delivery:', err);
          this.notification.error('Error', 'Failed to complete delivery');
          this.savingSignal.set(false);
        },
      });
  }

  openRatingForm(): void {
    this.showRatingFormSignal.set(true);
  }

  submitRating(delivery: DeliveryWithOrder): void {
    if (this.ratingForm.invalid) return;

    const deliveryId = delivery.id || delivery._id;
    if (!deliveryId) return;

    this.savingSignal.set(true);
    const { rating, comment } = this.ratingForm.value;

    this.deliveriesApi
      .rateDelivery(deliveryId, {
        rating: rating || 5,
      } as any)
      .subscribe({
        next: () => {
          this.notification.success('Success', 'Rating submitted');
          this.showRatingFormSignal.set(false);
          this.ratingForm.reset({ rating: 5, comment: '' });
          this.savingSignal.set(false);
        },
        error: (err) => {
          console.error('Error submitting rating:', err);
          this.notification.error('Error', 'Failed to submit rating');
          this.savingSignal.set(false);
        },
      });
  }

  cancelRating(): void {
    this.showRatingFormSignal.set(false);
    this.ratingForm.reset({ rating: 5, comment: '' });
  }

  getStatusBadgeClass(status: DeliveryStatus | undefined): string {
    const safeStatus = status ?? 'pending';
    const classes: Record<DeliveryStatus, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      assigned: 'bg-blue-100 text-blue-800',
      picked_up: 'bg-purple-100 text-purple-800',
      in_transit: 'bg-cyan-100 text-cyan-800',
      delivered: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };
    return classes[safeStatus] || 'bg-gray-100 text-gray-800';
  }

  getStatusIcon(status: DeliveryStatus | undefined): string {
    const safeStatus = status ?? 'pending';
    const icons: Record<DeliveryStatus, string> = {
      pending: '⏳',
      assigned: '✓',
      picked_up: '📦',
      in_transit: '🚗',
      delivered: '✅',
      failed: '❌',
    };
    return icons[safeStatus] || '•';
  }

  getActionLabel(status: DeliveryStatus | undefined): string {
    const safeStatus = status ?? 'pending';
    switch (safeStatus) {
      case 'pending':
        return 'Accept Delivery';
      case 'assigned':
        return 'Pickup Order';
      case 'picked_up':
        return 'Start Delivery';
      case 'in_transit':
        return 'Mark Delivered';
      default:
        return 'View Details';
    }
  }

  canTakeAction(status: DeliveryStatus | undefined): boolean {
    return ['pending', 'assigned', 'picked_up', 'in_transit'].includes(status ?? 'pending');
  }

  onStatusAction(delivery: DeliveryWithOrder): void {
    switch (delivery.status) {
      case 'pending':
        this.acceptDelivery(delivery);
        break;
      case 'assigned':
        this.pickupOrder(delivery);
        break;
      case 'picked_up':
        this.startDelivery(delivery);
        break;
      case 'in_transit':
        this.completeDelivery(delivery);
        break;
    }
  }
}

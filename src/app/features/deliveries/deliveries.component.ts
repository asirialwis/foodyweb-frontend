import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DeliveriesApiService } from '../../core/api/deliveries-api.service';
import { DriversApiService } from '../../core/api/drivers-api.service';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { NotificationService } from '../../core/services/notification.service';
import { Delivery, DeliveryStatus, Driver } from '../../core/models/types';

@Component({
  selector: 'app-deliveries',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './deliveries.component.html',
  styleUrl: './deliveries.component.scss',
})
export class DeliveriesComponent implements OnInit {
  private readonly deliveriesApi = inject(DeliveriesApiService);
  private readonly driversApi = inject(DriversApiService);
  private readonly authSession = inject(AuthSessionService);
  private readonly notification = inject(NotificationService);

  statusFilter = '';
  private driverEntityId: string | null = null;
  readonly deliveries = signal<Delivery[]>([]);

  readonly isDriver = computed(() => this.authSession.user()?.role === 'delivery_driver');

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const status = this.statusFilter ? (this.statusFilter as DeliveryStatus) : undefined;

    if (!this.isDriver()) {
      this.deliveriesApi.findAll({ status }).subscribe((deliveries) => {
        this.deliveries.set(deliveries);
      });
      return;
    }

    const userId = this.authSession.user()?.id;
    if (!userId) {
      this.deliveries.set([]);
      return;
    }

    this.driversApi.findAll().subscribe((drivers) => {
      const ownDriver = drivers.find((driver: Driver) => driver.userId === userId);
      this.driverEntityId = ownDriver?._id ?? ownDriver?.id ?? null;

      this.deliveriesApi.findAll({ status }).subscribe((deliveries) => {
        if (!this.driverEntityId) {
          this.deliveries.set([]);
          return;
        }

        this.deliveries.set(
          deliveries.filter((delivery: Delivery) => delivery.driverId === this.driverEntityId),
        );
      });
    });
  }

  updateStatus(delivery: Delivery, status: string): void {
    const id = delivery._id ?? delivery.id;
    if (!id) {
      return;
    }

    if (this.isDriver() && delivery.driverId !== this.driverEntityId) {
      return;
    }

    this.deliveriesApi.updateStatus(id, status as DeliveryStatus).subscribe(() => {
      this.notification.show({ type: 'success', text: 'Delivery status updated' });
      this.load();
    });
  }

  assign(delivery: Delivery, driverId: string): void {
    if (this.isDriver()) {
      return;
    }

    const id = delivery._id ?? delivery.id;
    if (!id || !driverId.trim()) {
      return;
    }

    this.deliveriesApi.assignDriver(id, driverId.trim()).subscribe(() => {
      this.notification.show({ type: 'success', text: 'Driver assigned' });
      this.load();
    });
  }
}

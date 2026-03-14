import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
})
export class AppShellComponent {
  private readonly authSession = inject(AuthSessionService);
  private readonly router = inject(Router);
  private readonly notification = inject(NotificationService);

  readonly user = this.authSession.user;
  readonly toast = this.notification.message;

  readonly firstName = computed(() => this.user()?.firstName ?? 'Guest');

  readonly navItems = computed(() => {
    const role = this.user()?.role;

    if (role === 'customer') {
      return [
        { label: 'Discover', link: '/catalog' },
        { label: 'Orders', link: '/orders' },
      ];
    }

    if (role === 'restaurant_owner') {
      return [
        { label: 'Overview', link: '/dashboard' },
        { label: 'Restaurants', link: '/restaurants/manage' },
        { label: 'Menu', link: '/menu/manage' },
        { label: 'Orders', link: '/orders' },
      ];
    }

    if (role === 'delivery_driver') {
      return [
        { label: 'Overview', link: '/dashboard' },
        { label: 'Deliveries', link: '/deliveries' },
        { label: 'Driver Profile', link: '/drivers' },
      ];
    }

    return [
      { label: 'Overview', link: '/dashboard' },
      { label: 'Discover', link: '/catalog' },
      { label: 'Orders', link: '/orders' },
      { label: 'Restaurants', link: '/restaurants/manage' },
      { label: 'Menu', link: '/menu/manage' },
      { label: 'Deliveries', link: '/deliveries' },
      { label: 'Users', link: '/users' },
    ];
  });

  logout(): void {
    this.authSession.clearSession();
    this.router.navigateByUrl('/login');
  }
}

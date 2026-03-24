import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UsersApiService } from '../../core/api/users-api.service';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { AuthApiService } from '../../core/api/auth-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { User, Address } from '../../core/models/types';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly usersApi = inject(UsersApiService);
  private readonly authApi = inject(AuthApiService);
  private readonly authSession = inject(AuthSessionService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);

  readonly userSignal = computed(() => this.authSession.user());
  readonly loadingSignal = signal(false);
  readonly savingSignal = signal(false);
  readonly showAddressFormSignal = signal(false);
  readonly editingAddressIndexSignal = signal<number | null>(null);
  readonly showPasswordFormSignal = signal(false);

  readonly profileForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    avatar: [''],
  });

  readonly addressForm = this.fb.nonNullable.group({
    street: ['', [Validators.required]],
    apartment: [''],
    city: ['', [Validators.required]],
    state: ['', [Validators.required]],
    zipCode: ['', [Validators.required]],
    country: ['', [Validators.required]],
    isDefault: [false],
  });

  readonly passwordForm = this.fb.nonNullable.group({
    oldPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
  });

  readonly addresses = signal<Address[]>([]);
  readonly totalOrders = signal(0);

  readonly stats = computed(() => ({
    totalOrders: this.totalOrders(),
    memberSince: this.userSignal()?.email ? new Date().toLocaleDateString() : 'N/A',
    avgRating: 5,
  }));

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    const user = this.userSignal();
    if (!user) return;

    this.loadingSignal.set(true);
    this.usersApi.findById(user.id).subscribe({
      next: (userData: User) => {
        this.profileForm.patchValue({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          phone: userData.phone || '',
          avatar: userData.avatar || '',
        });

        if (userData.addresses) {
          this.addresses.set(userData.addresses);
        }

        this.totalOrders.set((userData as any).totalOrders || 0);
      },
      error: (err: any) => {
        this.notification.error('Failed to load profile', err?.error?.message);
        this.loadingSignal.set(false);
      },
      complete: () => {
        this.loadingSignal.set(false);
      },
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;

    this.savingSignal.set(true);
    const user = this.userSignal();
    if (!user) return;

    const payload = {
      firstName: this.profileForm.get('firstName')?.value || '',
      lastName: this.profileForm.get('lastName')?.value || '',
      phone: this.profileForm.get('phone')?.value || '',
      avatar: this.profileForm.get('avatar')?.value || '',
    };

    this.authApi.updateProfile(payload).subscribe({
      next: () => {
        this.notification.success('Profile updated', 'Your changes have been saved');
      },
      error: (err) => {
        this.notification.error('Failed to update profile', err?.error?.message);
      },
      complete: () => {
        this.savingSignal.set(false);
      },
    });
  }

  addAddress(): void {
    if (this.addressForm.invalid) return;

    this.savingSignal.set(true);
    const payload = this.addressForm.getRawValue();

    this.usersApi.addAddress(payload as Address).subscribe({
      next: () => {
        this.notification.success('Address added', 'New address saved successfully');
        this.addressForm.reset();
        this.showAddressFormSignal.set(false);
        this.loadProfile();
      },
      error: (err) => {
        this.notification.error('Failed to add address', err?.error?.message);
        this.savingSignal.set(false);
      },
    });
  }

  updateAddress(index: number): void {
    if (this.addressForm.invalid) return;

    this.savingSignal.set(true);
    const payload = this.addressForm.getRawValue();

    this.usersApi.updateAddress(index, payload as Address).subscribe({
      next: () => {
        this.notification.success('Address updated', 'Your address has been updated');
        this.addressForm.reset();
        this.editingAddressIndexSignal.set(null);
        this.loadProfile();
      },
      error: (err) => {
        this.notification.error('Failed to update address', err?.error?.message);
        this.savingSignal.set(false);
      },
    });
  }

  deleteAddress(index: number): void {
    if (!confirm('Are you sure you want to delete this address?')) return;

    this.savingSignal.set(true);
    this.usersApi.deleteAddress(index).subscribe({
      next: () => {
        this.notification.success('Address deleted', 'Address removed successfully');
        this.loadProfile();
      },
      error: (err) => {
        this.notification.error('Failed to delete address', err?.error?.message);
        this.savingSignal.set(false);
      },
    });
  }

  editAddress(index: number): void {
    const address = this.addresses()[index];
    if (!address) return;

    this.addressForm.patchValue({
      street: address.street || '',
      apartment: address.apartment || '',
      city: address.city || '',
      state: address.state || '',
      zipCode: address.zipCode || '',
      country: address.country || '',
      isDefault: address.label === 'home' || false,
    });

    this.editingAddressIndexSignal.set(index);
    this.showAddressFormSignal.set(true);
  }

  cancelAddressForm(): void {
    this.addressForm.reset();
    this.editingAddressIndexSignal.set(null);
    this.showAddressFormSignal.set(false);
  }

  changePassword(): void {
    if (this.passwordForm.invalid) return;

    const { oldPassword, newPassword, confirmPassword } = this.passwordForm.getRawValue();
    if (newPassword !== confirmPassword) {
      this.notification.error('Password mismatch', 'New passwords do not match');
      return;
    }

    this.savingSignal.set(true);
    this.authApi.changePassword({ oldPassword, newPassword }).subscribe({
      next: () => {
        this.notification.success('Password changed', 'Your password has been updated');
        this.passwordForm.reset();
        this.showPasswordFormSignal.set(false);
      },
      error: (err) => {
        this.notification.error('Failed to change password', err?.error?.message || 'Incorrect current password');
        this.savingSignal.set(false);
      },
    });
  }

  logout(): void {
    if (!confirm('Are you sure you want to logout?')) return;

    this.authApi.logout().subscribe({
      next: () => {
        this.authSession.clearSession();
        this.notification.success('Logged out', 'You have been logged out');
        this.router.navigateByUrl('/login');
      },
      error: () => {
        this.authSession.clearSession();
        this.router.navigateByUrl('/login');
      },
    });
  }
}

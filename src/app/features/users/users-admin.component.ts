import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { UsersApiService } from '../../core/api/users-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { User, UserRole } from '../../core/models/types';

const ROLE_LABELS: Record<UserRole, string> = {
  customer: 'Customer',
  restaurant_owner: 'Restaurant owner',
  delivery_driver: 'Delivery driver',
  admin: 'Admin',
};

@Component({
  selector: 'app-users-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './users-admin.component.html',
  styleUrl: './users-admin.component.scss',
})
export class UsersAdminComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly usersApi = inject(UsersApiService);
  private readonly notification = inject(NotificationService);

  readonly users = signal<User[]>([]);
  /** Which user id is being edited in the modal (null = view-only list) */
  readonly editingUserId = signal<string | null>(null);
  editForms: Record<string, ReturnType<FormBuilder['group']>> = {};

  ngOnInit(): void {
    this.load();
  }

  /** Backend may send MongoDB _id; REST paths need a single string id */
  userId(user: User): string | undefined {
    const raw = user.id || user._id;
    return raw ? String(raw) : undefined;
  }

  roleLabel(role: UserRole): string {
    return ROLE_LABELS[role] ?? role;
  }

  openEdit(user: User): void {
    const id = this.userId(user);
    if (id) {
      this.editingUserId.set(id);
    }
  }

  closeEdit(): void {
    this.editingUserId.set(null);
  }

  updateFromModal(): void {
    const user = this.editingUser();
    if (user) {
      this.update(user);
    }
  }

  /** User currently open in the edit modal */
  editingUser(): User | undefined {
    const id = this.editingUserId();
    if (!id) {
      return undefined;
    }
    return this.users().find((u) => this.userId(u) === id);
  }

  removeEditingUser(): void {
    const user = this.editingUser();
    if (user) {
      this.remove(user);
    }
  }

  load(): void {
    this.usersApi.findAll({ limit: 500 }).subscribe((users) => {
      this.users.set(users);
      this.editForms = users.reduce<Record<string, ReturnType<FormBuilder['group']>>>(
        (acc, user) => {
          const id = this.userId(user);
          if (id) {
            acc[id] = this.fb.group({
              firstName: [user.firstName ?? ''],
              lastName: [user.lastName ?? ''],
              phone: [user.phone ?? ''],
              role: [user.role],
            });
          }
          return acc;
        },
        {},
      );
    });
  }

  update(user: User): void {
    const id = this.userId(user);
    if (!id || !this.editForms[id]) {
      return;
    }

    this.usersApi
      .update(id, this.editForms[id].getRawValue() as { role: UserRole })
      .subscribe(() => {
        this.notification.show({ type: 'success', text: 'User updated' });
        this.editingUserId.set(null);
        this.load();
      });
  }

  remove(user: User): void {
    const id = this.userId(user);
    if (!id) {
      return;
    }
    const label =
      `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email || 'this user';
    if (!confirm(`Remove ${label}?`)) {
      return;
    }

    this.usersApi.remove(id).subscribe(() => {
      this.notification.show({ type: 'info', text: 'User removed' });
      if (this.editingUserId() === id) {
        this.editingUserId.set(null);
      }
      this.load();
    });
  }
}

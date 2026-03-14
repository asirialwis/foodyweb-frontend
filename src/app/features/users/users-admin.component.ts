import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { UsersApiService } from '../../core/api/users-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { User, UserRole } from '../../core/models/types';

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
  editForms: Record<string, ReturnType<FormBuilder['group']>> = {};

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.usersApi.findAll().subscribe((users) => {
      this.users.set(users);
      this.editForms = users.reduce<Record<string, ReturnType<FormBuilder['group']>>>(
        (acc, user) => {
          const id = user.id;
          if (id) {
            acc[id] = this.fb.group({
              firstName: [user.firstName],
              lastName: [user.lastName],
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
    const id = user.id;
    if (!id || !this.editForms[id]) {
      return;
    }

    this.usersApi
      .update(id, this.editForms[id].getRawValue() as { role: UserRole })
      .subscribe(() => {
        this.notification.show({ type: 'success', text: 'User updated' });
        this.load();
      });
  }

  remove(user: User): void {
    const id = user.id;
    if (!id) {
      return;
    }

    this.usersApi.remove(id).subscribe(() => {
      this.notification.show({ type: 'info', text: 'User removed' });
      this.load();
    });
  }
}

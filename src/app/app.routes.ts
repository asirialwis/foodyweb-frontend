import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { AppShellComponent } from './features/layout/app-shell.component';

export const routes: Routes = [
	{
		path: 'login',
		canActivate: [guestGuard],
		loadComponent: () =>
			import('./features/auth/login.component').then((m) => m.LoginComponent),
	},
	{
		path: 'register',
		canActivate: [guestGuard],
		loadComponent: () =>
			import('./features/auth/register.component').then((m) => m.RegisterComponent),
	},
	{
		path: '',
		canActivate: [authGuard],
		component: AppShellComponent,
		children: [
			{
				path: 'dashboard',
				loadComponent: () =>
					import('./features/dashboard/dashboard.component').then(
						(m) => m.DashboardComponent,
					),
			},
			{
				path: 'catalog',
				canActivate: [roleGuard],
				data: { roles: ['customer', 'admin'] },
				loadComponent: () =>
					import('./features/catalog/catalog.component').then(
						(m) => m.CatalogComponent,
					),
			},
			{
				path: 'orders',
				loadComponent: () =>
					import('./features/orders/orders.component').then((m) => m.OrdersComponent),
			},
			{
				path: 'restaurants/manage',
				canActivate: [roleGuard],
				data: { roles: ['restaurant_owner', 'admin'] },
				loadComponent: () =>
					import('./features/restaurants/restaurants-manage.component').then(
						(m) => m.RestaurantsManageComponent,
					),
			},
			{
				path: 'menu/manage',
				canActivate: [roleGuard],
				data: { roles: ['restaurant_owner', 'admin'] },
				loadComponent: () =>
					import('./features/menu/menu-manage.component').then(
						(m) => m.MenuManageComponent,
					),
			},
			{
				path: 'deliveries',
				canActivate: [roleGuard],
				data: { roles: ['delivery_driver', 'admin'] },
				loadComponent: () =>
					import('./features/deliveries/deliveries.component').then(
						(m) => m.DeliveriesComponent,
					),
			},
			{
				path: 'drivers',
				canActivate: [roleGuard],
				data: { roles: ['delivery_driver', 'admin'] },
				loadComponent: () =>
					import('./features/drivers/drivers.component').then((m) => m.DriversComponent),
			},
			{
				path: 'users',
				canActivate: [roleGuard],
				data: { roles: ['admin'] },
				loadComponent: () =>
					import('./features/users/users-admin.component').then(
						(m) => m.UsersAdminComponent,
					),
			},
			{ path: '', redirectTo: 'catalog', pathMatch: 'full' },
		],
	},
	{ path: '**', redirectTo: '' },
];

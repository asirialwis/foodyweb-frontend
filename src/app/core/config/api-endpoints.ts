import { environment } from '../../../environments/environment';

export const API_ENDPOINTS = {
  auth: `${environment.api.user}/auth`,
  users: `${environment.api.user}/users`,
  healthUser: `${environment.api.user}/health`,

  restaurants: `${environment.api.restaurant}/restaurants`,
  menuItems: `${environment.api.restaurant}/menu-items`,
  healthRestaurant: `${environment.api.restaurant}/health`,

  orders: `${environment.api.order}/orders`,
  healthOrder: `${environment.api.order}/health`,

  deliveries: `${environment.api.delivery}/deliveries`,
  drivers: `${environment.api.delivery}/drivers`,
  healthDelivery: `${environment.api.delivery}/health`,
};

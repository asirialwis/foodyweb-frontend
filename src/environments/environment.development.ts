/// <reference types="vite/client" />

export const environment = {
  production: false,
  api: {
    user: import.meta.env['VITE_DEV_USER_API'],
    restaurant: import.meta.env['VITE_DEV_RESTAURANT_API'],
    order: import.meta.env['VITE_DEV_ORDER_API'],
    delivery: import.meta.env['VITE_DEV_DELIVERY_API'],
  },
};

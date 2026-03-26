/// <reference types="vite/client" />

export const environment = {
  production: true,
  api: {
    user: import.meta.env['VITE_PROD_API_URL'],
    restaurant: import.meta.env['VITE_PROD_API_URL'],
    order: import.meta.env['VITE_PROD_API_URL'],
    delivery: import.meta.env['VITE_PROD_API_URL'],
  },
};

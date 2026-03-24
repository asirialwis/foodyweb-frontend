export const environment = {
  production: false,
  // Use centralized gateway for production
  // api: { gateway: 'http://54.179.184.235:8000' },
  
  // Use individual service URLs for development
  api: {
    user: 'http://localhost:3001',
    restaurant: 'http://localhost:3002',
    order: 'http://localhost:3003',
    delivery: 'http://localhost:3004',
  },
  
  // Gateway configuration (when services run behind API Gateway)
  gateway: 'http://54.179.184.235:8000',
};

export type UserRole =
  | 'customer'
  | 'restaurant_owner'
  | 'delivery_driver'
  | 'admin';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'picked_up'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type DeliveryStatus =
  | 'pending'
  | 'assigned'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'failed';

export type VehicleType = 'bicycle' | 'motorcycle' | 'car';

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface AuthResponse {
  user: AuthUser;
  access_token: string;
}

export interface User extends AuthUser {
  phone?: string;
  address?: Address;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Restaurant {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  cuisine?: string[];
  address?: Address;
  phone?: string;
  email?: string;
  ownerId: string;
  rating?: number;
  isActive?: boolean;
  openingHours?: { open?: string; close?: string };
  imageUrl?: string;
}

export interface MenuItem {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  restaurantId: string;
  imageUrl?: string;
  isAvailable?: boolean;
  preparationTime?: number;
  ingredients?: string[];
  allergens?: string[];
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface CartItem extends OrderItem {
  restaurantId: string;
  imageUrl?: string;
}

export interface Order {
  _id?: string;
  id?: string;
  userId: string;
  restaurantId: string;
  items: OrderItem[];
  totalAmount: number;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod: string;
  deliveryAddress: Required<Address>;
  specialInstructions?: string;
  estimatedDeliveryTime?: string;
  deliveryId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Driver {
  _id?: string;
  id?: string;
  userId: string;
  vehicleType: VehicleType;
  vehicleNumber?: string;
  licenseNumber?: string;
  isAvailable?: boolean;
  isVerified?: boolean;
  currentLocation?: GeoLocation;
  rating?: number;
  totalDeliveries?: number;
}

export interface Delivery {
  _id?: string;
  id?: string;
  orderId: string;
  driverId?: string;
  status?: DeliveryStatus;
  pickupAddress: Required<Address>;
  deliveryAddress: Required<Address>;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  currentLocation?: GeoLocation;
  distance?: number;
  deliveryFee?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface HealthStatus {
  status: string;
  service: string;
  timestamp: string;
}

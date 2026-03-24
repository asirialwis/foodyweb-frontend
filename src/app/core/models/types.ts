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
  | 'in_transit'
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

export type PaymentMethod = 'credit_card' | 'debit_card' | 'wallet' | 'cash';

export type CuisineType = 
  | 'italian' | 'chinese' | 'indian' | 'mexican' | 'american' 
  | 'japanese' | 'thai' | 'mediterranean' | 'fusion' | 'fast_food' | 'vegetarian';

export type DietaryRestriction = 'vegan' | 'vegetarian' | 'gluten_free' | 'keto' | 'halal' | 'kosher';

export interface Address {
  street?: string;
  apartment?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  label?: string; // 'home', 'work', 'other'
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
  addresses?: Address[]; // Multiple saved addresses
  avatar?: string;
  isActive?: boolean;
  isVerified?: boolean;
  totalOrders?: number;
  totalSpent?: number;
  rating?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Restaurant {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  cuisine?: CuisineType[];
  address?: Address;
  phone?: string;
  email?: string;
  ownerId: string;
  rating?: number;
  ratingCount?: number;
  deliveryTime?: number; // minutes
  deliveryFee?: number;
  minOrderValue?: number;
  isActive?: boolean;
  isOpen?: boolean;
  openingHours?: { open?: string; close?: string };
  imageUrl?: string;
  bannerUrl?: string;
  tags?: string[]; // 'fast_delivery', 'free_delivery', 'new', 'popular'
  distance?: number; // km from user
  createdAt?: string;
  updatedAt?: string;
}

export interface MenuItem {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  price: number;
  discountPrice?: number;
  category: string;
  restaurantId: string;
  imageUrl?: string;
  badges?: string[]; // 'spicy', 'bestseller', 'new', 'limited'
  isAvailable?: boolean;
  preparationTime?: number;
  ingredients?: string[];
  allergens?: string[];
  dietaryRestrictions?: DietaryRestriction[];
  ratings?: number;
  ratingCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  specialInstructions?: string;
}

export interface CartItem extends OrderItem {
  restaurantId: string;
  imageUrl?: string;
  discountPrice?: number;
}

export interface Order {
  _id?: string;
  id?: string;
  userId: string;
  restaurantId: string;
  restaurantName?: string;
  items: OrderItem[];
  totalAmount: number;
  subtotal?: number;
  tax?: number;
  deliveryFee?: number;
  discount?: number;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod: PaymentMethod;
  deliveryAddress: Required<Address>;
  specialInstructions?: string;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  deliveryId?: string;
  driverId?: string;
  driverName?: string;
  driverRating?: number;
  rating?: number;
  review?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Driver {
  _id?: string;
  id?: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  vehicleType: VehicleType;
  vehicleNumber?: string;
  licenseNumber?: string;
  phoneNumber?: string;
  isAvailable?: boolean;
  isVerified?: boolean;
  currentLocation?: GeoLocation;
  rating?: number;
  ratingCount?: number;
  totalDeliveries?: number;
  totalEarnings?: number;
  avatar?: string;
  bankDetails?: {
    accountNumber?: string;
    ifscCode?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface Delivery {
  _id?: string;
  id?: string;
  orderId: string;
  driverId?: string;
  driverName?: string;
  status?: DeliveryStatus;
  pickupAddress: Required<Address>;
  deliveryAddress: Required<Address>;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  currentLocation?: GeoLocation;
  distance?: number;
  deliveryFee?: number;
  notes?: string;
  otp?: string; // One-time password for delivery verification
  createdAt?: string;
  updatedAt?: string;
}

export interface HealthStatus {
  status: string;
  service: string;
  timestamp: string;
}

export interface Rating {
  id?: string;
  userId: string;
  orderId: string;
  restaurantId?: string;
  driverId?: string;
  rating: number; // 1-5
  review?: string;
  createdAt?: string;
}

export interface Coupon {
  id?: string;
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue?: number;
  maxDiscount?: number;
  expiryDate: string;
  usageLimit?: number;
  usageCount?: number;
  isActive?: boolean;
}

export interface Notification {
  id?: string;
  userId: string;
  type: 'order' | 'delivery' | 'promotion' | 'system';
  title: string;
  message: string;
  data?: any;
  isRead?: boolean;
  createdAt?: string;
}

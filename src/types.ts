/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  name: string;
  basePrice: number;
  category: string;
  imageUrl: string;
  description: string;
  requiresDimensions?: boolean;
  unit?: string;
  isUnlisted?: boolean;
}

export interface CartItem {
  id: string; // unique item id
  product: Product;
  quantity: number;
  notes?: string;
  subtotal: number;
  width?: number;
  height?: number;
  overridePrice?: number;
}

export type PaymentType = 
  | 'Full Payment' 
  | 'Down Payment' 
  | 'Pending - Waiting for Payment'
  | 'Pending Payment Verification'
  | 'Down Payment Received'
  | 'Partially Paid'
  | 'Fully Paid'
  | 'Payment Settled';
export type PaymentMethod = 'Cash' | 'GCash' | 'Bank Transfer';
export type OrderStatus = 
  | 'Pending' 
  | 'Printing' 
  | 'Ready for Pickup' 
  | 'Completed'
  | 'Order Received'
  | 'Payment Verified'
  | 'Preparing Design'
  | 'Waiting for Approval'
  | 'Printing in Progress'
  | 'Quality Checking'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export interface Order {
  id: string; // JKM-YYYYMMDD-XXX
  customerName: string;
  customerContact?: string;
  date: string;
  time: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  grandTotal: number;
  paymentType: PaymentType;
  paymentMethod: PaymentMethod;
  downPaymentAmount: number;
  remainingBalance: number;
  amountPaid: number;
  change: number;
  status: OrderStatus;
  notes?: string;
  deliveryMethod?: 'pickup' | 'delivery';
  deliveryAddress?: string;
  selectedCourier?: string;
  additionalInstructions?: string;
  designLink?: string;
  trackingNumber?: string;
  estimatedCompletionDate?: string;
  trackingUpdates?: {
    status: OrderStatus;
    timestamp: string;
    note?: string;
    images?: string[];
  }[];
  deliveryStatus?: 'Waiting for Shipment' | 'Packed' | 'Shipped' | 'Out for Delivery' | 'Delivered';
  dateShipped?: string;
  proofOfDelivery?: string;
  uploadedFiles?: { name: string; url: string; date: string; size: string; category: string }[];
  paymentSubmissions?: { id: string; amount: number; referenceNumber: string; method: string; date: string; status: 'Pending' | 'Approved' | 'Rejected'; proofImage?: string }[];
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
  minThreshold: number;
  price?: number;
  packaging?: string;
}

export interface ReelItem {
  id: string;
  title: string;
  facebookUrl: string;
}

export interface MaterialEquipment {
  id: string;
  name: string;
  quantity: string;
  contributions: number;
  contributor: string;
  date: string;
  type: 'Equipment' | 'Material';
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string;
  loggedBy: string;
  description: string;
}

export interface QuotationItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Quotation {
  id: string;
  customerName: string;
  date: string;
  items: QuotationItem[];
  total: number;
}

export interface UserLog {
  id: string;
  user: string;
  action: string;
  time: string;
  date: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  description: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  rating: number;
  comment: string;
  date: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

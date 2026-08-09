import type { PaginationMeta } from './api';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
export type PaymentMethod = 'COD' | 'STRIPE' | 'PAYPAL' | 'VNPAY' | 'MOMO';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  selectedOptionsSnapshot: string[] | null;
  product: { images: { url: string; altText?: string | null }[] };
}

export interface OrderStatusLog {
  id: string;
  previousStatus: OrderStatus | null;
  newStatus: OrderStatus;
  note: string | null;
  createdAt: string;
  changedBy?: { fullName: string } | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  subtotal: string;
  discountAmount: string;
  couponCodeSnapshot: string | null;
  couponDiscountTypeSnapshot: 'FIXED_AMOUNT' | 'PERCENTAGE' | null;
  couponDiscountValueSnapshot: string | null;
  couponAppliedUnitPrice: string | null;
  shippingFee: string;
  totalAmount: string;
  createdAt: string;
  updatedAt: string;
  shippingRecipientName: string | null;
  shippingRecipientPhone: string | null;
  shippingStreetAddress: string | null;
  shippingProvinceName: string | null;
  shippingWardName: string | null;
  shippingAddressNote: string | null;
  items: OrderItem[];
  payment: {
    status: PaymentStatus;
    provider: PaymentMethod;
    amount: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  coupon: { code: string } | null;
  statusLogs: OrderStatusLog[];
  user?: { fullName: string; email: string; phone: string | null };
}

export interface OrdersPage {
  items: Order[];
  meta: PaginationMeta;
}

export interface AdminOrderSummary {
  totalOrders: number;
  pendingOrders: number;
  preparingOrders: number;
  shippingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  deliveredRevenue: string;
}

export interface CustomerOrdersQuery {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  sort?: 'newest' | 'oldest';
}

export interface AdminOrdersQuery
  extends Omit<CustomerOrdersQuery, 'sort'> {
  paymentStatus?: PaymentStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: 'newest' | 'oldest' | 'highest-total' | 'lowest-total' | 'total';
}

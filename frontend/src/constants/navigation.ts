import type { LucideIcon } from 'lucide-react';
import {
  Bell,
  Building2,
  Ticket,
  Home,
  LayoutDashboard,
  Package,
  ReceiptText,
  ShoppingCart,
  UserRound,
} from 'lucide-react';

export interface NavigationItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles?: string[];
}

export const primaryNavigation: NavigationItem[] = [
  { href: '/', label: 'Trang chủ', icon: Home },
  { href: '/products', label: 'Sản phẩm', icon: Package },
  { href: '/categories', label: 'Danh mục', icon: Building2 },
  { href: '/cart', label: 'Giỏ hàng', icon: ShoppingCart },
  { href: '/coupons', label: 'Mã giảm giá', icon: Ticket },
  { href: '/orders', label: 'Đơn hàng', icon: ReceiptText },
  { href: '/notifications', label: 'Thông báo', icon: Bell },
  { href: '/profile', label: 'Tài khoản', icon: UserRound },
];

export const adminNavigation: NavigationItem[] = [
  {
    href: '/admin',
    label: 'Tổng quan',
    icon: LayoutDashboard,
    roles: ['ADMIN'],
  },
  {
    href: '/admin/categories',
    label: 'Danh mục',
    icon: Building2,
    roles: ['ADMIN'],
  },
  {
    href: '/admin/products',
    label: 'Sản phẩm',
    icon: Package,
    roles: ['ADMIN'],
  },
  {
    href: '/admin/coupons',
    label: 'Mã giảm giá',
    icon: Ticket,
    roles: ['ADMIN'],
  },
  {
    href: '/admin/orders',
    label: 'Đơn hàng',
    icon: ReceiptText,
    roles: ['ADMIN'],
  },
  {
    href: '/admin/users',
    label: 'Người dùng',
    icon: UserRound,
    roles: ['ADMIN'],
  },
  {
    href: '/admin/restaurants',
    label: 'Nhà hàng',
    icon: Building2,
    roles: ['ADMIN'],
  },
];

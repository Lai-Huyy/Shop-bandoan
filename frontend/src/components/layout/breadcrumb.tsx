'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { usePathname } from 'next/navigation';

const labels: Record<string, string> = {
  admin: 'Admin',
  cart: 'Cart',
  categories: 'Categories',
  checkout: 'Checkout',
  notifications: 'Notifications',
  orders: 'Orders',
  products: 'Products',
  profile: 'Profile',
  register: 'Register',
  restaurants: 'Restaurants',
  users: 'Users',
};

export function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  if (!segments.length) return null;
  return (
    <nav
      className="mb-6 flex flex-wrap items-center gap-1 text-sm text-muted-foreground"
      aria-label="Breadcrumb"
    >
      <Link href="/" className="hover:text-foreground">
        Home
      </Link>
      {segments.map((segment, index) => {
        const href = `/${segments.slice(0, index + 1).join('/')}`;
        const label = labels[segment] ?? segment;
        const current = index === segments.length - 1;
        return (
          <span key={href} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5" />
            {current ? (
              <span className="capitalize text-foreground">{label}</span>
            ) : (
              <Link href={href} className="capitalize hover:text-foreground">
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

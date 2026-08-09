'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  primaryNavigation,
  adminNavigation,
  type NavigationItem,
} from '@/constants/navigation';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

function NavigationLinks({ items }: { items: NavigationItem[] }) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <nav className="space-y-1">
      {items
        .filter(
          (item) => !item.roles || (user && item.roles.includes(user.role)),
        )
        .map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(`${item.href}/`));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground',
                active && 'bg-secondary text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
    </nav>
  );
}

export function Sidebar() {
  const { user } = useAuth();
  return (
    <aside className="hidden w-60 shrink-0 border-r bg-card p-4 lg:block">
      <Link href="/" className="mb-8 flex items-center gap-3 text-xl font-bold text-primary">
        <Image
          src="/brand/nicega-store-logo.png"
          alt="NICEGA STORE"
          width={48}
          height={48}
          priority
          className="rounded-xl border border-orange-500/30"
        />
        <span>NICEGA STORE</span>
      </Link>
      <NavigationLinks items={primaryNavigation} />
      {user?.role === 'ADMIN' ? (
        <div className="mt-8">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Administration
          </p>
          <NavigationLinks items={adminNavigation} />
        </div>
      ) : null}
    </aside>
  );
}

export function SidebarNavigation() {
  return <NavigationLinks items={[...primaryNavigation, ...adminNavigation]} />;
}

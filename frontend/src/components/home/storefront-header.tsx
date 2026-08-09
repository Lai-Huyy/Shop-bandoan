'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Menu, Search, ShoppingBag, UserRound, X } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { useAuthDialog } from '@/hooks/use-auth-dialog';
import { cn } from '@/lib/utils';
import { cartService } from '@/services/cart.service';

const navigation = [
  { href: '/', label: 'Trang chủ' },
  { href: '/categories', label: 'Danh mục' },
  { href: '/products', label: 'Sản phẩm' },
  { href: '/coupons', label: 'Ưu đãi' },
];

export function StorefrontHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { openAuthDialog } = useAuthDialog();
  const [isScrolled, setIsScrolled] = useState(false);
  const [search, setSearch] = useState('');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: cartService.get,
    enabled: Boolean(user),
  });

  useEffect(() => {
    const updateScrolled = () => setIsScrolled(window.scrollY > 12);
    updateScrolled();
    window.addEventListener('scroll', updateScrolled, { passive: true });
    return () => window.removeEventListener('scroll', updateScrolled);
  }, []);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedSearch = search.trim();
    router.push(
      normalizedSearch
        ? `/products?search=${encodeURIComponent(normalizedSearch)}`
        : '/products',
    );
  }

  function renderNavigation(mobile = false) {
    return navigation.map((item) => {
      const active = pathname === item.href;
      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={(event) => {
            if (mobile) setIsMobileOpen(false);
            if (!user && item.href !== '/') {
              event.preventDefault();
              openAuthDialog('login', () => router.push(item.href));
            }
          }}
          className={cn(
            'rounded-full px-3 py-2 text-sm font-semibold transition-colors hover:text-orange-600',
            active
              ? 'bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300'
              : 'text-slate-600 dark:text-slate-300',
          )}
        >
          {item.label}
        </Link>
      );
    });
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl transition-all dark:border-slate-800 dark:bg-slate-950/90',
        isScrolled
          ? 'shadow-md shadow-slate-950/5'
          : 'shadow-sm shadow-slate-950/[0.02]',
      )}
    >
      <div
        className={cn(
          'mx-auto flex max-w-7xl items-center gap-3 px-4 transition-all sm:px-6 lg:px-8',
          isScrolled ? 'h-16' : 'h-[4.75rem]',
        )}
      >
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2"
          aria-label="NICEGA STORE - Trang chủ"
        >
          <Image
            src="/brand/nicega-store-logo.png"
            alt="NICEGA STORE"
            width={56}
            height={56}
            priority
            className="h-11 w-11 rounded-xl border border-orange-500/25 object-cover shadow-sm"
          />
          <span className="hidden text-base font-black tracking-tight text-slate-950 dark:text-white sm:inline">
            NICEGA <span className="text-orange-500">STORE</span>
          </span>
        </Link>

        <nav
          className="hidden items-center gap-1 lg:flex"
          aria-label="Điều hướng chính"
        >
          {renderNavigation()}
          {user ? (
            <Link
              href="/orders"
              className="rounded-full px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:text-orange-600 dark:text-slate-300"
            >
              Đơn hàng
            </Link>
          ) : null}
        </nav>

        <form
          onSubmit={submitSearch}
          className="ml-auto hidden max-w-xs flex-1 lg:flex"
        >
          <label className="sr-only" htmlFor="storefront-search">
            Tìm kiếm sản phẩm
          </label>
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="storefront-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm sản phẩm..."
              className="h-10 rounded-full border-slate-200 bg-slate-50 pl-9 dark:border-slate-800 dark:bg-slate-900"
            />
          </div>
        </form>

        <Button
          variant="ghost"
          size="icon"
          className="relative shrink-0 rounded-full"
          aria-label="Giỏ hàng"
          onClick={() =>
            user
              ? router.push('/cart')
              : openAuthDialog('login', () => router.push('/cart'))
          }
        >
          <ShoppingBag className="h-5 w-5" />
          {cart?.itemCount ? (
            <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-orange-500 px-1 text-xs font-bold leading-5 text-white">
              {cart.itemCount > 99 ? '99+' : cart.itemCount}
            </span>
          ) : null}
        </Button>
        {user ? (
          <Button
            asChild
            variant="outline"
            className="hidden rounded-full sm:inline-flex"
          >
            <Link href="/profile">
              <UserRound className="h-4 w-4" />
              Tài khoản
            </Link>
          </Button>
        ) : (
          <div className="hidden items-center gap-2 sm:flex">
            <Button
              variant="outline"
              className="rounded-full border-slate-300 bg-white text-slate-900 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
              onClick={() => openAuthDialog('login')}
            >
              Đăng nhập
            </Button>
            <Button
              className="rounded-full bg-orange-500 hover:bg-orange-600"
              onClick={() => openAuthDialog('register')}
            >
              Đăng ký
            </Button>
          </div>
        )}

        <Drawer open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <DrawerTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full lg:hidden"
              aria-label="Mở menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="w-[min(24rem,92vw)] bg-white dark:bg-slate-950">
            <div className="flex items-center justify-between">
              <Link
                href="/"
                onClick={() => setIsMobileOpen(false)}
                className="flex items-center gap-2 font-black"
              >
                <Image
                  src="/brand/nicega-store-logo.png"
                  alt="NICEGA STORE"
                  width={42}
                  height={42}
                  className="rounded-xl border border-orange-500/25"
                />
                NICEGA <span className="text-orange-500">STORE</span>
              </Link>
              <DrawerClose asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  aria-label="Đóng menu"
                >
                  <X className="h-5 w-5" />
                </Button>
              </DrawerClose>
            </div>
            <form
              onSubmit={submitSearch}
              className="mt-7"
              onClick={() => setIsMobileOpen(false)}
            >
              <label className="sr-only" htmlFor="mobile-storefront-search">
                Tìm kiếm sản phẩm
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="mobile-storefront-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tìm sản phẩm..."
                  className="h-11 rounded-xl pl-9"
                />
              </div>
            </form>
            <nav
              className="mt-5 flex flex-col gap-1"
              aria-label="Điều hướng di động"
            >
              {renderNavigation(true)}
              {user ? (
                <Link
                  href="/orders"
                  onClick={() => setIsMobileOpen(false)}
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300"
                >
                  Đơn hàng
                </Link>
              ) : null}
            </nav>
            <div className="mt-auto border-t pt-5 dark:border-slate-800">
              {user ? (
                <Button
                  asChild
                  className="w-full rounded-xl"
                  onClick={() => setIsMobileOpen(false)}
                >
                  <Link href="/profile">Tài khoản của tôi</Link>
                </Button>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => {
                      setIsMobileOpen(false);
                      openAuthDialog('login');
                    }}
                  >
                    Đăng nhập
                  </Button>
                  <Button
                    className="rounded-xl bg-orange-500 hover:bg-orange-600"
                    onClick={() => {
                      setIsMobileOpen(false);
                      openAuthDialog('register');
                    }}
                  >
                    Đăng ký
                  </Button>
                </div>
              )}
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </header>
  );
}

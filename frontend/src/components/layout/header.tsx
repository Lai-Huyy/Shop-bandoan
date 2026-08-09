'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { LogOut, ShoppingCart } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import { useAuthDialog } from '@/hooks/use-auth-dialog';
import { cartService } from '@/services/cart.service';
import { MobileNavigation } from './mobile-navigation';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { openAuthDialog } = useAuthDialog();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: cartService.get,
    enabled: Boolean(user),
  });

  async function handleLogout() {
    try {
      await logout();
      toast.success('Đã đăng xuất.');
    } catch {
      toast.error(
        'Không thể liên hệ máy chủ, nhưng phiên trên thiết bị này đã được kết thúc.',
      );
    } finally {
      router.replace('/');
    }
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur lg:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <MobileNavigation />
        <Link
          href="/"
          className={`flex min-w-0 items-center gap-2 ${
            pathname === '/' ? '' : 'lg:hidden'
          }`}
        >
          <Image
            src="/brand/nicega-store-logo.png"
            alt="NICEGA STORE"
            width={56}
            height={56}
            priority
            className="h-10 w-10 rounded-xl border border-orange-500/30 object-cover sm:h-12 sm:w-12"
          />
          <span className="truncate text-sm font-black tracking-wide text-primary sm:text-base">
            NICEGA STORE
          </span>
        </Link>
      </div>
      <div className="flex items-center gap-2">
        {user ? (
          <>
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="relative"
              aria-label="Giỏ hàng"
            >
              <Link href="/cart">
                <ShoppingCart className="h-5 w-5" />
                {cart?.itemCount ? (
                  <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-orange-500 px-1 text-xs font-bold leading-5 text-white">
                    {cart.itemCount > 99 ? '99+' : cart.itemCount}
                  </span>
                ) : null}
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring">
                  <Avatar
                    alt={user.fullName}
                    fallback={user.fullName.slice(0, 2).toUpperCase()}
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => router.push('/profile')}>
                  {user.fullName}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setIsLogoutDialogOpen(true)}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={() => openAuthDialog('login')}>
              Đăng nhập
            </Button>
            <Button onClick={() => openAuthDialog('register')}>Đăng ký</Button>
          </>
        )}
      </div>
      <ConfirmDialog
        open={isLogoutDialogOpen}
        onOpenChange={setIsLogoutDialogOpen}
        title="Đăng xuất"
        description="Bạn có chắc chắn muốn đăng xuất khỏi NICEGA STORE?"
        icon={LogOut}
        variant="warning"
        confirmLabel="Đăng xuất"
        cancelLabel="Ở lại"
        onConfirm={handleLogout}
      />
    </header>
  );
}

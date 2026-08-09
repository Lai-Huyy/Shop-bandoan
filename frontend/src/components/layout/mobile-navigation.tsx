'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { SidebarNavigation } from './sidebar';

export function MobileNavigation() {
  const [open, setOpen] = useState(false);
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          className="lg:hidden"
          variant="ghost"
          size="icon"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-3 text-xl font-bold text-primary"
            onClick={() => setOpen(false)}
          >
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
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" aria-label="Close navigation">
              <X className="h-5 w-5" />
            </Button>
          </DrawerClose>
        </div>
        <div onClick={() => setOpen(false)}>
          <SidebarNavigation />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

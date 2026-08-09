'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { checkoutService } from '@/services/checkout.service';
import { AddressSelectorDialog } from './address-selector-dialog';

export function AddressBook() {
  const [open, setOpen] = useState(false);
  const { data, isLoading, refetch } = useQuery({ queryKey: ['addresses'], queryFn: checkoutService.getAddresses });
  if (isLoading) return <Skeleton className="h-28 rounded-xl" />;
  return <section className="rounded-xl border p-5"><div className="flex items-center justify-between gap-3"><div><h2 className="flex items-center gap-2 font-semibold"><MapPin className="h-5 w-5 text-orange-600" />Sổ địa chỉ</h2><p className="mt-1 text-sm text-muted-foreground">{data?.length ? `${data.length} địa chỉ đã lưu` : 'Chưa có địa chỉ giao hàng'}</p></div><Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Quản lý</Button></div><AddressSelectorDialog open={open} addresses={data ?? []} selectedId={data?.find((address) => address.isDefault)?.id ?? ''} onOpenChange={setOpen} onSelected={() => setOpen(false)} onRefresh={() => refetch()} /></section>;
}

'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { checkoutService } from '@/services/checkout.service';
import type { AddressInput, UserAddress } from '@/types/checkout';
import { AddressCard } from './address-card';
import { AddressForm } from './address-form';

function toInput(
  address: UserAddress,
  isDefault = address.isDefault,
): AddressInput {
  return {
    recipientName: address.recipientName,
    recipientPhone: address.recipientPhone,
    provinceCode: address.provinceCode ?? '',
    provinceName: address.provinceName ?? address.city,
    wardCode: address.wardCode ?? '',
    wardName: address.wardName ?? address.ward ?? '',
    streetAddress: address.streetAddress,
    note: address.note ?? '',
    isDefault,
  };
}

interface AddressSelectorDialogProps {
  open: boolean;
  addresses: UserAddress[];
  selectedId: string;
  onOpenChange(open: boolean): void;
  onSelected(address: UserAddress): void;
  onRefresh(): Promise<unknown>;
}

export function AddressSelectorDialog({
  open,
  addresses,
  selectedId,
  onOpenChange,
  onSelected,
  onRefresh,
}: AddressSelectorDialogProps) {
  const [editing, setEditing] = useState<UserAddress>();
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async (data: AddressInput) => {
    setSaving(true);
    try {
      const address = editing
        ? await checkoutService.updateAddress(editing.id, data)
        : await checkoutService.createAddress(data);
      await onRefresh();
      onSelected(address);
      setCreating(false);
      setEditing(undefined);
      toast.success('Đã lưu địa chỉ.');
    } catch {
      toast.error('Không thể lưu địa chỉ.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await checkoutService.deleteAddress(id);
      await onRefresh();
      toast.success('Đã xóa địa chỉ.');
    } catch {
      toast.error('Không thể xóa địa chỉ.');
    }
  };

  const setDefault = async (address: UserAddress) => {
    setSaving(true);
    try {
      const updated = await checkoutService.updateAddress(
        address.id,
        toInput(address, true),
      );
      await onRefresh();
      onSelected(updated);
      toast.success('Đã đặt địa chỉ mặc định.');
    } catch {
      toast.error('Không thể cập nhật địa chỉ mặc định.');
    } finally {
      setSaving(false);
    }
  };

  const showForm = creating || Boolean(editing);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogTitle>
          {showForm
            ? editing
              ? 'Sửa địa chỉ'
              : 'Thêm địa chỉ mới'
            : 'Chọn địa chỉ giao hàng'}
        </DialogTitle>
        <DialogDescription className="mt-1">
          Quản lý các địa chỉ giao hàng đã lưu của bạn.
        </DialogDescription>
        {showForm ? (
          <div className="mt-5">
            <AddressForm
              address={editing}
              onCancel={() => {
                setCreating(false);
                setEditing(undefined);
              }}
              onSave={save}
              isSaving={saving}
            />
          </div>
        ) : (
          <div className="mt-5">
            <div className="mb-4 flex justify-end">
              <Button size="sm" onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" />
                Thêm địa chỉ
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {addresses.map((address) => (
                <AddressCard
                  key={address.id}
                  address={address}
                  selected={selectedId === address.id}
                  onSelect={() => {
                    onSelected(address);
                    onOpenChange(false);
                  }}
                  onEdit={() => setEditing(address)}
                  onDelete={() => remove(address.id)}
                  onSetDefault={() => setDefault(address)}
                />
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

import { MapPin, MapPinOff, Pencil, Star, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import type { UserAddress } from '@/types/checkout';

interface AddressCardProps {
  address: UserAddress;
  selected?: boolean;
  onSelect?(): void;
  onEdit?(): void;
  onDelete?(): Promise<unknown>;
  onSetDefault?(): Promise<unknown>;
}

export function AddressCard({
  address,
  selected,
  onSelect,
  onEdit,
  onDelete,
  onSetDefault,
}: AddressCardProps) {
  const province = address.provinceName ?? address.city;
  const ward = address.wardName ?? address.ward;

  return (
    <article
      className={`rounded-xl border p-4 transition ${
        selected
          ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
          : 'bg-card'
      }`}
    >
      <div className="flex gap-3">
        <input
          type="radio"
          checked={selected}
          onChange={onSelect}
          aria-label={`Chọn địa chỉ ${address.recipientName}`}
        />
        <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{address.recipientName}</h3>
            {address.isDefault ? <Badge>Mặc định</Badge> : null}
          </div>
          <p className="mt-1 text-sm">{address.recipientPhone}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {[address.streetAddress, ward, province].filter(Boolean).join(', ')}
          </p>
          {address.note ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Ghi chú: {address.note}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-1">
            {onSelect ? (
              <Button size="sm" variant="outline" onClick={onSelect}>
                Chọn
              </Button>
            ) : null}
            {onEdit ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={onEdit}
                aria-label="Sửa địa chỉ"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            ) : null}
            {onSetDefault && !address.isDefault ? (
              <ConfirmDialog
                trigger={
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label="Đặt làm mặc định"
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                }
                title="Đặt địa chỉ mặc định"
                description={`Địa chỉ của ${address.recipientName} sẽ được chọn mặc định cho các đơn hàng sau.`}
                icon={Star}
                variant="info"
                confirmLabel="Đặt mặc định"
                onConfirm={onSetDefault}
              />
            ) : null}
            {onDelete ? (
              <ConfirmDialog
                trigger={
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    aria-label="Xóa địa chỉ"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                }
                title="Xóa địa chỉ"
                description="Địa chỉ này sẽ bị xóa khỏi sổ địa chỉ."
                warning="Bạn sẽ cần chọn hoặc tạo địa chỉ khác cho đơn hàng tiếp theo."
                icon={MapPinOff}
                confirmLabel="Xóa địa chỉ"
                onConfirm={onDelete}
              />
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

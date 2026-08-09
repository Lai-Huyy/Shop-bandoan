'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import type { AdminUser, UpdateAdminUserInput } from '@/types/admin-user';

interface EditUserDialogProps {
  user: AdminUser | null;
  open: boolean;
  isSaving: boolean;
  onOpenChange(open: boolean): void;
  onSave(userId: string, data: UpdateAdminUserInput): void;
}

export function EditUserDialog({
  user,
  open,
  isSaving,
  onOpenChange,
  onSave,
}: EditUserDialogProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [role, setRole] = useState('CUSTOMER');

  useEffect(() => {
    if (!user) return;
    setFullName(user.fullName);
    setEmail(user.email);
    setPhone(user.phone ?? '');
    setAvatarUrl(user.avatarUrl ?? '');
    setRole(user.role);
  }, [user]);

  if (!user) return null;

  const roles = Array.from(new Set([user.role, 'CUSTOMER', 'ADMIN']));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogTitle>Chỉnh sửa người dùng</DialogTitle>
        <DialogDescription className="mt-2 text-sm text-muted-foreground">
          Mật khẩu và trạng thái tài khoản được quản lý ở luồng riêng.
        </DialogDescription>
        <form
          className="mt-5 grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            onSave(user.id, {
              fullName: fullName.trim(),
              email: email.trim(),
              phone: phone.trim() || undefined,
              avatarUrl: avatarUrl.trim() || undefined,
              role,
            });
          }}
        >
          <label className="grid gap-2 text-sm font-medium">
            Họ và tên
            <Input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
              maxLength={100}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Email
            <Input
              value={email}
              type="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              maxLength={255}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Số điện thoại
            <Input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              maxLength={20}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            URL ảnh đại diện
            <Input
              value={avatarUrl}
              type="url"
              onChange={(event) => setAvatarUrl(event.target.value)}
              placeholder="https://..."
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Vai trò
            <Select
              value={role}
              onChange={(event) => setRole(event.target.value)}
            >
              {roles.map((item) => (
                <option key={item} value={item}>
                  {item === 'ADMIN'
                    ? 'Quản trị viên'
                    : item === 'CUSTOMER'
                      ? 'Khách hàng'
                      : item}
                </option>
              ))}
            </Select>
          </label>
          <div className="mt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

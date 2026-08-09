'use client';

import { KeyRound, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { AddressBook } from '@/features/addresses/address-book';

export default function ProfilePage() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <section className="space-y-6">
      <PageHeader
        title="Tài khoản của tôi"
        description="Quản lý thông tin cá nhân và bảo mật tài khoản."
        action={
          <Button variant="outline" onClick={() => window.location.assign('/profile/change-password')}>
            <KeyRound className="mr-2 h-4 w-4" /> Đổi mật khẩu
          </Button>
        }
      />
      <Card className="overflow-hidden">
        <CardHeader className="flex-row items-center gap-4 border-b bg-muted/30">
          <Avatar
            alt={user.fullName}
            fallback={user.fullName.slice(0, 2).toUpperCase()}
            className="h-14 w-14"
          />
          <div>
            <CardTitle>{user.fullName}</CardTitle>
            <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"><ShieldCheck className="h-3.5 w-3.5" />{user.role === 'ADMIN' ? 'Quản trị viên' : 'Khách hàng'}</p>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4">
              <dt className="flex items-center gap-2 text-sm text-muted-foreground"><UserRound className="h-4 w-4" />Tên đăng nhập</dt>
              <dd className="mt-2 font-medium">{user.username}</dd>
            </div>
            <div className="rounded-lg border p-4">
              <dt className="flex items-center gap-2 text-sm text-muted-foreground"><Mail className="h-4 w-4" />Email</dt>
              <dd className="mt-2 break-all font-medium">{user.email}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
      <AddressBook />
    </section>
  );
}

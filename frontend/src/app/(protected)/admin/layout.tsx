import type { ReactNode } from 'react';
import { RoleGuard } from '@/components/common/role-guard';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <RoleGuard roles={['ADMIN']}>{children}</RoleGuard>;
}

'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { LoadingState } from './loading-state';

export function RoleGuard({
  roles,
  children,
}: {
  roles: string[];
  children: ReactNode;
}) {
  const router = useRouter();
  const { user, isReady } = useAuth();
  const permitted = user ? roles.includes(user.role) : false;

  useEffect(() => {
    if (isReady && !permitted) router.replace('/unauthorized');
  }, [isReady, permitted, router]);

  if (!isReady || !permitted)
    return <LoadingState label="Checking permissions" />;
  return <>{children}</>;
}

'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { LoadingState } from './loading-state';

export function PublicRoute({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isReady } = useAuth();

  useEffect(() => {
    if (isReady && isAuthenticated) router.replace('/profile');
  }, [isAuthenticated, isReady, router]);

  if (!isReady || isAuthenticated)
    return <LoadingState label="Checking your session" />;
  return <>{children}</>;
}

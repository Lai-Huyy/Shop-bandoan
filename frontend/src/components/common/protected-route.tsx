'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { LoadingState } from './loading-state';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isReady } = useAuth();

  useEffect(() => {
    if (isReady && !isAuthenticated) router.replace('/');
  }, [isAuthenticated, isReady, router]);

  if (!isReady || !isAuthenticated)
    return <LoadingState label="Restoring your session" />;
  return <>{children}</>;
}

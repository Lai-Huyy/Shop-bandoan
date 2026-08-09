import type { ReactNode } from 'react';
import { PublicRoute } from '@/components/common/public-route';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <PublicRoute>
      <main className="flex min-h-screen items-center justify-center bg-secondary p-4">
        {children}
      </main>
    </PublicRoute>
  );
}

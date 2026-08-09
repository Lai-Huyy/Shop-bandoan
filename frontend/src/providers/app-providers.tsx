'use client';

import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { AuthProvider } from './auth-provider';
import { AuthDialogProvider } from './auth-dialog-provider';
import { QueryProvider } from './query-provider';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryProvider>
        <AuthProvider>
          <AuthDialogProvider>{children}</AuthDialogProvider>
        </AuthProvider>
      </QueryProvider>
      <Toaster richColors closeButton />
    </ThemeProvider>
  );
}

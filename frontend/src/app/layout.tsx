import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { AppProviders } from '@/providers/app-providers';

export const metadata: Metadata = {
  title: { default: 'NICEGA STORE', template: '%s | NICEGA STORE' },
  description: 'Online food ordering and ecommerce platform.',
  icons: { icon: '/brand/nicega-store-logo.png' },
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

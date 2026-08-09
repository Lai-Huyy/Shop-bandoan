import type { ReactNode } from 'react';
import { Breadcrumb } from './breadcrumb';
import { Footer } from './footer';
import { Header } from './header';
import { Sidebar } from './sidebar';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 p-4 md:p-6">
          <Breadcrumb />
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}

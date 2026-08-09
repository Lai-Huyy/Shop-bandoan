import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function FilterPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <aside
      className={cn('rounded-lg border bg-card p-4', className)}
      aria-label="Filters"
    >
      {children}
    </aside>
  );
}

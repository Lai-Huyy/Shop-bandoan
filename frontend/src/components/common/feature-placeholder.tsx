import type { ReactNode } from 'react';
import { Construction } from 'lucide-react';
import { EmptyState } from './empty-state';
import { PageHeader } from './page-header';

export function FeaturePlaceholder({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <section className="space-y-6">
      <PageHeader title={title} description={description} />
      {children ?? (
        <EmptyState
          title={`${title} is coming soon`}
          description="The interface is ready; this feature will become interactive when its backend API is delivered."
          action={
            <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Construction className="h-4 w-4" />
              Backend integration pending
            </span>
          }
        />
      )}
    </section>
  );
}

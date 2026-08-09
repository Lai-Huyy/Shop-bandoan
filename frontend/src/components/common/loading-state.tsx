import { LoadingSpinner } from '@/components/ui/loading-spinner';

export function LoadingState({
  label = 'Loading content',
}: {
  label?: string;
}) {
  return (
    <div className="flex min-h-48 items-center justify-center gap-2 text-muted-foreground">
      <LoadingSpinner />
      {label}
    </div>
  );
}

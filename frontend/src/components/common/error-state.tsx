'use client';

import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ErrorState({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <section className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center">
      <AlertCircle className="mb-3 h-8 w-8 text-destructive" />
      <h2 className="font-semibold">Unable to load this content</h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{message}</p>
      {retry ? (
        <Button className="mt-4" variant="outline" onClick={retry}>
          Try again
        </Button>
      ) : null}
    </section>
  );
}

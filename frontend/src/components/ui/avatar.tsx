'use client';

import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Avatar({
  src,
  alt,
  fallback,
  className,
}: {
  src?: string | null;
  alt: string;
  fallback: string;
  className?: string;
}) {
  return (
    <AvatarPrimitive.Root
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary',
        className,
      )}
    >
      {src ? (
        <AvatarPrimitive.Image
          className="h-full w-full object-cover"
          src={src}
          alt={alt}
        />
      ) : null}
      <AvatarPrimitive.Fallback className="text-xs font-medium">
        {fallback || <User className="h-4 w-4" />}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}

'use client';

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

export const RadioGroup = RadioGroupPrimitive.Root;

export function Radio({
  className,
  ...props
}: RadioGroupPrimitive.RadioGroupItemProps) {
  return (
    <RadioGroupPrimitive.Item
      className={cn(
        'flex h-4 w-4 items-center justify-center rounded-full border focus:ring-2 focus:ring-ring',
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator>
        <Circle className="h-2.5 w-2.5 fill-primary text-primary" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
}

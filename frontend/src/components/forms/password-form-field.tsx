'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FormField, type FormFieldProps } from './form-field';

export function PasswordFormField({ className, ...props }: FormFieldProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <FormField
      {...props}
      type={isVisible ? 'text' : 'password'}
      className={cn('pr-11', className)}
      endAdornment={
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full"
          onClick={() => setIsVisible((current) => !current)}
          aria-label={isVisible ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
        >
          {isVisible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
      }
    />
  );
}

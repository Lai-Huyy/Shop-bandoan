import type { InputHTMLAttributes, ReactNode } from 'react';
import { Input } from '@/components/ui/input';

export interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  inputId: string;
  endAdornment?: ReactNode;
}

export function FormField({
  label,
  error,
  inputId,
  endAdornment,
  ...inputProps
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <Input id={inputId} aria-invalid={Boolean(error)} {...inputProps} />
        {endAdornment}
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

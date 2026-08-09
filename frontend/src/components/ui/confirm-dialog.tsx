'use client';

import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { AlertTriangle, LoaderCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Button } from './button';
import { cn } from '@/lib/utils';

type ConfirmDialogVariant = 'danger' | 'warning' | 'info' | 'success';

interface ConfirmDialogProps {
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?(open: boolean): void;
  title: string;
  description: ReactNode;
  warning?: ReactNode;
  icon?: LucideIcon;
  variant?: ConfirmDialogVariant;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  onConfirm(): void | Promise<unknown>;
}

const variantClasses: Record<ConfirmDialogVariant, string> = {
  danger: 'bg-destructive/10 text-destructive',
  warning: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
};

export function ConfirmDialog({
  trigger,
  open,
  onOpenChange,
  title,
  description,
  warning,
  icon: Icon = AlertTriangle,
  variant = 'danger',
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  isLoading = false,
  onConfirm,
}: ConfirmDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isOpen = open ?? uncontrolledOpen;
  const isPending = isLoading || isSubmitting;

  const setDialogOpen = (nextOpen: boolean) => {
    if (isPending) return;
    if (open === undefined) setUncontrolledOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  const handleConfirm = async () => {
    if (isPending) return;

    setIsSubmitting(true);
    try {
      await onConfirm();
      if (open === undefined) setUncontrolledOpen(false);
      onOpenChange?.(false);
    } catch {
      // Mutations surface their user-facing failure through the shared toast.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AlertDialog.Root open={isOpen} onOpenChange={setDialogOpen}>
      {trigger ? (
        <AlertDialog.Trigger asChild>{trigger}</AlertDialog.Trigger>
      ) : null}
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-[1px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-card p-6 shadow-2xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
          <div className="flex gap-4">
            <div
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
                variantClasses[variant],
              )}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 pt-0.5">
              <AlertDialog.Title className="text-lg font-semibold leading-6">
                {title}
              </AlertDialog.Title>
              <AlertDialog.Description className="mt-2 text-sm leading-6 text-muted-foreground">
                {description}
              </AlertDialog.Description>
            </div>
          </div>
          {warning ? (
            <p className="mt-5 rounded-lg border border-orange-500/20 bg-orange-500/10 px-3 py-2 text-sm text-orange-800 dark:text-orange-200">
              {warning}
            </p>
          ) : null}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialog.Cancel asChild>
              <Button type="button" variant="outline" disabled={isPending}>
                {cancelLabel}
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button
                type="button"
                variant={variant === 'danger' ? 'destructive' : 'default'}
                disabled={isPending}
                onClick={(event) => {
                  event.preventDefault();
                  void handleConfirm();
                }}
              >
                {isPending ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : null}
                {isPending ? 'Đang xử lý...' : confirmLabel}
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

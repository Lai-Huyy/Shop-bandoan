'use client';

import { CalendarDays } from 'lucide-react';
import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface DateTimePickerProps {
  id: string;
  label: string;
  value: string;
  onChange(value: string): void;
  required?: boolean;
  min?: string;
}

function toLocalDateTime(value: Date) {
  const offset = value.getTimezoneOffset() * 60_000;
  return new Date(value.getTime() - offset).toISOString().slice(0, 16);
}

function formatDateTime(value: string) {
  if (!value) return 'Chọn ngày và giờ';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Chọn ngày và giờ'
    : new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date);
}

export function DateTimePicker({
  id,
  label,
  value,
  onChange,
  required,
  min,
}: DateTimePickerProps) {
  const selected = value ? new Date(value) : undefined;
  const [open, setOpen] = useState(false);
  const time = value ? toLocalDateTime(new Date(value)).slice(11) : '00:00';

  const setDate = (date: Date | undefined) => {
    if (!date) return;
    const previous = selected ?? new Date();
    date.setHours(previous.getHours(), previous.getMinutes(), 0, 0);
    onChange(toLocalDateTime(date));
  };

  const setTime = (nextTime: string) => {
    const date = selected ?? new Date();
    const [hours, minutes] = nextTime.split(':').map(Number);
    date.setHours(hours, minutes, 0, 0);
    onChange(toLocalDateTime(date));
  };

  return (
    <div className="grid gap-1.5">
      <label className="text-sm font-medium" htmlFor={id}>
        {label}
      </label>
      <Button
        id={id}
        type="button"
        variant="outline"
        className="justify-between font-normal"
        onClick={() => setOpen(true)}
        aria-required={required}
      >
        <span>{formatDateTime(value)}</span>
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
          <DialogTitle>{label}</DialogTitle>
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={setDate}
            captionLayout="dropdown"
            startMonth={new Date(2020, 0)}
            endMonth={new Date(2035, 11)}
            disabled={min ? { before: new Date(min) } : undefined}
            className="mx-auto mt-4"
          />
          <label
            className="grid gap-1.5 text-sm font-medium"
            htmlFor={`${id}-time`}
          >
            Thời gian
            <Input
              id={`${id}-time`}
              type="time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
            />
          </label>
          <Button type="button" onClick={() => setOpen(false)}>
            Xong
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

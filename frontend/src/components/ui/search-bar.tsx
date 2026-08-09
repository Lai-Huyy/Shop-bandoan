'use client';

import { Search } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from './button';
import { Input } from './input';

interface SearchBarProps {
  defaultValue?: string;
  placeholder?: string;
  onSearch(value: string): void;
}

export function SearchBar({
  defaultValue = '',
  placeholder = 'Tìm kiếm',
  onSearch,
}: SearchBarProps) {
  const [value, setValue] = useState(defaultValue);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch(value.trim());
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <Input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      <Button type="submit" size="icon" aria-label="Tìm kiếm">
        <Search className="h-4 w-4" />
      </Button>
    </form>
  );
}

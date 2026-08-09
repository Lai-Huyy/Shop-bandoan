import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <ShieldAlert className="h-12 w-12 text-destructive" />
      <h1 className="mt-4 text-3xl font-bold">You do not have access</h1>
      <p className="mt-3 text-muted-foreground">
        Your account does not have permission to view this area.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">Return home</Link>
      </Button>
    </main>
  );
}

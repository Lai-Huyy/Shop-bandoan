import { ShieldCheck, UserRound } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getRoleLabel } from './user-utils';

export function UserRoleBadge({ role }: { role: string }) {
  const isAdmin = role === 'ADMIN';

  return (
    <Badge variant={isAdmin ? 'default' : 'secondary'} className="gap-1">
      {isAdmin ? (
        <ShieldCheck className="h-3 w-3" />
      ) : (
        <UserRound className="h-3 w-3" />
      )}
      {getRoleLabel(role)}
    </Badge>
  );
}

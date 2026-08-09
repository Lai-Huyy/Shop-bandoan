import { Ban, CheckCircle2, PauseCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { AdminUserStatus } from '@/types/admin-user';
import { userStatusLabels } from './user-utils';

export function UserStatusBadge({ status }: { status: AdminUserStatus }) {
  const content = {
    ACTIVE: {
      icon: CheckCircle2,
      variant: 'secondary' as const,
      className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    },
    SUSPENDED: {
      icon: PauseCircle,
      variant: 'outline' as const,
      className:
        'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    },
    BANNED: { icon: Ban, variant: 'destructive' as const, className: '' },
  }[status];
  const Icon = content.icon;

  return (
    <Badge variant={content.variant} className={`gap-1 ${content.className}`}>
      <Icon className="h-3 w-3" />
      {userStatusLabels[status]}
    </Badge>
  );
}

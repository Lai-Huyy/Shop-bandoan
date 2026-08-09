import {
  ShieldCheck,
  UserCheck,
  UserRound,
  UserRoundX,
  UsersRound,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export interface UserStatistics {
  total: number;
  customers: number;
  administrators: number;
  active: number;
  restricted: number;
}

export function UserStatisticsCards({
  statistics,
  isLoading,
}: {
  statistics?: UserStatistics;
  isLoading: boolean;
}) {
  const cards = [
    {
      label: 'Tổng người dùng',
      value: statistics?.total,
      icon: UsersRound,
      color: 'text-orange-500',
    },
    {
      label: 'Khách hàng',
      value: statistics?.customers,
      icon: UserRound,
      color: 'text-sky-500',
    },
    {
      label: 'Quản trị viên',
      value: statistics?.administrators,
      icon: ShieldCheck,
      color: 'text-violet-500',
    },
    {
      label: 'Đang hoạt động',
      value: statistics?.active,
      icon: UserCheck,
      color: 'text-emerald-500',
    },
    {
      label: 'Bị hạn chế',
      value: statistics?.restricted,
      icon: UserRoundX,
      color: 'text-rose-500',
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map(({ label, value, icon: Icon, color }) => (
        <Card
          key={label}
          className="overflow-hidden rounded-2xl transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-muted-foreground">
                {label}
              </span>
              <Icon className={`h-5 w-5 ${color}`} aria-hidden="true" />
            </div>
            {isLoading ? (
              <Skeleton className="mt-4 h-8 w-20" />
            ) : (
              <p className="mt-3 text-3xl font-bold tracking-tight">
                {value?.toLocaleString('vi-VN') ?? '—'}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

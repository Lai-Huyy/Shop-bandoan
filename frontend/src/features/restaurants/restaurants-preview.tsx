'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, MapPin } from 'lucide-react';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { restaurantsService } from '@/services/restaurants.service';

export function RestaurantsPreview() {
  const query = useQuery({
    queryKey: ['restaurants', { limit: 3 }],
    queryFn: () => restaurantsService.list({ limit: 3 }),
  });
  if (query.isLoading)
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <Skeleton key={item} className="h-44" />
        ))}
      </div>
    );
  if (query.isError)
    return (
      <ErrorState
        message="Restaurants cannot be loaded right now."
        retry={() => void query.refetch()}
      />
    );
  if (!query.data?.items.length)
    return (
      <EmptyState
        title="No restaurants yet"
        description="Check back soon for participating restaurants."
      />
    );
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {query.data.items.map((restaurant) => (
        <Card key={restaurant.id}>
          <CardHeader>
            <CardTitle>{restaurant.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="line-clamp-2 min-h-10 text-sm text-muted-foreground">
              {restaurant.description ||
                'Restaurant details will be available soon.'}
            </p>
            <p className="mt-4 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {restaurant.address}
            </p>
            <Button asChild className="mt-4 w-full" variant="outline">
              <Link href={`/restaurant?id=${restaurant.id}`}>
                View restaurant <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

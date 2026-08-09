'use client';

import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Card, CardContent } from '@/components/ui/card';
import { restaurantsService } from '@/services/restaurants.service';

export function RestaurantDetail() {
  const id = useSearchParams().get('id');
  const query = useQuery({
    queryKey: ['restaurant', id],
    queryFn: () => restaurantsService.getById(id ?? ''),
    enabled: Boolean(id),
  });

  if (!id) {
    return (
      <EmptyState
        title="Choose a restaurant"
        description="Select a restaurant from the home page to view its available details."
      />
    );
  }
  if (query.isLoading) return <LoadingState label="Loading restaurant" />;
  if (query.isError)
    return (
      <ErrorState
        message="The restaurant could not be found."
        retry={() => void query.refetch()}
      />
    );
  if (!query.data) return null;

  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-muted-foreground">
          {query.data.description || 'No description is available.'}
        </p>
        <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Phone</dt>
            <dd>{query.data.phone || 'Not provided'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Status</dt>
            <dd>
              {query.data.isActive
                ? 'Open for discovery'
                : 'Currently unavailable'}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}

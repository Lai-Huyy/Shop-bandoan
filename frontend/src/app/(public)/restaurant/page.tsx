import { Suspense } from 'react';
import { LoadingState } from '@/components/common/loading-state';
import { PageHeader } from '@/components/common/page-header';
import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { RestaurantDetail } from '@/features/restaurants/restaurant-detail';

export default function RestaurantPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 p-4 md:p-6">
        <PageHeader
          title="Restaurant"
          description="Restaurant discovery uses the public backend API."
        />
        <Suspense fallback={<LoadingState label="Loading restaurant" />}>
          <RestaurantDetail />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

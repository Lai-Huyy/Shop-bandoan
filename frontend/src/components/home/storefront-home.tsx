'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { categoriesService } from '@/services/categories.service';
import { couponsService } from '@/services/coupons.service';
import { productsService } from '@/services/products.service';
import { HomeCategories } from './home-categories';
import { HomeCoupons } from './home-coupons';
import { HomeHero } from './home-hero';
import { HomeProducts } from './home-products';
import { HomeValueSections } from './home-value-sections';

const categoryParams = { page: 1, limit: 8 };
const productParams = { page: 1, limit: 12, sort: 'popular' };

export function StorefrontHome() {
  const { user } = useAuth();
  const [showBackToTop, setShowBackToTop] = useState(false);
  const categories = useQuery({
    queryKey: ['categories', 'public', categoryParams],
    queryFn: () => categoriesService.list(categoryParams),
  });
  const products = useQuery({
    queryKey: ['products', 'home', productParams],
    queryFn: () => productsService.list(productParams),
  });
  const coupons = useQuery({
    queryKey: ['coupons', 'available', 'home'],
    queryFn: () => couponsService.getAvailable({ page: 1, limit: 6 }),
    enabled: Boolean(user),
  });

  useEffect(() => {
    const updateVisibility = () => setShowBackToTop(window.scrollY > 560);
    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });
    return () => window.removeEventListener('scroll', updateVisibility);
  }, []);

  return (
    <main>
      <HomeHero />
      <HomeCategories
        categories={categories.data?.items}
        isLoading={categories.isLoading}
        isError={categories.isError}
        onRetry={() => void categories.refetch()}
      />
      <HomeProducts
        products={products.data?.items}
        isLoading={products.isLoading}
        isError={products.isError}
        onRetry={() => void products.refetch()}
      />
      <HomeCoupons coupons={coupons.data?.items} />
      <HomeValueSections />
      <Button
        type="button"
        size="icon"
        aria-label="Lên đầu trang"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-6 right-6 z-40 rounded-full bg-orange-500 shadow-lg shadow-orange-950/30 transition-all hover:bg-orange-600 ${showBackToTop ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'}`}
      >
        <ArrowUp className="h-5 w-5" />
      </Button>
    </main>
  );
}

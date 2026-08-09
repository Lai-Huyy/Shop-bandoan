import { StorefrontHome } from '@/components/home/storefront-home';
import { StorefrontFooter } from '@/components/home/storefront-footer';
import { StorefrontHeader } from '@/components/home/storefront-header';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <StorefrontHeader />
      <StorefrontHome />
      <StorefrontFooter />
    </div>
  );
}

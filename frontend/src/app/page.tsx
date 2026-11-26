import { StorefrontHome } from '@/components/home/storefront-home';
import { StorefrontFooter } from '@/components/home/storefront-footer';
import { StorefrontHeader } from '@/components/home/storefront-header';
import { StoreChat } from '@/features/chatbot/store-chat';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <StorefrontHeader />
      <StorefrontHome />
      <StorefrontFooter />
      <StoreChat />
    </div>
  );
}

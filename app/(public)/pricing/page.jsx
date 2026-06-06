import PricingPage from '@/views/PricingPage';
import { buildStaticPageMetadata } from '@/lib/nextMetadata';

export const metadata = buildStaticPageMetadata('pricing', '/pricing');

export default function Page() {
  return <PricingPage />;
}

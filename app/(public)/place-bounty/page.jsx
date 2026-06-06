import PlaceBountyPage from '@/views/PlaceBountyPage';
import { buildStaticPageMetadata } from '@/lib/nextMetadata';

export const metadata = buildStaticPageMetadata('placeBounty', '/place-bounty');

export default function Page() {
  return <PlaceBountyPage />;
}

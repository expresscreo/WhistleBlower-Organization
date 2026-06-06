import PartnerPage from '@/views/PartnerPage';
import { buildStaticPageMetadata } from '@/lib/nextMetadata';

export const metadata = buildStaticPageMetadata('partner', '/partner-program');

export default function Page() {
  return <PartnerPage />;
}

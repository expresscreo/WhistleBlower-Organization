import TermsOfServicePage from '@/views/TermsOfServicePage';
import { buildStaticPageMetadata } from '@/lib/nextMetadata';

export const metadata = buildStaticPageMetadata('terms', '/terms-of-service');

export default function Page() {
  return <TermsOfServicePage />;
}

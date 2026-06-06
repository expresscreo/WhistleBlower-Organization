import PrivacyPolicyPage from '@/views/PrivacyPolicyPage';
import { buildStaticPageMetadata } from '@/lib/nextMetadata';

export const metadata = buildStaticPageMetadata('privacy', '/privacy-policy');

export default function Page() {
  return <PrivacyPolicyPage />;
}

import DisclaimerPage from '@/views/DisclaimerPage';
import { buildStaticPageMetadata } from '@/lib/nextMetadata';

export const metadata = buildStaticPageMetadata('disclaimer', '/disclaimer');

export default function Page() {
  return <DisclaimerPage />;
}

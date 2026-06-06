import RewardsForInformationPage from '@/views/RewardsForInformationPage';
import { buildStaticPageMetadata } from '@/lib/nextMetadata';

export const metadata = buildStaticPageMetadata('rewards', '/rewards-for-information');

export default function Page() {
  return <RewardsForInformationPage />;
}

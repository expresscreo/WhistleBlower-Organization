import TrackPage from '@/views/TrackPage';
import { buildStaticPageMetadata } from '@/lib/nextMetadata';

export const metadata = buildStaticPageMetadata('trackReport', '/track');

export default function Page() {
  return <TrackPage />;
}

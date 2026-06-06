import HowWeSecureDataPage from '@/views/HowWeSecureDataPage';
import { buildStaticPageMetadata } from '@/lib/nextMetadata';

export const metadata = buildStaticPageMetadata('secureData', '/how-we-secure-your-data');

export default function Page() {
  return <HowWeSecureDataPage />;
}

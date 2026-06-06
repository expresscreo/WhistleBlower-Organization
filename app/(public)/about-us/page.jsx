import AboutUsPageV2 from '@/views/AboutUsPageV2';
import { buildStaticPageMetadata } from '@/lib/nextMetadata';

export const metadata = buildStaticPageMetadata('about', '/about-us');

export default function Page() {
  return <AboutUsPageV2 />;
}

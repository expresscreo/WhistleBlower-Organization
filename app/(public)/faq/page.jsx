import FAQPage from '@/views/FAQPage';
import { buildStaticPageMetadata } from '@/lib/nextMetadata';

export const metadata = buildStaticPageMetadata('faq', '/faq');

export default function Page() {
  return <FAQPage />;
}

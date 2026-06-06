import ContactPage from '@/views/ContactPage';
import { buildStaticPageMetadata } from '@/lib/nextMetadata';

export const metadata = buildStaticPageMetadata('contact', '/contact');

export default function Page() {
  return <ContactPage />;
}

import HomePage from '@/views/HomePage';
import JsonLd from '@/components/JsonLd';
import { buildStaticPageMetadata } from '@/lib/nextMetadata';
import { getHomeStructuredData } from '@/lib/pageMetadata';

export const metadata = buildStaticPageMetadata('home', '/');

export default function Page() {
  return (
    <>
      <JsonLd data={getHomeStructuredData()} />
      <HomePage />
    </>
  );
}

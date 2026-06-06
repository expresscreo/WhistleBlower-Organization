import NewsPage from '@/views/NewsPage';
import JsonLd from '@/components/JsonLd';
import { getNewsCategoryMetadata } from '@/lib/pageMetadata';

const { metadata: pageMetadata, structuredData } = getNewsCategoryMetadata('most_wanted');

export const metadata = pageMetadata;

export default function Page() {
  return (
    <>
      <JsonLd data={structuredData} />
      <NewsPage />
    </>
  );
}

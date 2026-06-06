import NewsPage from '@/views/NewsPage';
import JsonLd from '@/components/JsonLd';
import { getNewsCategoryPageData } from '@/lib/pageMetadata';

export const revalidate = 60;

export async function generateMetadata() {
  const { metadata } = await getNewsCategoryPageData('most_wanted');
  return metadata;
}

export default async function Page() {
  const { initialNews, structuredData } = await getNewsCategoryPageData('most_wanted');

  return (
    <>
      <JsonLd data={structuredData} />
      <NewsPage initialNews={initialNews} />
    </>
  );
}

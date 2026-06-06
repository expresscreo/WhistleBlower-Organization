import NewsPage from '@/views/NewsPage';
import JsonLd from '@/components/JsonLd';
import { getNewsCategoryPageData } from '@/lib/pageMetadata';

const VALID_CATEGORIES = new Set(['news', 'bounty']);

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const { category } = await params;
  const key = VALID_CATEGORIES.has(category) ? category : 'all';
  const { metadata } = await getNewsCategoryPageData(key);
  return metadata;
}

export default async function Page({ params }) {
  const { category } = await params;
  const key = VALID_CATEGORIES.has(category) ? category : 'all';
  const { initialNews, structuredData } = await getNewsCategoryPageData(key);

  return (
    <>
      <JsonLd data={structuredData} />
      <NewsPage initialNews={initialNews} />
    </>
  );
}

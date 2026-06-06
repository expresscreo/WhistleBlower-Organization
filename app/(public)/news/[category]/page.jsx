import NewsPage from '@/views/NewsPage';
import JsonLd from '@/components/JsonLd';
import { getNewsCategoryMetadata } from '@/lib/pageMetadata';

const VALID_CATEGORIES = new Set(['news', 'bounty']);

export async function generateMetadata({ params }) {
  const { category } = await params;
  const key = VALID_CATEGORIES.has(category) ? category : 'all';
  return getNewsCategoryMetadata(key).metadata;
}

export default async function Page({ params }) {
  const { category } = await params;
  const key = VALID_CATEGORIES.has(category) ? category : 'all';
  const { structuredData } = getNewsCategoryMetadata(key);

  return (
    <>
      <JsonLd data={structuredData} />
      <NewsPage />
    </>
  );
}

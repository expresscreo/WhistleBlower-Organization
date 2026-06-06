import NewsPostPage from '@/views/NewsPostPage';
import JsonLd from '@/components/JsonLd';
import { getNewsPostPageSeo } from '@/lib/pageMetadata';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { metadata } = await getNewsPostPageSeo(slug);
  return metadata;
}

export default async function Page({ params }) {
  const { slug } = await params;
  const { structuredData } = await getNewsPostPageSeo(slug);

  return (
    <>
      {structuredData ? <JsonLd data={structuredData} /> : null}
      <NewsPostPage />
    </>
  );
}

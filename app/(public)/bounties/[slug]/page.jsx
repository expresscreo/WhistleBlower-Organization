import BountyPostPage from '@/views/BountyPostPage';
import JsonLd from '@/components/JsonLd';
import { getBountyPostPageSeo } from '@/lib/pageMetadata';

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { metadata } = await getBountyPostPageSeo(slug);
  return metadata;
}

export default async function Page({ params }) {
  const { slug } = await params;
  const { structuredData } = await getBountyPostPageSeo(slug);

  return (
    <>
      {structuredData ? <JsonLd data={structuredData} /> : null}
      <BountyPostPage />
    </>
  );
}

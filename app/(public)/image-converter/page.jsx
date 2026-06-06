import ImageConverterPage from '@/views/ImageConverterPage';

export const metadata = {
  title: 'Image Converter | WhistleBlower.ng',
  description: 'Convert images to AVIF format and upload to storage.',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ImageConverterPage />;
}

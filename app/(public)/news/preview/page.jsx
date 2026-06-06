import NewsPostPreviewPage from '@/views/NewsPostPreviewPage';

export const metadata = {
  title: 'Preview',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function Page() {
  return <NewsPostPreviewPage />;
}

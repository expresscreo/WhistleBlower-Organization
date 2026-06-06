'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import NewsPostPreviewPage from '@/views/NewsPostPreviewPage';

function PreviewFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary" aria-label="Loading preview" />
    </div>
  );
}

export default function NewsPreviewRoutePage() {
  return (
    <Suspense fallback={<PreviewFallback />}>
      <NewsPostPreviewPage />
    </Suspense>
  );
}

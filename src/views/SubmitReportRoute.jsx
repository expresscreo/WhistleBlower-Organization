'use client';

import { useSearchParams } from 'next/navigation';
import LinkedTipSubmitPage from '@/views/LinkedTipSubmitPage';
import SubmitReportPage from '@/views/SubmitReportPage';

function isLinkedTipSubmitFlow(searchParams) {
  if (searchParams.get('feedback') === 'true') return true;
  if (searchParams.has('bounty_id')) return true;
  return searchParams.get('category') === 'most_wanted' && searchParams.has('news_id');
}

export default function SubmitReportRoute() {
  const searchParams = useSearchParams();

  if (isLinkedTipSubmitFlow(searchParams)) {
    return <LinkedTipSubmitPage />;
  }

  return <SubmitReportPage />;
}

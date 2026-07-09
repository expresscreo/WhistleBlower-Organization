import SubmitReportRoute from '@/views/SubmitReportRoute';
import { buildStaticPageMetadata } from '@/lib/nextMetadata';

export const metadata = buildStaticPageMetadata('submitReport', '/submit-report');

export default function Page() {
  return <SubmitReportRoute />;
}

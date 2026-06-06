'use client';

import { usePageHead } from '@/hooks/usePageHead';

/**
 * Client-side document title and meta tags (replaces react-helmet).
 */
export default function PageHead({ title, description, robots }) {
  usePageHead({ title, description, robots });
  return null;
}

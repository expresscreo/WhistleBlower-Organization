'use client';

import { useEffect, useState } from 'react';
import { getLocalFileUrl, resolveImageUrl } from '@/lib/fileUtils';
import { resolveMediaUrl } from '@/lib/mediaUtils';

/**
 * Renders a stored media path (WBMedia, Supabase public, or signed) as an img.
 */
export default function ResolvedStorageImage({ path, alt = '', className = '', ...props }) {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    if (!path) {
      setSrc(null);
      return;
    }

    let cancelled = false;
    const immediate = getLocalFileUrl(path) || resolveImageUrl(path);
    if (immediate) setSrc(immediate);

    resolveMediaUrl(path, { preferredSrc: immediate }).then((url) => {
      if (!cancelled && url) setSrc(url);
    });

    return () => {
      cancelled = true;
    };
  }, [path]);

  if (!path || !src) return null;

  return <img src={src} alt={alt} className={className} {...props} />;
}

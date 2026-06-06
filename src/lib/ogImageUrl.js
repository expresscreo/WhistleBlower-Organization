import { absoluteUrl } from '@/lib/siteUrl';
import { publicEnv } from '@/lib/env';

/**
 * Resolve featured images to absolute HTTPS URLs for Open Graph / WhatsApp previews.
 * Must work on server (no async signed URLs).
 */
export function resolveOgImageUrl(image) {
  if (!image) return null;

  const img = typeof image === 'string' ? image : String(image);
  if (!img) return null;

  if (img.startsWith('http://') || img.startsWith('https://')) {
    return img;
  }

  if (img.startsWith('/WBMedia/') || img.startsWith('WBMedia/')) {
    return absoluteUrl(img.startsWith('/') ? img : `/${img}`);
  }

  const wbMediaIndex = img.indexOf('WBMedia/');
  if (wbMediaIndex >= 0) {
    return absoluteUrl(`/${img.slice(wbMediaIndex)}`);
  }

  const storagePath = img.replace(/^wb_evio\//, '').replace(/^\//, '');
  const isStoragePath =
    img.includes('wb_evio') ||
    storagePath.startsWith('news/') ||
    storagePath.startsWith('bounties/') ||
    storagePath.startsWith('reports/');

  if (isStoragePath && publicEnv.supabaseUrl) {
    const base = publicEnv.supabaseUrl.replace(/\/$/, '');
    return `${base}/storage/v1/object/public/wb_evio/${storagePath}`;
  }

  return absoluteUrl(img.startsWith('/') ? img : `/${img}`);
}

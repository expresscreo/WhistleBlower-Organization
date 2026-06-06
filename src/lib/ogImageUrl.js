import { absoluteUrl } from '@/lib/siteUrl';
import { publicEnv } from '@/lib/env';
import {
  buildPublicStorageUrl,
  extractStoragePathFromPublicUrl,
  getBucketForStoragePath,
  PUBLIC_MEDIA_BUCKET,
} from '@/lib/storageBuckets';

/**
 * Resolve featured images to absolute HTTPS URLs for Open Graph / WhatsApp previews.
 * Must work on server (no async signed URLs).
 */
export function resolveOgImageUrl(image) {
  if (!image) return null;

  const img = typeof image === 'string' ? image : String(image);
  if (!img) return null;

  if (img.startsWith('http://') || img.startsWith('https://')) {
    const extracted = extractStoragePathFromPublicUrl(img);
    if (extracted && extracted !== img) {
      const bucket = getBucketForStoragePath(extracted);
      const publicUrl = buildPublicStorageUrl(extracted, bucket);
      if (publicUrl) return publicUrl;
    }
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
  const bucket = getBucketForStoragePath(storagePath);
  const publicUrl = buildPublicStorageUrl(storagePath, bucket);

  if (publicUrl) return publicUrl;

  if (publicEnv.supabaseUrl && bucket === PUBLIC_MEDIA_BUCKET) {
    const base = publicEnv.supabaseUrl.replace(/\/$/, '');
    return `${base}/storage/v1/object/public/${PUBLIC_MEDIA_BUCKET}/${storagePath}`;
  }

  return absoluteUrl(img.startsWith('/') ? img : `/${img}`);
}

export const PUBLIC_MEDIA_BUCKET = 'whistleblower-files';
export const PRIVATE_EVIDENCE_BUCKET = 'wb_evio';

const PUBLIC_URL_MARKER = /\/storage\/v1\/object\/public\/([^/]+)\/(.+?)(?:\?|$)/;

/**
 * Pick the Supabase bucket for a storage folder used at upload time.
 */
export function getBucketForFolder(folder = '') {
  const normalized = String(folder).replace(/^\//, '').replace(/\.\./g, '');
  if (normalized.startsWith('reports/') || normalized === 'report-evidence') {
    return PRIVATE_EVIDENCE_BUCKET;
  }
  return PUBLIC_MEDIA_BUCKET;
}

/**
 * Pick the Supabase bucket for a stored path or public URL.
 */
export function getBucketForStoragePath(path = '') {
  if (!path) return PUBLIC_MEDIA_BUCKET;

  const value = String(path).trim();
  if (value.startsWith('http')) {
    const match = value.match(PUBLIC_URL_MARKER);
    if (match) return match[1];
  }

  const clean = value.replace(/^\//, '').replace(/^wb_evio\//, '');
  if (clean.startsWith('reports/')) return PRIVATE_EVIDENCE_BUCKET;
  return PUBLIC_MEDIA_BUCKET;
}

export function extractStoragePathFromPublicUrl(url) {
  if (!url || typeof url !== 'string') return url;
  if (!url.startsWith('http')) return url.replace(/^\//, '').replace(/^wb_evio\//, '');

  const match = url.match(PUBLIC_URL_MARKER);
  if (!match) return url;

  try {
    return decodeURIComponent(match[2]);
  } catch {
    return match[2];
  }
}

export function buildPublicStorageUrl(storagePath, bucket = getBucketForStoragePath(storagePath)) {
  const cleanPath = String(storagePath || '')
    .replace(/^\//, '')
    .replace(/^wb_evio\//, '')
    .replace(new RegExp(`^${bucket}/`), '');

  if (!cleanPath || !bucket) return null;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  if (!base) return null;

  return `${base}/storage/v1/object/public/${bucket}/${cleanPath.split('/').map(encodeURIComponent).join('/')}`;
}

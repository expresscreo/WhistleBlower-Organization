import { absoluteUrl, resolveSiteUrl } from '@/lib/siteUrl';
import { publicEnv } from '@/lib/env';
import {
  buildPublicStorageUrl,
  extractStoragePathFromPublicUrl,
  getBucketForStoragePath,
  PUBLIC_MEDIA_BUCKET,
} from '@/lib/storageBuckets';
import { getEvidencePathsForPublishedPost } from '@/lib/publishedEvidence';
import { isImagePath } from '@/lib/mediaUtils';

const SOCIAL_IMAGE_WIDTH = 1200;
const SOCIAL_IMAGE_HEIGHT = 630;
const TWITTER_COMPATIBLE_PATTERN = /\.(jpe?g|png|gif|webp)(\?|$)/i;
const UNSUPPORTED_SOCIAL_PATTERN = /\.(avif|heic|heif|svg)(\?|$)/i;

const DEFAULT_SOCIAL_IMAGE = () =>
  `${resolveSiteUrl()}/WBMedia/general/banner-WhistleBlower.jpeg`;

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

function guessImageMimeType(url) {
  const path = String(url || '').split('?')[0].toLowerCase();
  if (path.endsWith('.png')) return 'image/png';
  if (path.endsWith('.webp')) return 'image/webp';
  if (path.endsWith('.gif')) return 'image/gif';
  return 'image/jpeg';
}

function isTwitterCompatibleImage(url) {
  return TWITTER_COMPATIBLE_PATTERN.test(String(url || '').split('?')[0]);
}

function needsSocialImageConversion(url) {
  return UNSUPPORTED_SOCIAL_PATTERN.test(String(url || '').split('?')[0]);
}

/**
 * Convert a Supabase public object URL to a rendered JPEG suitable for X/Twitter cards.
 */
export function toSupabaseSocialRenderUrl(publicUrl, options = {}) {
  const match = String(publicUrl || '').match(
    /^(https?:\/\/[^/]+)\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/
  );
  if (!match) return null;

  const [, origin, bucket, objectPath] = match;
  const params = new URLSearchParams();
  params.set('width', String(options.width ?? SOCIAL_IMAGE_WIDTH));
  params.set('height', String(options.height ?? SOCIAL_IMAGE_HEIGHT));
  params.set('resize', options.resize ?? 'cover');

  return `${origin}/storage/v1/render/image/public/${bucket}/${objectPath}?${params}`;
}

/**
 * Social preview image for X/Twitter, Facebook, WhatsApp, etc.
 * Converts AVIF/HEIC storage images to JPEG via Supabase image rendering.
 */
export function resolveSocialShareImage(image, { alt = '' } = {}) {
  const sourceUrl = resolveOgImageUrl(image);
  const fallback = {
    url: DEFAULT_SOCIAL_IMAGE(),
    type: 'image/jpeg',
    width: SOCIAL_IMAGE_WIDTH,
    height: SOCIAL_IMAGE_HEIGHT,
    alt,
  };

  if (!sourceUrl) return fallback;

  if (isTwitterCompatibleImage(sourceUrl) && !needsSocialImageConversion(sourceUrl)) {
    return {
      url: sourceUrl,
      type: guessImageMimeType(sourceUrl),
      width: SOCIAL_IMAGE_WIDTH,
      height: SOCIAL_IMAGE_HEIGHT,
      alt,
    };
  }

  const rendered = toSupabaseSocialRenderUrl(sourceUrl);
  if (rendered) {
    return {
      url: rendered,
      type: 'image/jpeg',
      width: SOCIAL_IMAGE_WIDTH,
      height: SOCIAL_IMAGE_HEIGHT,
      alt,
    };
  }

  return fallback;
}

/**
 * Pick the best share image for a published news / most-wanted / bounty post.
 */
export function resolvePostSocialShareImage(post) {
  const alt = post?.title || 'WhistleBlower.ng';

  const candidates = [];
  if (post?.featured_image) candidates.push(post.featured_image);

  const evidencePaths = getEvidencePathsForPublishedPost(post, []);
  for (const path of evidencePaths) {
    if (isImagePath(path)) candidates.push(path);
  }

  for (const candidate of candidates) {
    const social = resolveSocialShareImage(candidate, { alt });
    if (social.url !== DEFAULT_SOCIAL_IMAGE()) {
      return social;
    }
  }

  if (candidates.length > 0) {
    return resolveSocialShareImage(candidates[0], { alt });
  }

  return resolveSocialShareImage(null, { alt });
}

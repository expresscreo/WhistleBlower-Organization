import { supabase } from '@/lib/customSupabaseClient';
import {
  getLocalFileUrl,
  resolveImageUrl,
  getSignedStorageUrl,
  normalizeStoragePath,
  extractStoragePathFromPublicUrl,
} from '@/lib/fileUtils';
import {
  getBucketForStoragePath,
  PRIVATE_EVIDENCE_BUCKET,
  PUBLIC_MEDIA_BUCKET,
} from '@/lib/storageBuckets';
import {
  MAXIMIZE_ICON_SVG,
  maximizableThumbnailGroupClass,
  maximizableThumbnailIconClass,
  maximizableThumbnailOverlayClass,
  maximizableThumbnailWrapClass,
} from '@/lib/mediaThumbnailStyles';

const IMAGE_EXTENSION_PATTERN = /\.(avif|gif|jpe?g|png|webp)(\?.*)?$/i;
const BARE_IMAGE_FILENAME_PATTERN = /^[a-zA-Z0-9._-]+\.(avif|gif|jpe?g|png|webp)$/i;

export const isImagePath = (path) => {
  if (!path) return false;
  return IMAGE_EXTENSION_PATTERN.test(String(path).split('?')[0]);
};

export const partitionEvidence = (paths = []) => {
  const evidencePaths = Array.isArray(paths) ? paths.filter(Boolean) : [];

  return evidencePaths.reduce(
    (acc, path) => {
      if (isImagePath(path)) {
        acc.images.push(path);
      } else {
        acc.other.push(path);
      }
      return acc;
    },
    { images: [], other: [] }
  );
};

export const normalizeMediaPath = (path) => {
  if (!path || typeof path !== 'string') return '';
  if (path.startsWith('http')) return path;
  return path.startsWith('/') ? path : `/${path}`;
};

export const areSameMediaPath = (a, b) => {
  if (!a || !b) return false;
  if (a === b) return true;
  const fileA = String(a).split('/').pop();
  const fileB = String(b).split('/').pop();
  return fileA && fileB && fileA === fileB;
};

const getSupabasePublicUrl = (storagePath, bucket = getBucketForStoragePath(storagePath)) => {
  const cleanPath = normalizeStoragePath(storagePath);
  if (!cleanPath) return null;
  try {
    const { data } = supabase.storage.from(bucket).getPublicUrl(cleanPath);
    return data?.publicUrl || null;
  } catch {
    return null;
  }
};

/**
 * Build ordered URL candidates for a stored media path (local WBMedia and/or Supabase).
 */
export const getMediaUrlCandidates = (filePath) => {
  if (!filePath) return [];

  const path = String(filePath).trim();
  if (path.startsWith('http')) return [path];

  const candidates = [];
  const add = (url) => {
    if (typeof url !== 'string' || !url || candidates.includes(url)) return;
    candidates.push(url);
  };

  const fileName = path.split('/').pop();

  // Prefer Supabase/remote URLs before local WBMedia (local files are often missing in dev).
  if (path.startsWith('/WBMedia/') || path.startsWith('WBMedia/')) {
    const storagePath = path.replace(/^\/?WBMedia\//, '');
    add(getSupabasePublicUrl(storagePath, PUBLIC_MEDIA_BUCKET));
  }

  const storagePath = normalizeStoragePath(path);
  if (storagePath.startsWith('reports/')) {
    add(getSupabasePublicUrl(storagePath, PRIVATE_EVIDENCE_BUCKET));
  }

  if (
    storagePath.startsWith('bounties/') ||
    storagePath.startsWith('news/') ||
    storagePath.startsWith('general/')
  ) {
    add(getSupabasePublicUrl(storagePath, PUBLIC_MEDIA_BUCKET));
    // Legacy AVIF uploads may still live in the private bucket.
    add(getSupabasePublicUrl(storagePath, PRIVATE_EVIDENCE_BUCKET));
  }

  if (fileName && isImagePath(fileName)) {
    add(getSupabasePublicUrl(`bounties/delito/${fileName}`, PUBLIC_MEDIA_BUCKET));
    add(getSupabasePublicUrl(`bounties/${fileName}`, PUBLIC_MEDIA_BUCKET));
    add(getSupabasePublicUrl(`news/${fileName}`, PUBLIC_MEDIA_BUCKET));
  }

  const syncLocal = getLocalFileUrl(path) || resolveImageUrl(path);
  if (typeof syncLocal === 'string' && syncLocal) add(syncLocal);

  if (fileName && isImagePath(fileName)) {
    add(`/WBMedia/bounties/delito/${fileName}`);
    add(`/WBMedia/general/${fileName}`);
  }

  if (path.includes('wb_evio') || path.includes('supabase.co')) {
    add(getLocalFileUrl(path));
  }

  return candidates;
};

const canLoadUrl = (url) =>
  new Promise((resolve) => {
    if (!url || typeof window === 'undefined') {
      resolve(Boolean(url));
      return;
    }

    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });

const getSupabaseStoragePath = (filePath) => {
  if (!filePath || filePath.startsWith('http')) {
    if (filePath?.startsWith('http')) {
      return extractStoragePathFromPublicUrl(filePath);
    }
    return null;
  }

  const path = normalizeStoragePath(String(filePath).trim());
  if (
    path.startsWith('bounties/') ||
    path.startsWith('news/') ||
    path.startsWith('reports/') ||
    path.startsWith('general/')
  ) {
    return path;
  }

  if (path.includes('/WBMedia/') || path.startsWith('WBMedia/')) {
    return path.replace(/^\/?WBMedia\//, '');
  }

  const fileName = path.split('/').pop();
  if (fileName && isImagePath(fileName)) {
    return `bounties/delito/${fileName}`;
  }

  return null;
};

const getSignedStorageUrlForPath = async (filePath) => {
  const storagePath = getSupabaseStoragePath(filePath);
  if (!storagePath) return null;

  if (storagePath.startsWith('reports/')) {
    return getSignedStorageUrl(storagePath, [PRIVATE_EVIDENCE_BUCKET]);
  }

  const publicUrl = getSupabasePublicUrl(storagePath, PUBLIC_MEDIA_BUCKET);
  if (publicUrl && typeof window !== 'undefined' && (await canLoadUrl(publicUrl))) {
    return publicUrl;
  }

  return getSignedStorageUrl(storagePath, [PUBLIC_MEDIA_BUCKET, PRIVATE_EVIDENCE_BUCKET]);
};

/**
 * Resolve the first loadable URL for a media path (Supabase fallback when local file is missing).
 */
export const resolveMediaUrl = async (path, { preferredSrc } = {}) => {
  if (!path || typeof path !== 'string') return null;

  let resolvedPath = path;
  if (path.startsWith('http')) {
    const extracted = extractStoragePathFromPublicUrl(path);
    if (extracted && extracted !== path) {
      resolvedPath = extracted;
    } else if (typeof window === 'undefined') {
      return path;
    } else if (await canLoadUrl(path)) {
      return path;
    }
  }

  if (preferredSrc?.startsWith('http') && typeof window !== 'undefined') {
    if (await canLoadUrl(preferredSrc)) return preferredSrc;
  }

  const candidates = getMediaUrlCandidates(resolvedPath);
  if (!candidates.length) {
    return preferredSrc?.startsWith('http') ? preferredSrc : null;
  }

  if (typeof window === 'undefined') {
    const remote = candidates.find(
    (url) => typeof url === 'string' && url.includes('supabase.co')
  );
    return remote || candidates[0];
  }

  const localCandidate = candidates.find(
    (url) =>
      typeof url === 'string' &&
      (url.startsWith('/WBMedia/') || url.startsWith('/api/'))
  );
  if (localCandidate && (await canLoadUrl(localCandidate))) return localCandidate;

  for (const url of candidates) {
    if (typeof url !== 'string') continue;
    if (url === localCandidate) continue;
    if (url.includes('supabase.co') && url.includes('/object/public/')) {
      if (await canLoadUrl(url)) return url;
      continue;
    }
    if (await canLoadUrl(url)) return url;
  }

  const signedUrl = await getSignedStorageUrlForPath(resolvedPath);
  if (signedUrl && (await canLoadUrl(signedUrl))) return signedUrl;

  const remote = candidates.find(
    (url) => typeof url === 'string' && url.includes('supabase.co')
  );
  return localCandidate || remote || signedUrl || preferredSrc || candidates[candidates.length - 1];
};

const wrapImgAsMaximizableThumbnail = (img) => {
  if (!img || img.closest('.maximizable-thumbnail-wrap')) return;

  const wrapper = img.ownerDocument.createElement('div');
  wrapper.className = `${maximizableThumbnailGroupClass} ${maximizableThumbnailWrapClass}`;

  const overlay = img.ownerDocument.createElement('span');
  overlay.className = maximizableThumbnailOverlayClass;
  overlay.setAttribute('aria-hidden', 'true');

  const iconRing = img.ownerDocument.createElement('span');
  iconRing.className = maximizableThumbnailIconClass;
  iconRing.innerHTML = MAXIMIZE_ICON_SVG;

  overlay.appendChild(iconRing);

  img.classList.add(
    'w-full',
    'h-auto',
    'rounded-md',
    'object-cover',
    'transition-transform',
    'duration-200',
    'group-hover:scale-105'
  );

  const parent = img.parentNode;
  if (parent) {
    parent.insertBefore(wrapper, img);
    wrapper.appendChild(img);
    wrapper.appendChild(overlay);
  }
};

const findEvidencePathForFilename = (fileName, evidencePaths = []) => {
  if (!fileName) return null;
  const normalized = fileName.trim();
  const match = evidencePaths.find((p) => {
    const base = String(p).split('/').pop();
    return base === normalized || String(p).includes(normalized);
  });
  return match || normalized;
};

/**
 * Rewrite HTML content so image paths and bare filenames resolve to working URLs.
 */
export const enrichHtmlMediaContent = async (html, evidencePaths = []) => {
  if (!html || typeof window === 'undefined') return html || '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const evidence = Array.isArray(evidencePaths) ? evidencePaths : [];

  const images = doc.querySelectorAll('img');
  await Promise.all(
    Array.from(images).map(async (img) => {
      const src = img.getAttribute('src');

      if (src?.startsWith('http') && (await canLoadUrl(src))) {
        return;
      }

      if (!src || src.startsWith('blob:') || src.startsWith('data:')) {
        const alt = img.getAttribute('alt');
        const match = findEvidencePathForFilename(alt, evidence);
        if (match) {
          const url = await resolveMediaUrl(match, { preferredSrc: src });
          if (url && url !== src) img.setAttribute('src', url);
        }
        return;
      }

      const evidenceMatch = findEvidencePathForFilename(src.split('/').pop(), evidence);
      const resolvePath = evidenceMatch || src;
      const url = await resolveMediaUrl(resolvePath, { preferredSrc: src });

      if (!url || url === src) return;

      if (await canLoadUrl(url)) {
        img.setAttribute('src', url);
      }
    })
  );

  const blocks = doc.querySelectorAll('p, div, span');
  await Promise.all(
    Array.from(blocks).map(async (el) => {
      if (el.children.length > 0) return;
      const text = (el.textContent || '').trim();
      if (!BARE_IMAGE_FILENAME_PATTERN.test(text)) return;

      const evidencePath = findEvidencePathForFilename(text, evidence);
      const url = await resolveMediaUrl(evidencePath || text);
      if (!url) return;

      const image = doc.createElement('img');
      image.setAttribute('src', url);
      image.setAttribute('alt', text);
      image.className = 'inline-image max-w-full h-auto rounded-md my-4';
      el.replaceWith(image);
    })
  );

  return doc.body.innerHTML;
};

export const needsMediaEnrichment = (html) => {
  if (!html) return false;
  if (/<img[^>]+src=["'](?!https?:\/\/)[^"']+["']/i.test(html)) return true;
  if (/<img[^>]+src=["']\/WBMedia\//i.test(html)) return true;
  if (/<img[^>]+src=["']blob:/i.test(html)) return true;
  if (/<img[^>]+src=["']https?:\/\/[^"']+\/wb_evio\//i.test(html)) return true;
  return /<p[^>]*>\s*[a-zA-Z0-9._-]+\.(avif|gif|jpe?g|png|webp)\s*<\/p>/i.test(html);
};

export const wrapHtmlThumbnails = (html) => {
  if (!html || typeof window === 'undefined') return html || '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  doc.querySelectorAll('img').forEach((img) => wrapImgAsMaximizableThumbnail(img));
  return doc.body.innerHTML;
};

const THUMBNAIL_HOVER_IMG_CLASSES = [
  'w-full',
  'h-auto',
  'rounded-md',
  'object-cover',
  'transition-transform',
  'duration-200',
  'group-hover:scale-105',
  'cursor-pointer',
];

/**
 * Remove maximizable thumbnail wrappers/overlays from saved or legacy HTML.
 */
export const stripHtmlThumbnailHover = (html) => {
  if (!html || typeof window === 'undefined') return html || '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const unwrapThumbnailContainer = (wrap) => {
    const img = wrap.querySelector('img');
    if (!img || !wrap.parentNode) {
      wrap.remove();
      return;
    }

    THUMBNAIL_HOVER_IMG_CLASSES.forEach((cls) => img.classList.remove(cls));

    if (!img.classList.contains('inline-image')) {
      img.classList.add('inline-image', 'max-w-full', 'h-auto', 'rounded-md', 'my-4');
    }

    wrap.parentNode.insertBefore(img, wrap);
    wrap.remove();
  };

  doc.querySelectorAll('.maximizable-thumbnail-wrap').forEach(unwrapThumbnailContainer);

  doc.querySelectorAll('div.group.relative.overflow-hidden').forEach((wrap) => {
    if (wrap.classList.contains('maximizable-thumbnail-wrap')) return;
    const imgs = wrap.querySelectorAll('img');
    if (imgs.length !== 1) return;
    if (!wrap.querySelector('span[aria-hidden="true"]')) return;
    unwrapThumbnailContainer(wrap);
  });

  doc.querySelectorAll('img').forEach((img) => {
    THUMBNAIL_HOVER_IMG_CLASSES.forEach((cls) => img.classList.remove(cls));
  });

  return doc.body.innerHTML;
};

/**
 * Remove news-editor-only inline image controls (× button, wrapper chrome).
 */
export const stripEditorInlineImageControls = (html) => {
  if (!html || typeof window === 'undefined') return html || '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  doc.querySelectorAll('.inline-image-remove').forEach((button) => button.remove());

  doc.querySelectorAll('.inline-image-wrap').forEach((wrap) => {
    const img = wrap.querySelector('img');
    if (!img || !wrap.parentNode) {
      wrap.remove();
      return;
    }

    wrap.parentNode.insertBefore(img, wrap);
    wrap.remove();
  });

  return doc.body.innerHTML;
};

const PUBLISHED_INLINE_STYLE_PROPS_TO_STRIP = /^((?:background(?:-color)?)|color)\s*:/i;

/**
 * Remove editor inline text colors so published article body uses prose defaults.
 */
/**
 * Remove news-editor-only social embed controls (× button).
 */
export const stripEditorSocialEmbedControls = (html) => {
  if (!html || typeof window === 'undefined') return html || '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  doc.querySelectorAll('.social-embed-remove').forEach((button) => button.remove());

  return doc.body.innerHTML;
};

export const stripPublishedInlineTextStyles = (html) => {
  if (!html || typeof window === 'undefined') return html || '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  doc.querySelectorAll('[style]').forEach((el) => {
    const style = el.getAttribute('style') || '';
    const kept = style
      .split(';')
      .map((rule) => rule.trim())
      .filter((rule) => rule && !PUBLISHED_INLINE_STYLE_PROPS_TO_STRIP.test(rule));

    if (kept.length > 0) {
      el.setAttribute('style', `${kept.join('; ')};`);
    } else {
      el.removeAttribute('style');
    }
  });

  return doc.body.innerHTML;
};

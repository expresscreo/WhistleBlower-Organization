import { slugify } from '@/lib/utils';
import { absoluteUrl } from '@/lib/siteUrl';

export function getNewsPostSlug(post) {
  if (!post) return '';
  return post.slug || slugify(post.title);
}

export function getNewsPostPath(post) {
  const slug = getNewsPostSlug(post);
  return slug ? `/news/post/${slug}` : null;
}

export function getNewsPostUrl(post) {
  const path = getNewsPostPath(post);
  return path ? absoluteUrl(path) : absoluteUrl('/news');
}

export function getBountyPostPath(post) {
  const slug = getNewsPostSlug(post);
  return slug ? `/bounties/${slug}` : null;
}

export function getBountyPostUrl(post) {
  const path = getBountyPostPath(post);
  return path ? absoluteUrl(path) : absoluteUrl('/news/bounty');
}

/**
 * Public URL for a published news row (bounty posts use /bounties/:slug).
 */
export function getPublishedNewsPublicPath(post) {
  if (!post) return null;
  if (post.category === 'bounty' && post.bounty_id) {
    return getBountyPostPath(post);
  }
  return getNewsPostPath(post);
}

export function getPublishedNewsPublicUrl(post) {
  const path = getPublishedNewsPublicPath(post);
  return path ? absoluteUrl(path) : null;
}

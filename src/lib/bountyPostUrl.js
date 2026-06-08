import { slugify } from '@/lib/utils';
import { BOUNTY_STATUSES_WITH_PUBLIC_PAGE } from '@/lib/bountyStatus';

export { BOUNTY_STATUSES_WITH_PUBLIC_PAGE };

/**
 * Resolve the URL slug for a published bounty post.
 * Prefers the published news row (editor may change title/slug).
 */
export function getBountyPostSlug(newsRow, fallbackTitle) {
  if (newsRow?.slug) return newsRow.slug;
  const title = newsRow?.title || fallbackTitle;
  return title ? slugify(title) : '';
}

export function getBountyPostPath(slug) {
  return slug ? `/bounties/${slug}` : null;
}

/**
 * Returns the public bounty page path, or null if not applicable.
 */
export async function fetchPublishedBountyPostPath(supabase, bounty) {
  if (!bounty?.id || !BOUNTY_STATUSES_WITH_PUBLIC_PAGE.includes(bounty.status)) {
    return null;
  }

  const { data: newsRow, error } = await supabase
    .from('news')
    .select('title')
    .eq('bounty_id', bounty.id)
    .eq('status', 'published')
    .maybeSingle();

  if (error) return null;

  const slug = getBountyPostSlug(newsRow, bounty.title);
  return getBountyPostPath(slug);
}

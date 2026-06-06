export const MOST_WANTED_PATH = '/most-wanted';

/** Public URL paths for news listing categories (DB value → path). */
export const NEWS_CATEGORY_PATHS = {
  all: '/news',
  news: '/news/news',
  bounty: '/news/bounty',
  most_wanted: MOST_WANTED_PATH,
};

export function getNewsCategoryPath(category) {
  if (!category || category === 'all') return NEWS_CATEGORY_PATHS.all;
  return NEWS_CATEGORY_PATHS[category] || NEWS_CATEGORY_PATHS.all;
}

export function getNewsCategoryFromPathname(pathname) {
  if (!pathname) return 'all';

  if (pathname === MOST_WANTED_PATH || pathname.startsWith(`${MOST_WANTED_PATH}/`)) {
    return 'most_wanted';
  }

  const segments = pathname.split('/').filter(Boolean);
  if (segments[0] !== 'news') return 'all';

  const segment = segments[1];
  if (segment && Object.prototype.hasOwnProperty.call(NEWS_CATEGORY_PATHS, segment)) {
    return segment;
  }

  return 'all';
}

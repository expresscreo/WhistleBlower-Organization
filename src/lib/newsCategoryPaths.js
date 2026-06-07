export const MOST_WANTED_PATH = '/most-wanted';
export const LATEST_NEWS_PATH = '/news/latest-news';

/** DB category value → public URL path */
export const NEWS_CATEGORY_PATHS = {
  all: '/news',
  news: LATEST_NEWS_PATH,
  bounty: '/news/bounty',
  most_wanted: MOST_WANTED_PATH,
};

/** URL segment (under /news/) → DB category value */
export const NEWS_ROUTE_SEGMENT_TO_CATEGORY = {
  'latest-news': 'news',
  bounty: 'bounty',
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
  if (!segment) return 'all';

  if (NEWS_ROUTE_SEGMENT_TO_CATEGORY[segment]) {
    return NEWS_ROUTE_SEGMENT_TO_CATEGORY[segment];
  }

  return 'all';
}

export function getNewsCategoryFromRouteSegment(segment) {
  return NEWS_ROUTE_SEGMENT_TO_CATEGORY[segment] || null;
}

export const NON_MARKETING_PUBLIC_PAGES = [
  '/track',
  '/submit-report',
  '/place-bounty',
];

export function isMarketingPublicPage(pathname) {
  return !NON_MARKETING_PUBLIC_PAGES.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

export function isPublicPageWithFooter(pathname) {
  return isMarketingPublicPage(pathname);
}

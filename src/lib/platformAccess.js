/** Internal WhistleBlower plan. Hidden from public registration. */
export const PLATFORM_PLAN_NAMES = ['Ultimate'];

export const PLATFORM_NAV_PAGE_NAMES = ['Bounties', 'Most Wanted'];

export const PLATFORM_ROUTE_PAGE_NAMES = [
  'Bounties',
  'Bounty Details',
  'Most Wanted',
  'Most Wanted Details',
];

export function getPlanName(profile) {
  return profile?.plan_name || profile?.plans?.name || '';
}

export function isPlatformAdmin(profile) {
  if (!profile) return false;
  if (profile.user_type === 'super_admin') return true;
  return PLATFORM_PLAN_NAMES.includes(getPlanName(profile));
}

export function isPlatformExclusivePage(pageName) {
  return PLATFORM_ROUTE_PAGE_NAMES.includes(pageName);
}

export function isBountyOrMostWantedCategory(category) {
  const value = String(category || '').trim().toLowerCase().replace(/_/g, ' ');
  return value === 'bounty' || value === 'most wanted';
}

import { isNigeriaMostWantedCountry, normalizeMostWantedDetails } from '@/lib/mostWantedUtils';

/**
 * Resolve normalized state/LGA for a published news row.
 * - most_wanted: most_wanted_details.crime_state / crime_lga
 * - bounty: linked bounties.state / bounties.location (LGA)
 */
export function resolveNewsItemLocation(item, bountyLookup = {}) {
  if (item?.category === 'most_wanted') {
    const details = normalizeMostWantedDetails(item.most_wanted_details);
    if (!isNigeriaMostWantedCountry(details.crime_country)) {
      return { state: '', lga: '' };
    }
    return {
      state: details.crime_state?.trim() || '',
      lga: details.crime_lga?.trim() || '',
    };
  }

  if (item?.category === 'bounty' && item.bounty_id) {
    const bounty = bountyLookup[item.bounty_id];
    if (bounty) {
      return {
        state: String(bounty.state ?? '').trim(),
        lga: String(bounty.location ?? '').trim(),
      };
    }
  }

  return { state: '', lga: '' };
}

export function matchesNewsLocationFilter(location, { state, lga }) {
  if (state && state !== 'all') {
    if (!location.state || location.state !== state) return false;
  }
  if (lga && lga !== 'all') {
    if (!location.lga || location.lga !== lga) return false;
  }
  return true;
}

export function filterNewsByLocation(items, filters, bountyLookup = {}) {
  const hasStateFilter = filters.state && filters.state !== 'all';
  const hasLgaFilter = filters.lga && filters.lga !== 'all';
  if (!hasStateFilter && !hasLgaFilter) return items;

  return items.filter((item) => {
    const location = resolveNewsItemLocation(item, bountyLookup);
    return matchesNewsLocationFilter(location, filters);
  });
}

export async function fetchBountyLocationLookup(supabase, newsItems) {
  const bountyIds = [
    ...new Set(
      (newsItems ?? [])
        .filter((item) => item.category === 'bounty' && item.bounty_id)
        .map((item) => item.bounty_id)
    ),
  ];

  if (bountyIds.length === 0) return {};

  const { data, error } = await supabase
    .from('bounties')
    .select('id, state, location')
    .in('id', bountyIds);

  if (error) {
    console.error('[newsLocationFilter] fetchBountyLocationLookup:', error.message);
    return {};
  }

  return Object.fromEntries((data ?? []).map((bounty) => [bounty.id, bounty]));
}

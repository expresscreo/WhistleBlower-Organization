export const LAW_ENFORCEMENT_OPTIONS = [
  'Nigeria Police Force (NPF)',
  'Economic and Financial Crimes Commission (EFCC)',
  'National Drug Law Enforcement Agency (NDLEA)',
  'Department of State Services (DSS)',
  'Nigeria Security and Civil Defence Corps (NSCDC)',
  'Independent Corrupt Practices Commission (ICPC)',
  'Federal Road Safety Corps (FRSC)',
  'Other Law Enforcement',
];

export const SEX_OPTIONS = ['Male', 'Female'];
export const BUILD_OPTIONS = ['Slim', 'Medium', 'Heavy', 'Athletic', 'Unknown', 'Other'];
export const HAIR_COLOUR_OPTIONS = [
  'Black',
  'Brown',
  'Blonde',
  'Grey',
  'Red',
  'Bald',
  'Unknown',
  'Other',
];

export const CRIME_TYPE_OPTIONS = [
  'Theft',
  'Fraud',
  'Assault',
  'Armed Robbery',
  'Kidnapping',
  'Murder',
  'Drug Offences',
  'Cybercrime',
  'Missing Person',
  'Sexual Offence',
  'Other',
];

/** Read-only / auto-generated fields — visually inactive in the editor */
export const MOST_WANTED_INACTIVE_INPUT_CLASS =
  'cursor-not-allowed border-muted bg-muted/60 text-muted-foreground opacity-80 focus-visible:ring-0';

export const EMPTY_MOST_WANTED_DETAILS = {
  crime_type: '',
  crime_state: '',
  crime_lga: '',
  crime_address: '',
  suspect_name: '',
  nickname: '',
  people_involved: '',
  case_reference: '',
  law_enforcement: '',
  law_enforcement_other: '',
  summary: '',
  full_details: '',
  additional_information: '',
  whereabouts: '',
  sex: '',
  age: '',
  height: '',
  build: '',
  hair_colour: '',
};

/** Auto-generated report ID, e.g. WB-MW1048573 (7 digits) */
export const generateMostWantedReportReference = () => {
  const min = 1_000_000;
  const max = 9_999_999;
  const digits = String(Math.floor(Math.random() * (max - min + 1)) + min);
  return `WB-MW${digits}`;
};

export const ensureMostWantedReportReference = (details) => {
  const normalized = normalizeMostWantedDetails(details);
  if (normalized.case_reference?.trim()) return normalized;
  return { ...normalized, case_reference: generateMostWantedReportReference() };
};

/** Public headline: "{name} wanted for {crime}" */
export const buildMostWantedHeadline = (details) => {
  const name = details?.suspect_name?.trim();
  const crime = details?.crime_type?.trim();
  if (name && crime) return `${name} wanted for ${crime}`;
  return '';
};

export const formatCrimeLocation = (details) => {
  const d = normalizeMostWantedDetails(details);
  return [d.crime_state, d.crime_lga, d.crime_address].filter(Boolean).join(', ');
};

export const normalizeMostWantedDetails = (value) => {
  if (!value || typeof value !== 'object') {
    return { ...EMPTY_MOST_WANTED_DETAILS };
  }
  const raw = /** @type {Record<string, unknown>} */ (value);
  const normalized = { ...EMPTY_MOST_WANTED_DETAILS };
  for (const key of Object.keys(EMPTY_MOST_WANTED_DETAILS)) {
    if (raw[key] != null) {
      normalized[key] = String(raw[key]).trim();
    }
  }
  // Legacy posts stored a single crime_location string
  if (!normalized.crime_state && !normalized.crime_lga && raw.crime_location) {
    normalized.crime_address = String(raw.crime_location).trim();
  }
  return normalized;
};

export const hasStructuredMostWantedDetails = (post) =>
  post?.category === 'most_wanted' &&
  post?.most_wanted_details != null &&
  typeof post.most_wanted_details === 'object';

export const displayMostWantedValue = (value) => {
  const text = String(value ?? '').trim();
  return text || 'N/A';
};

export const hasMostWantedValue = (value) => String(value ?? '').trim().length > 0;

const filterPublicMostWantedFacts = (items) =>
  items.filter(({ value }) => hasMostWantedValue(value));

export const getLawEnforcementDisplay = (details) => {
  if (!details) return 'N/A';
  if (details.law_enforcement === 'Other Law Enforcement' && details.law_enforcement_other?.trim()) {
    return details.law_enforcement_other.trim();
  }
  return displayMostWantedValue(details.law_enforcement);
};

/** Report facts shown in the hero sidebar (omits empty fields and internal Report ID) */
export const getCaseFactsList = (details) => {
  if (!details) return [];
  const lawEnforcement =
    details.law_enforcement === 'Other Law Enforcement'
      ? details.law_enforcement_other
      : details.law_enforcement;

  return filterPublicMostWantedFacts([
    { label: 'Crime type', value: details.crime_type },
    { label: 'Crime location', value: formatCrimeLocation(details) },
    { label: 'Suspect name', value: details.suspect_name },
    { label: 'Nickname', value: details.nickname },
    { label: 'Number of people involved', value: details.people_involved },
    { label: 'Law enforcement', value: lawEnforcement },
  ]);
};

/** Physical description list for public page (omits empty fields) */
export const getPhysicalDescriptionList = (details) => {
  if (!details) return [];
  return filterPublicMostWantedFacts([
    { label: 'Suspect name', value: details.suspect_name },
    { label: 'Whereabouts', value: details.whereabouts },
    { label: 'Sex', value: details.sex },
    { label: 'Age', value: details.age },
    { label: 'Height', value: details.height },
    { label: 'Build', value: details.build },
    { label: 'Hair colour', value: details.hair_colour },
  ]);
};

export const getMostWantedCardExcerpt = (post) => {
  const details = normalizeMostWantedDetails(post?.most_wanted_details);
  const text = details.full_details?.trim();
  if (!text) return '';
  return text.length > 160 ? `${text.slice(0, 160)}…` : text;
};

export const buildMostWantedContentSnippet = (title, details) => {
  const d = normalizeMostWantedDetails(details);
  const parts = [
    title,
    d.suspect_name && `Suspect: ${d.suspect_name}`,
    d.crime_type && `Crime: ${d.crime_type}`,
    formatCrimeLocation(d) && `Location: ${formatCrimeLocation(d)}`,
    d.full_details,
    d.additional_information,
    d.whereabouts && `Whereabouts: ${d.whereabouts}`,
  ].filter(Boolean);
  return parts.join('\n\n').slice(0, 8000);
};

export const suggestMostWantedTitle = (details) => {
  const d = normalizeMostWantedDetails(details);
  return buildMostWantedHeadline(d) || '';
};

const BOUNTY_CTA_BY_TYPE = {
  item: {
    type: 'item',
    buttonText: 'Give Information About This Item',
    description: 'Have information about this item? Submit it anonymously and earn the reward.',
  },
  vehicle: {
    type: 'vehicle',
    buttonText: 'Give Information About This Vehicle',
    description: 'Have information about this vehicle? Submit it anonymously and earn the reward.',
  },
  location: {
    type: 'location',
    buttonText: 'Give Information About This Location',
    description: 'Have information about this location? Submit it anonymously and earn the reward.',
  },
  organization: {
    type: 'organization',
    buttonText: 'Give Information About This Organization',
    description: 'Have information about this organization? Submit it anonymously and earn the reward.',
  },
  person: {
    type: 'person',
    buttonText: 'Give Information About This Person',
    description: 'Have information about this person? Submit it anonymously and earn the reward.',
  },
  general: {
    type: 'general',
    buttonText: 'Give Information About This Case',
    description: 'Have information about this case? Submit it anonymously and earn the reward.',
  },
};

const BOUNTY_TYPE_RULES = [
  {
    type: 'vehicle',
    keywords: [
      'vehicle',
      'car',
      'truck',
      'bus',
      'motorcycle',
      'bike',
      'van',
      'suv',
      'automobile',
      'transport',
    ],
  },
  {
    type: 'person',
    keywords: [
      'kidnap',
      'kidnapped',
      'kidnapping',
      'abduction',
      'abducted',
      'hostage',
      'victim',
      'murder',
      'murdered',
      'killed',
      'assassination',
      'missing',
      'person',
      'individual',
      'suspect',
      'criminal',
      'fugitive',
      'wanted',
      'man',
      'woman',
      'boy',
      'girl',
      'teenager',
      'adult',
      'elderly',
      'child',
      'baby',
      'infant',
      'son',
      'daughter',
      'husband',
      'wife',
      'mr',
      'mrs',
      'ms',
      'sir',
    ],
  },
  {
    type: 'item',
    keywords: [
      'stolen',
      'theft',
      'robbed',
      'dress',
      'jewelry',
      'jewellery',
      'diamond',
      'watch',
      'phone',
      'laptop',
      'bag',
      'wallet',
      'necklace',
      'ring',
      'gadget',
      'device',
      'parcel',
    ],
  },
  {
    type: 'location',
    keywords: [
      'location',
      'place',
      'building',
      'house',
      'property',
      'area',
      'site',
      'venue',
      'facility',
      'premises',
    ],
  },
  {
    type: 'organization',
    keywords: [
      'company',
      'organization',
      'corporation',
      'business',
      'firm',
      'agency',
      'group',
      'society',
      'association',
      'institution',
    ],
  },
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Match whole words only — avoids false hits like "man" inside "diamond". */
export function matchesWholeWord(text, keyword) {
  if (!text || !keyword) return false;
  const pattern = new RegExp(`\\b${escapeRegExp(keyword)}\\b`, 'i');
  return pattern.test(text);
}

export function normalizeBountySearchText(title, content) {
  const plainContent = String(content ?? '').replace(/<[^>]*>/g, ' ');
  return `${title ?? ''} ${plainContent}`.toLowerCase().replace(/\s+/g, ' ').trim();
}

export function getBountyInfo({ title = '', content = '' } = {}) {
  const combinedText = normalizeBountySearchText(title, content);

  for (const rule of BOUNTY_TYPE_RULES) {
    if (rule.keywords.some((keyword) => matchesWholeWord(combinedText, keyword))) {
      return BOUNTY_CTA_BY_TYPE[rule.type];
    }
  }

  return BOUNTY_CTA_BY_TYPE.general;
}

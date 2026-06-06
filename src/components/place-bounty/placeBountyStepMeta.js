import { Award, MapPin, Paperclip, Coins, Shield } from 'lucide-react';

export const PLACE_BOUNTY_STEPS = [
  {
    id: 'case',
    shortLabel: 'Case details',
    title: 'Describe the case',
    subtitle:
      'Give your bounty a clear title, describe the suspect or subject, and choose the type of crime.',
    icon: Award,
  },
  {
    id: 'location',
    shortLabel: 'Location',
    title: 'Where did it happen?',
    subtitle: 'Tell us where and when the incident occurred.',
    icon: MapPin,
  },
  {
    id: 'evidence',
    shortLabel: 'Evidence',
    title: 'Supporting files',
    subtitle: 'Upload images, videos, or documents that support your bounty. At least one file is required.',
    icon: Paperclip,
  },
  {
    id: 'reward',
    shortLabel: 'Reward',
    title: 'Set the bounty amount',
    subtitle: 'Offer a reward for information. Refundable if your bounty is not approved.',
    icon: Coins,
  },
  {
    id: 'finish',
    shortLabel: 'Finish',
    title: 'Review & submit',
    subtitle: 'Confirm your details, create a secure password, and place your bounty.',
    icon: Shield,
  },
];

export function getStepNumber(steps, stepId) {
  const index = steps.findIndex((s) => s.id === stepId);
  return index >= 0 ? index + 1 : null;
}

export const TOTAL_PLACE_BOUNTY_STEPS = PLACE_BOUNTY_STEPS.length;

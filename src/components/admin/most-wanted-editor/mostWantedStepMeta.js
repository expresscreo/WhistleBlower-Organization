import { FileText, User, ScanFace, BookOpen, ImageIcon, ClipboardCheck } from 'lucide-react';

export const MOST_WANTED_EDITOR_STEPS = [
  {
    id: 'case_facts',
    shortLabel: 'Report facts',
    title: 'Report information',
    subtitle: 'Crime type, location, report ID, and investigating agency.',
    icon: FileText,
  },
  {
    id: 'identity',
    shortLabel: 'Identity',
    title: 'Alert headline & identity',
    subtitle: 'Public title, suspect name, and nickname.',
    icon: User,
  },
  {
    id: 'physical',
    shortLabel: 'Appearance',
    title: 'Physical description',
    subtitle: 'Help the public recognise the suspect.',
    icon: ScanFace,
  },
  {
    id: 'narrative',
    shortLabel: 'Narrative',
    title: 'Summary & details',
    subtitle: 'Full details and additional information.',
    icon: BookOpen,
  },
  {
    id: 'media',
    shortLabel: 'Photos',
    title: 'Photos',
    subtitle: 'Featured image and optional additional photos.',
    icon: ImageIcon,
  },
  {
    id: 'review',
    shortLabel: 'Review',
    title: 'Review & publish',
    subtitle: 'Confirm details before saving.',
    icon: ClipboardCheck,
  },
];

export function getMostWantedStepNumber(steps, stepId) {
  const index = steps.findIndex((s) => s.id === stepId);
  return index >= 0 ? index + 1 : null;
}

export const TOTAL_MOST_WANTED_EDITOR_STEPS = MOST_WANTED_EDITOR_STEPS.length;

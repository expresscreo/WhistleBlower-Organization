import { Building, MapPin, FileText, Paperclip, Shield, Eye } from 'lucide-react';

const REPORT_STEPS = [
  {
    id: 'organization',
    shortLabel: 'Organization',
    title: 'Which organization?',
    subtitle: 'Search by organization name. We never ask for your identity on this step.',
    icon: Building,
  },
  {
    id: 'context',
    shortLabel: 'Context',
    title: 'Incident context',
    subtitle: 'Where and when did this happen? Choose the category that fits best.',
    icon: MapPin,
  },
  {
    id: 'story',
    shortLabel: 'Your story',
    title: 'Tell your story',
    subtitle: 'Write a detailed report or record a voice note — your voice will be anonymized.',
    icon: FileText,
  },
  {
    id: 'evidence',
    shortLabel: 'Evidence',
    title: 'Supporting evidence',
    subtitle: 'Optional files strengthen your report. You can skip this step.',
    icon: Paperclip,
  },
  {
    id: 'finish',
    shortLabel: 'Finish',
    title: 'Review & submit',
    subtitle: 'Confirm your details, set secure access, and send your report.',
    icon: Shield,
  },
];

const FEEDBACK_REPORT_STEPS = [
  {
    ...REPORT_STEPS[0],
    title: 'Which organization?',
    subtitle: 'Tell us which organization your feedback is about.',
  },
  {
    ...REPORT_STEPS[1],
    title: 'Feedback context',
    subtitle: 'When did this occur? Choose the category that best describes your feedback.',
  },
  {
    ...REPORT_STEPS[2],
    title: 'Share your feedback',
    subtitle: 'Describe your experience or suggestion in detail, or record a voice note.',
  },
  REPORT_STEPS[3],
  {
    ...REPORT_STEPS[4],
    title: 'Review & submit',
    subtitle: 'Confirm your details and submit your feedback securely.',
  },
];

/** Bounty tips skip organization — the bounty itself provides context. */
const BOUNTY_REPORT_STEPS = [
  {
    id: 'context',
    shortLabel: 'Context',
    title: 'Tip context',
    subtitle: 'Where did you observe this? Confirm the category for this bounty.',
    icon: MapPin,
  },
  {
    id: 'story',
    shortLabel: 'Your tip',
    title: 'Your tip',
    subtitle: 'Share what you know about this bounty. Be as detailed as possible.',
    icon: FileText,
  },
  {
    id: 'evidence',
    shortLabel: 'Evidence',
    title: 'Supporting evidence',
    subtitle: 'Optional files strengthen your tip. You can skip this step.',
    icon: Paperclip,
  },
  {
    id: 'finish',
    shortLabel: 'Finish',
    title: 'Review & submit',
    subtitle: 'Confirm your tip, set secure access, and submit.',
    icon: Shield,
  },
];

/** Most Wanted tips skip organization and focus on sightings. */
const MOST_WANTED_REPORT_STEPS = [
  {
    id: 'context',
    shortLabel: 'Alert context',
    title: 'Most Wanted alert context',
    subtitle: 'Confirm the alert and share where and when you saw this person.',
    icon: MapPin,
  },
  {
    id: 'match',
    shortLabel: 'What matched',
    title: 'What matched this person?',
    subtitle: 'Tell us what identifying details matched the alert.',
    icon: Eye,
  },
  {
    id: 'story',
    shortLabel: 'Your intel',
    title: 'Share your intel',
    subtitle: 'Describe what you observed and any immediate risk details.',
    icon: FileText,
  },
  {
    id: 'evidence',
    shortLabel: 'Evidence',
    title: 'Supporting evidence',
    subtitle: 'Optional files can help investigators verify the sighting.',
    icon: Paperclip,
  },
  {
    id: 'finish',
    shortLabel: 'Finish',
    title: 'Review & submit',
    subtitle: 'Confirm your tip and submit securely.',
    icon: Shield,
  },
];

export function enrichStepMeta(stepMeta, { isBountyMode = false, isMostWantedMode = false, bountyTitle = '' } = {}) {
  if (isBountyMode && stepMeta?.id === 'context' && bountyTitle.trim()) {
    return {
      ...stepMeta,
      title: `Tip about “${bountyTitle.trim()}”`,
      subtitle: 'Where did you observe this? Confirm the category for this bounty.',
    };
  }
  if (isMostWantedMode && stepMeta?.id === 'context' && bountyTitle.trim()) {
    return {
      ...stepMeta,
      title: `Tip about “${bountyTitle.trim()}”`,
      subtitle: 'Confirm this alert and share sighting location and time.',
    };
  }
  return stepMeta;
}

export function getSubmitReportSteps({ isFeedbackMode = false, isBountyMode = false, isMostWantedMode = false } = {}) {
  if (isMostWantedMode) return MOST_WANTED_REPORT_STEPS;
  if (isBountyMode) return BOUNTY_REPORT_STEPS;
  if (isFeedbackMode) return FEEDBACK_REPORT_STEPS;
  return REPORT_STEPS;
}

export function getStepNumber(steps, stepId) {
  const index = steps.findIndex((s) => s.id === stepId);
  return index >= 0 ? index + 1 : null;
}

export const TOTAL_SUBMIT_REPORT_STEPS = REPORT_STEPS.length;

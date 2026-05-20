import { Building, MapPin, FileText, Paperclip, Shield } from 'lucide-react';

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

const BOUNTY_REPORT_STEPS = [
  {
    ...REPORT_STEPS[0],
    title: 'Bounty information',
    subtitle: 'Confirm the organization related to this bounty tip.',
  },
  {
    ...REPORT_STEPS[1],
    title: 'Tip context',
    subtitle: 'When and where did you observe this? Select the best category.',
  },
  {
    ...REPORT_STEPS[2],
    title: 'Your tip',
    subtitle: 'Provide details about what you know regarding this bounty.',
  },
  REPORT_STEPS[3],
  {
    ...REPORT_STEPS[4],
    title: 'Review & submit',
    subtitle: 'Confirm your tip, set secure access, and submit.',
  },
];

export function getSubmitReportSteps({ isFeedbackMode = false, isBountyMode = false } = {}) {
  if (isBountyMode) return BOUNTY_REPORT_STEPS;
  if (isFeedbackMode) return FEEDBACK_REPORT_STEPS;
  return REPORT_STEPS;
}

export const TOTAL_SUBMIT_REPORT_STEPS = REPORT_STEPS.length;

import { format } from 'date-fns';

export const FEEDBACK_CATEGORIES = [
  'Suggestion',
  'Fraud & Financial Misconduct',
  'Harassment & Discrimination',
  'Safety Violations',
  'Compliance Breach',
  'Theft',
  'Environmental Violations',
  'Conflicts of Interest',
  'Others',
];

export const REPORT_CATEGORIES = [
  'Bounty',
  'Most Wanted',
  'Fraud & Financial Misconduct',
  'Harassment & Discrimination',
  'Safety Violations',
  'Theft or Vandalism',
  'Cybersecurity Breach',
  'Substance Abuse',
  'Policy Violation',
  'Other',
];

export function getCategories(isFeedbackMode) {
  return isFeedbackMode ? FEEDBACK_CATEGORIES : REPORT_CATEGORIES;
}

export function formatIncidentDate(date) {
  if (!date) return '';
  try {
    return format(date instanceof Date ? date : new Date(date), 'PPP');
  } catch {
    return '';
  }
}

export function formatDateForInput(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

export function formatTimeSeenDisplay(value) {
  if (!value?.trim()) return '';
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return value;
  const hours = Number(match[1]);
  const minutes = match[2];
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes} ${period}`;
}

export function parseDateInput(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export const MAX_EVIDENCE_FILE_BYTES = 200 * 1024 * 1024;

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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

/** Public incident categories — Nigeria-focused, plain-language labels. */
export const PUBLIC_REPORT_CATEGORIES = [
  'Fraud & Scam',
  'Cybercrime / Online Fraud',
  'Bribery & Corruption',
  'Police Misconduct / Extortion',
  'Theft / Robbery',
  'Kidnapping / Human Trafficking',
  'Drug Abuse or Trafficking',
  'Fake Drugs',
  'Cultism / Gang Activity',
  'Assault / Violence',
  'Domestic Violence',
  'Sexual Harassment or Abuse',
  'Child Abuse or Exploitation',
  'Illegal Weapons',
  'Financial Misconduct / Embezzlement',
  'Workplace Harassment or Abuse',
  'Vandalism / Property Damage',
  'Environmental Violation',
  'Public Safety Threat',
  'Other',
];

/** System-assigned categories (bounty / most-wanted flows). */
export const SYSTEM_REPORT_CATEGORIES = ['Bounty', 'Most Wanted'];

export const REPORT_CATEGORIES = [
  ...SYSTEM_REPORT_CATEGORIES,
  ...PUBLIC_REPORT_CATEGORIES,
];

export function getCategories(isFeedbackMode, { isBountyMode = false } = {}) {
  if (isFeedbackMode) return FEEDBACK_CATEGORIES;
  if (isBountyMode) {
    return ['Bounty', ...PUBLIC_REPORT_CATEGORIES];
  }
  return PUBLIC_REPORT_CATEGORIES;
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
  return toDateInputValue(d);
}

/** Format a Date for `<input type="date">` (YYYY-MM-DD, local timezone). */
export function toDateInputValue(date) {
  if (!date || !(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '';
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Parse `<input type="date">` value to a local Date at midnight. */
export function parseDateInputValue(value) {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
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
  return parseDateInputValue(value);
}

export const MAX_EVIDENCE_FILE_BYTES = 200 * 1024 * 1024;

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

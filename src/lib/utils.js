import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
	return twMerge(clsx(inputs));
}

export const sanitizeFilename = (filename) => {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
};

export const formatNumberWithCommas = (value) => {
  if (!value) return '';
  const stringValue = String(value).replace(/,/g, '');
  if (isNaN(Number(stringValue))) return value;
  return Number(stringValue).toLocaleString('en-US');
};
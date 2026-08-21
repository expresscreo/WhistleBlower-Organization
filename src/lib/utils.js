import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
	return twMerge(clsx(inputs));
}

export const sanitizeFilename = (filename) => {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
};

function groupThousands(intPart) {
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export const formatNumberWithCommas = (value, { allowNegative = false } = {}) => {
  if (value === null || value === undefined) return '';
  let raw = String(value).replace(/,/g, '').trim();
  if (!raw) return '';

  const negative = allowNegative && raw.startsWith('-');
  if (raw.startsWith('-')) raw = raw.slice(1);
  if (!raw) return negative ? '-' : '';

  let formatted;
  if (/^\d+$/.test(raw)) {
    formatted = groupThousands(raw);
  } else {
    const decimalMatch = raw.match(/^(\d+)\.(\d*)$/);
    if (decimalMatch) {
      formatted = `${groupThousands(decimalMatch[1])}.${decimalMatch[2]}`;
    } else if (/^\d+\.$/.test(raw)) {
      formatted = `${groupThousands(raw.slice(0, -1))}.`;
    } else {
      const digits = raw.replace(/\D/g, '');
      if (!digits) return negative ? '-' : '';
      formatted = groupThousands(digits);
    }
  }

  return negative ? `-${formatted}` : formatted;
};

export const parseFormattedNumber = (value) => {
  if (value === null || value === undefined || value === '') return NaN;
  const raw = String(value).replace(/,/g, '').trim();
  if (!raw || raw === '-' || raw === '.' || raw === '-.') return NaN;
  return Number(raw);
};

/** Strip HTML tags and collapse whitespace for plain-text previews. */
export const htmlToPlainText = (html) => {
  if (!html) return '';
  return String(html)
    .replace(/<img[^>]*>/gi, ' [Image] ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
};

// Create URL-safe slugs from titles
export const slugify = (input) => {
  if (!input) return '';
  return String(input)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/,/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};
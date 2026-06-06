import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
	return twMerge(clsx(inputs));
}

export const sanitizeFilename = (filename) => {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
};

export const formatNumberWithCommas = (value) => {
  if (value === null || value === undefined) return '';
  const raw = String(value).replace(/,/g, '');
  if (!raw) return '';

  if (/^\d+$/.test(raw)) {
    return raw.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  const decimalMatch = raw.match(/^(\d+)\.(\d*)$/);
  if (decimalMatch) {
    const [, intPart, decPart] = decimalMatch;
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `${formattedInt}.${decPart}`;
  }

  if (/^\d+\.$/.test(raw)) {
    const intPart = raw.slice(0, -1);
    return `${intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.`;
  }

  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
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
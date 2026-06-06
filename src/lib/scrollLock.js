let lockCount = 0;
let savedScrollY = 0;
let savedHtmlOverflow = '';
let savedBodyStyles = null;

const getScrollbarWidth = () => {
  if (typeof window === 'undefined') return 0;
  return window.innerWidth - document.documentElement.clientWidth;
};

/**
 * Freeze page scroll without layout shift when the scrollbar disappears.
 * Reference-counted so nested modals (e.g. menu + lightbox) stay safe.
 */
export const lockBodyScroll = () => {
  if (typeof document === 'undefined') return;

  lockCount += 1;
  if (lockCount > 1) return;

  const { body, documentElement: html } = document;
  savedScrollY = window.scrollY;
  const scrollbarWidth = getScrollbarWidth();

  savedHtmlOverflow = html.style.overflow;
  savedBodyStyles = {
    overflow: body.style.overflow,
    paddingRight: body.style.paddingRight,
    position: body.style.position,
    top: body.style.top,
    left: body.style.left,
    right: body.style.right,
    width: body.style.width,
  };

  html.style.overflow = 'hidden';
  body.style.overflow = 'hidden';
  body.style.paddingRight = scrollbarWidth > 0 ? `${scrollbarWidth}px` : '';
  body.style.position = 'fixed';
  body.style.top = `-${savedScrollY}px`;
  body.style.left = '0';
  body.style.right = '0';
  body.style.width = '100%';
};

export const unlockBodyScroll = () => {
  if (typeof document === 'undefined') return;

  lockCount = Math.max(0, lockCount - 1);
  if (lockCount > 0 || !savedBodyStyles) return;

  const { body, documentElement: html } = document;

  html.style.overflow = savedHtmlOverflow;
  body.style.overflow = savedBodyStyles.overflow;
  body.style.paddingRight = savedBodyStyles.paddingRight;
  body.style.position = savedBodyStyles.position;
  body.style.top = savedBodyStyles.top;
  body.style.left = savedBodyStyles.left;
  body.style.right = savedBodyStyles.right;
  body.style.width = savedBodyStyles.width;

  window.scrollTo(0, savedScrollY);
  savedBodyStyles = null;
  savedScrollY = 0;
};

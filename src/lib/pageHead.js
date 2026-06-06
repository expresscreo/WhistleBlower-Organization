const PAGE_HEAD_ATTR = 'data-page-head';

function upsertMeta(attr, name, content) {
  if (content == null || content === '') return () => {};

  const selector = `meta[${attr}="${name}"][${PAGE_HEAD_ATTR}]`;
  let el = document.head.querySelector(selector);
  const isNew = !el;

  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    el.setAttribute(PAGE_HEAD_ATTR, '');
    document.head.appendChild(el);
  }

  const previous = el.getAttribute('content');
  el.setAttribute('content', String(content));

  return () => {
    if (isNew) {
      el.remove();
      return;
    }
    if (previous != null) el.setAttribute('content', previous);
    else el.removeAttribute('content');
  };
}

function upsertLink(rel, href) {
  if (!href) return () => {};

  const selector = `link[rel="${rel}"][${PAGE_HEAD_ATTR}]`;
  let el = document.head.querySelector(selector);
  const isNew = !el;

  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    el.setAttribute(PAGE_HEAD_ATTR, '');
    document.head.appendChild(el);
  }

  const previous = el.getAttribute('href');
  el.setAttribute('href', href);

  return () => {
    if (isNew) {
      el.remove();
      return;
    }
    if (previous != null) el.setAttribute('href', previous);
    else el.removeAttribute('href');
  };
}

function upsertJsonLd(id, data) {
  if (!data) return () => {};

  const selector = `script[type="application/ld+json"][${PAGE_HEAD_ATTR}="${id}"]`;
  let el = document.head.querySelector(selector);
  const isNew = !el;
  const json = JSON.stringify(data);

  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.setAttribute(PAGE_HEAD_ATTR, id);
    document.head.appendChild(el);
  }

  const previous = el.textContent;
  el.textContent = json;

  return () => {
    if (isNew) {
      el.remove();
      return;
    }
    if (previous != null) el.textContent = previous;
    else el.textContent = '';
  };
}

/**
 * Apply document title and head meta tags. Returns a cleanup function.
 */
export function applyPageHead({
  title,
  description,
  keywords,
  robots,
  canonical,
  ogTitle,
  ogDescription,
  ogImage,
  ogUrl,
  ogType,
  ogSiteName,
  ogLocale,
  twitterCard,
  twitterSite,
  twitterCreator,
  twitterTitle,
  twitterDescription,
  twitterImage,
  structuredData,
}) {
  const cleanups = [];

  if (title) {
    const previousTitle = document.title;
    document.title = title;
    cleanups.push(() => {
      document.title = previousTitle;
    });
  }

  if (description) cleanups.push(upsertMeta('name', 'description', description));
  if (keywords) cleanups.push(upsertMeta('name', 'keywords', keywords));
  if (robots) cleanups.push(upsertMeta('name', 'robots', robots));

  if (canonical) cleanups.push(upsertLink('canonical', canonical));

  if (ogTitle) cleanups.push(upsertMeta('property', 'og:title', ogTitle));
  if (ogDescription) cleanups.push(upsertMeta('property', 'og:description', ogDescription));
  if (ogImage) cleanups.push(upsertMeta('property', 'og:image', ogImage));
  if (ogUrl) cleanups.push(upsertMeta('property', 'og:url', ogUrl));
  if (ogType) cleanups.push(upsertMeta('property', 'og:type', ogType));
  if (ogSiteName) cleanups.push(upsertMeta('property', 'og:site_name', ogSiteName));
  if (ogLocale) cleanups.push(upsertMeta('property', 'og:locale', ogLocale));

  if (twitterCard) cleanups.push(upsertMeta('name', 'twitter:card', twitterCard));
  if (twitterSite) cleanups.push(upsertMeta('name', 'twitter:site', twitterSite));
  if (twitterCreator) cleanups.push(upsertMeta('name', 'twitter:creator', twitterCreator));
  if (twitterTitle) cleanups.push(upsertMeta('name', 'twitter:title', twitterTitle));
  if (twitterDescription) cleanups.push(upsertMeta('name', 'twitter:description', twitterDescription));
  if (twitterImage) cleanups.push(upsertMeta('name', 'twitter:image', twitterImage));

  if (structuredData) {
    cleanups.push(upsertJsonLd('structured-data', structuredData));
  }

  return () => {
    cleanups.forEach((cleanup) => cleanup());
  };
}

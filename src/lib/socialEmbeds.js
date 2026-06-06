const TWITTER_HOSTS = new Set(['twitter.com', 'x.com', 'mobile.twitter.com', 'mobile.x.com']);
const FACEBOOK_HOSTS = new Set([
  'facebook.com',
  'm.facebook.com',
  'fb.com',
  'fb.watch',
  'l.facebook.com',
]);
const TIKTOK_HOSTS = new Set(['tiktok.com', 'www.tiktok.com', 'vm.tiktok.com']);
const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'www.youtu.be']);

const SCRIPT_IDS = {
  twitter: 'twitter-wjs',
  tiktok: 'tiktok-embed-js',
  facebook: 'facebook-jssdk',
};

const FACEBOOK_SDK_SRC = 'https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v21.0';
const FACEBOOK_TRACKING_PARAMS = new Set([
  'fbclid',
  'mibextid',
  '__cft__',
  '__tn__',
  'ref',
  'sfnsn',
  'paipv',
]);

const loadedScripts = new Set();

function escapeAttr(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function normalizeHost(hostname) {
  return String(hostname || '').replace(/^www\./, '').toLowerCase();
}

function parseUrl(input) {
  const raw = String(input || '').trim();
  if (!raw) return null;

  try {
    return new URL(raw.includes('://') ? raw : `https://${raw}`);
  } catch {
    return null;
  }
}

function isFacebookHost(host) {
  return FACEBOOK_HOSTS.has(host) || host.endsWith('.facebook.com');
}

function isYoutubeHost(host) {
  return YOUTUBE_HOSTS.has(host) || host.endsWith('.youtube.com');
}

function parseYouTubeVideoId(url) {
  const host = normalizeHost(url.hostname);

  if (host === 'youtu.be') {
    const id = url.pathname.replace(/^\//, '').split('/')[0];
    return id || null;
  }

  if (!isYoutubeHost(host)) return null;

  const fromQuery = url.searchParams.get('v');
  if (fromQuery) return fromQuery;

  const pathPatterns = [
    /^\/embed\/([^/?]+)/i,
    /^\/shorts\/([^/?]+)/i,
    /^\/live\/([^/?]+)/i,
    /^\/v\/([^/?]+)/i,
  ];

  for (const pattern of pathPatterns) {
    const match = url.pathname.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

export function extractFacebookVideoId(url) {
  if (!url) return null;

  const path = url.pathname.toLowerCase();
  const vParam = url.searchParams.get('v');
  if (vParam && /^\d+$/.test(vParam)) return vParam;

  if (path === '/video.php' || path.endsWith('/video.php')) {
    const idParam = url.searchParams.get('id');
    if (idParam && /^\d+$/.test(idParam)) return idParam;
  }

  const pathPatterns = [
    /\/videos\/(\d+)/i,
    /\/reels?\/(\d+)/i,
    /\/watch\/(?:live\/)?(\d+)/i,
  ];

  for (const pattern of pathPatterns) {
    const match = url.pathname.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

export function normalizeFacebookUrl(input) {
  const url = typeof input === 'string' ? parseUrl(input) : input;
  if (!url || !isFacebookHost(normalizeHost(url.hostname))) {
    return typeof input === 'string' ? input : input?.href || '';
  }

  const host = normalizeHost(url.hostname);
  const path = url.pathname.replace(/\/+$/, '') || '/';

  for (const key of [...url.searchParams.keys()]) {
    if (FACEBOOK_TRACKING_PARAMS.has(key)) {
      url.searchParams.delete(key);
    }
  }

  if (host === 'fb.watch') {
    const code = path.replace(/^\//, '').split('/')[0];
    return code ? `https://fb.watch/${code}/` : url.href;
  }

  if (host === 'fb.com' && path.length > 1) {
    return `https://fb.watch${path}/`;
  }

  const shareMatch = path.match(/^\/share\/([vr])\/([^/]+)/i);
  if (shareMatch) {
    return `https://www.facebook.com/share/${shareMatch[1]}/${shareMatch[2]}/`;
  }

  const reelMatch = path.match(/^\/reels?\/([^/]+)/i);
  if (reelMatch) {
    return `https://www.facebook.com/reel/${reelMatch[1]}/`;
  }

  const videoId = extractFacebookVideoId(url);
  if (videoId) {
    return `https://www.facebook.com/watch/?v=${videoId}`;
  }

  if (path === '/watch' || path === '/watch.php' || path === '/video.php') {
    const watchId = url.searchParams.get('v') || url.searchParams.get('id');
    if (watchId) {
      return `https://www.facebook.com/watch/?v=${watchId}`;
    }
  }

  url.hostname = 'www.facebook.com';
  url.protocol = 'https:';
  url.hash = '';

  const cleaned = url.toString();
  return cleaned.endsWith('/') ? cleaned : `${cleaned}/`;
}

export function buildFacebookEmbedHref(url) {
  const normalized = normalizeFacebookUrl(url);
  const parsed = parseUrl(normalized);
  if (!parsed) return normalized;

  const videoId = extractFacebookVideoId(parsed);
  if (videoId) {
    return `https://www.facebook.com/watch/?v=${videoId}`;
  }

  return normalized;
}

function isFacebookVideoUrl(url) {
  const host = normalizeHost(url.hostname);
  const path = url.pathname.toLowerCase();

  return (
    host === 'fb.watch' ||
    host === 'fb.com' ||
    path.includes('/share/v/') ||
    path.includes('/share/r/') ||
    path.includes('/reel/') ||
    path.includes('/reels/') ||
    path.includes('/videos/') ||
    path.includes('/watch') ||
    path === '/video.php' ||
    url.searchParams.has('v') ||
    ((path === '/video.php' || path.endsWith('/video.php')) && url.searchParams.has('id'))
  );
}

export function facebookUrlNeedsResolution(url) {
  const parsed = typeof url === 'string' ? parseUrl(url) : url;
  if (!parsed || !isFacebookHost(normalizeHost(parsed.hostname))) return false;

  const host = normalizeHost(parsed.hostname);
  const path = parsed.pathname.toLowerCase();

  return (
    host === 'fb.watch' ||
    host === 'fb.com' ||
    host === 'l.facebook.com' ||
    host === 'm.facebook.com' ||
    path.includes('/share/')
  );
}

export async function resolveFacebookEmbedUrl(input) {
  const parsed = typeof input === 'string' ? parseSocialEmbedUrl(input) : input;
  if (!parsed || parsed.platform !== 'facebook') return parsed;

  let workingUrl = parsed.url;

  if (facebookUrlNeedsResolution(workingUrl)) {
    try {
      const response = await fetch(
        `/api/resolve-social-url?url=${encodeURIComponent(workingUrl)}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data?.url) workingUrl = data.url;
      }
    } catch (error) {
      console.warn('Could not resolve Facebook URL:', error);
    }
  }

  const normalized = normalizeFacebookUrl(workingUrl);
  const embedHref = buildFacebookEmbedHref(normalized);
  const normalizedUrl = parseUrl(normalized);

  return {
    ...parsed,
    url: normalized,
    embedHref,
    isVideo: normalizedUrl ? isFacebookVideoUrl(normalizedUrl) : parsed.isVideo,
  };
}

export async function resolveSocialEmbedUrl(input) {
  const parsed = parseSocialEmbedUrl(input);
  if (!parsed) return null;
  if (parsed.platform === 'facebook') {
    return resolveFacebookEmbedUrl(parsed);
  }
  return parsed;
}

export function parseSocialEmbedUrl(input) {
  const url = parseUrl(input);
  if (!url) return null;

  const host = normalizeHost(url.hostname);

  const youtubeVideoId = parseYouTubeVideoId(url);
  if (youtubeVideoId) {
    return {
      platform: 'youtube',
      url: `https://www.youtube.com/watch?v=${youtubeVideoId}`,
      videoId: youtubeVideoId,
      isVideo: true,
    };
  }

  const twitterMatch = url.pathname.match(/^\/([^/]+)\/status\/(\d+)/i);
  if (TWITTER_HOSTS.has(host) && twitterMatch) {
    const username = twitterMatch[1];
    const statusId = twitterMatch[2];
    return {
      platform: 'twitter',
      url: `https://twitter.com/${username}/status/${statusId}`,
      statusId,
      isVideo: false,
    };
  }

  const tiktokMatch = url.pathname.match(/^\/@([^/]+)\/video\/(\d+)/i);
  if (TIKTOK_HOSTS.has(host) && tiktokMatch) {
    return {
      platform: 'tiktok',
      url: `https://www.tiktok.com/@${tiktokMatch[1]}/video/${tiktokMatch[2]}`,
      videoId: tiktokMatch[2],
      isVideo: true,
    };
  }

  if (host === 'vm.tiktok.com' && url.pathname.length > 1) {
    return {
      platform: 'tiktok',
      url: url.origin + url.pathname,
      isVideo: true,
    };
  }

  if (isFacebookHost(host)) {
    const normalized = normalizeFacebookUrl(url);
    const normalizedUrl = parseUrl(normalized) || url;
    const isVideo = isFacebookVideoUrl(url) || isFacebookVideoUrl(normalizedUrl);

    return {
      platform: 'facebook',
      url: normalized,
      embedHref: buildFacebookEmbedHref(normalized),
      isVideo,
    };
  }

  return null;
}

export function isSocialEmbedUrl(input) {
  return Boolean(parseSocialEmbedUrl(input));
}

function buildTwitterEmbedInner(url) {
  return `<blockquote class="twitter-tweet" data-dnt="true" data-theme="dark"><a href="${escapeAttr(url)}"></a></blockquote>`;
}

function buildTikTokEmbedInner(parsed) {
  const videoIdAttr = parsed.videoId ? ` data-video-id="${escapeAttr(parsed.videoId)}"` : '';
  return `<blockquote class="tiktok-embed" cite="${escapeAttr(parsed.url)}"${videoIdAttr} style="max-width:605px;min-width:325px;"><a href="${escapeAttr(parsed.url)}">View on TikTok</a></blockquote>`;
}

function buildYouTubeEmbedInner(videoId) {
  const src = `https://www.youtube.com/embed/${encodeURIComponent(videoId)}`;
  return `<iframe src="${escapeAttr(src)}" class="social-embed-iframe social-embed-youtube" style="border:none;overflow:hidden;width:100%;aspect-ratio:16/9;max-width:100%;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen title="YouTube video"></iframe>`;
}

function buildFacebookEmbedInner(parsed) {
  const href = parsed.embedHref || parsed.url;
  const { isVideo } = parsed;

  if (isVideo) {
    return `<div class="fb-video" data-href="${escapeAttr(href)}" data-width="auto" data-show-text="false" data-allowfullscreen="true"></div>`;
  }

  return `<div class="fb-post" data-href="${escapeAttr(href)}" data-width="500" data-show-text="true"></div>`;
}

export function buildSocialEmbedMarkup(parsed) {
  if (!parsed?.platform || !parsed?.url) return '';

  let inner = '';
  switch (parsed.platform) {
    case 'twitter':
      inner = buildTwitterEmbedInner(parsed.url);
      break;
    case 'tiktok':
      inner = buildTikTokEmbedInner(parsed);
      break;
    case 'youtube':
      inner = buildYouTubeEmbedInner(parsed.videoId);
      break;
    case 'facebook':
      inner = buildFacebookEmbedInner(parsed);
      break;
    default:
      return '';
  }

  const videoAttr = parsed.isVideo ? ' data-embed-is-video="true"' : '';
  return `<div class="social-embed-wrap" contenteditable="false" data-embed-platform="${parsed.platform}" data-embed-url="${escapeAttr(parsed.url)}"${videoAttr}>${inner}</div>`;
}

function loadExternalScript(src, id) {
  if (typeof document === 'undefined') return Promise.resolve();
  if (loadedScripts.has(src) || (id && document.getElementById(id))) {
    loadedScripts.add(src);
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    if (id) script.id = id;
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      loadedScripts.add(src);
      resolve();
    };
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

function ensureFbRoot() {
  if (typeof document === 'undefined') return;
  if (!document.getElementById('fb-root')) {
    const root = document.createElement('div');
    root.id = 'fb-root';
    document.body.prepend(root);
  }
}

async function loadFacebookSdk() {
  if (typeof window === 'undefined') return;

  ensureFbRoot();

  if (window.FB?.XFBML?.parse) {
    return;
  }

  const previousInit = window.fbAsyncInit;
  const ready = new Promise((resolve) => {
    window.fbAsyncInit = function fbAsyncInit() {
      previousInit?.();
      resolve();
    };
    window.setTimeout(resolve, 4000);
  });

  await loadExternalScript(FACEBOOK_SDK_SRC, SCRIPT_IDS.facebook);
  await ready;
}

function upgradeLegacyFacebookEmbeds(root) {
  if (!root) return;

  root.querySelectorAll('.social-embed-wrap[data-embed-platform="facebook"]').forEach((wrap) => {
    if (wrap.querySelector('.fb-video, .fb-post')) return;

    const iframe = wrap.querySelector('iframe.social-embed-facebook, iframe[src*="facebook.com/plugins/"]');
    if (!iframe) return;

    const embedUrl = wrap.getAttribute('data-embed-url');
    const isVideo =
      wrap.getAttribute('data-embed-is-video') === 'true' ||
      iframe.classList.contains('social-embed-facebook-video') ||
      iframe.src.includes('video.php');

    let href = embedUrl;
    try {
      const iframeUrl = new URL(iframe.src);
      const hrefParam = iframeUrl.searchParams.get('href');
      if (hrefParam) href = hrefParam;
    } catch {
      // Keep wrap URL.
    }

    const parsed = {
      platform: 'facebook',
      url: normalizeFacebookUrl(href),
      embedHref: buildFacebookEmbedHref(href),
      isVideo,
    };

    iframe.replaceWith(
      (() => {
        const template = document.createElement('template');
        template.innerHTML = buildFacebookEmbedInner(parsed);
        return template.content.firstElementChild;
      })()
    );
  });
}

export async function hydrateSocialEmbeds(root) {
  if (!root || typeof document === 'undefined') return;

  upgradeLegacyFacebookEmbeds(root);

  const hasTwitter = root.querySelector(
    '.twitter-tweet, .social-embed-wrap[data-embed-platform="twitter"] blockquote.twitter-tweet'
  );
  const hasTikTok = root.querySelector(
    '.tiktok-embed, .social-embed-wrap[data-embed-platform="tiktok"] blockquote.tiktok-embed'
  );
  const hasFacebook = root.querySelector(
    '.fb-video, .fb-post, .social-embed-wrap[data-embed-platform="facebook"] .fb-video, .social-embed-wrap[data-embed-platform="facebook"] .fb-post'
  );

  if (hasTwitter) {
    await loadExternalScript('https://platform.twitter.com/widgets.js', SCRIPT_IDS.twitter);
    window.twttr?.widgets?.load?.(root);
  }

  if (hasTikTok) {
    await loadExternalScript('https://www.tiktok.com/embed.js', SCRIPT_IDS.tiktok);
  }

  if (hasFacebook) {
    try {
      await loadFacebookSdk();
      window.FB?.XFBML?.parse?.(root);
    } catch (error) {
      console.error('Facebook embed hydration failed:', error);
    }
  }
}

export function insertNodeAtSelection(editor, node) {
  if (!editor || !node) return false;

  const selection = window.getSelection();
  if (selection?.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    if (editor.contains(range.commonAncestorContainer)) {
      range.deleteContents();
      range.insertNode(node);
      range.setStartAfter(node);
      range.setEndAfter(node);
      selection.removeAllRanges();
      selection.addRange(range);
      return true;
    }
  }

  editor.appendChild(node);
  return true;
}

export function createSocialEmbedElement(parsed) {
  if (typeof document === 'undefined') return null;

  const template = document.createElement('template');
  template.innerHTML = buildSocialEmbedMarkup(parsed);
  return template.content.firstElementChild;
}

const TRUSTED_IFRAME_HOSTS = [
  'facebook.com',
  'www.facebook.com',
  'youtube.com',
  'www.youtube.com',
  'www.youtube-nocookie.com',
  'platform.twitter.com',
  'syndication.twitter.com',
  'www.tiktok.com',
];

export function isTrustedEmbedIframe(src) {
  if (!src) return false;
  try {
    const host = normalizeHost(new URL(src).hostname);
    return TRUSTED_IFRAME_HOSTS.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
  } catch {
    return false;
  }
}

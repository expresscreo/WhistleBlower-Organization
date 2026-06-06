const PREVIEW_PREFIX = 'wb-news-preview:';
const PREVIEW_LATEST_KEY = 'wb-news-preview-latest';
const PREVIEW_MESSAGE_TYPE = 'wb-news-preview-data';
const MAX_STORED_PREVIEWS = 8;

function pruneOldPreviews(aggressive = false) {
  if (typeof window === 'undefined') return;

  const entries = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key?.startsWith(PREVIEW_PREFIX)) continue;
    try {
      const parsed = JSON.parse(localStorage.getItem(key));
      entries.push({ key, savedAt: parsed?.savedAt || 0 });
    } catch {
      localStorage.removeItem(key);
    }
  }

  entries.sort((a, b) => b.savedAt - a.savedAt);
  const keep = aggressive ? 2 : MAX_STORED_PREVIEWS;
  entries.slice(keep).forEach(({ key }) => localStorage.removeItem(key));
}

/**
 * Persist preview payload in localStorage (shared across tabs) and return its id.
 */
export function storeNewsPreviewPayload(payload) {
  if (typeof window === 'undefined') {
    throw new Error('Preview storage is only available in the browser.');
  }

  const id = crypto.randomUUID();
  const record = {
    id,
    savedAt: Date.now(),
    post: payload.post,
    bountyDetails: payload.bountyDetails ?? null,
  };

  const write = () => {
    localStorage.setItem(`${PREVIEW_PREFIX}${id}`, JSON.stringify(record));
    localStorage.setItem(PREVIEW_LATEST_KEY, id);
    pruneOldPreviews();
  };

  try {
    write();
  } catch (error) {
    if (error?.name === 'QuotaExceededError') {
      pruneOldPreviews(true);
      write();
    } else {
      throw error;
    }
  }

  return id;
}

export function getPreviewIdFromLocation() {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('id');
}

export function resolveNewsPreviewIds(previewId) {
  if (typeof window === 'undefined') return previewId ? [previewId] : [];

  const ids = new Set();
  if (previewId) ids.add(previewId);

  const fromUrl = getPreviewIdFromLocation();
  if (fromUrl) ids.add(fromUrl);

  const latest = localStorage.getItem(PREVIEW_LATEST_KEY);
  if (latest) ids.add(latest);

  return [...ids];
}

export function loadNewsPreviewPayload(previewId) {
  if (typeof window === 'undefined') return null;

  const id = previewId || getPreviewIdFromLocation() || localStorage.getItem(PREVIEW_LATEST_KEY);
  if (!id) return null;

  try {
    const raw = localStorage.getItem(`${PREVIEW_PREFIX}${id}`);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.post) return null;

    return {
      post: parsed.post,
      bountyDetails: parsed.bountyDetails ?? null,
    };
  } catch {
    return null;
  }
}

export function loadNewsPreviewPayloadWithFallbacks(previewId) {
  for (const id of resolveNewsPreviewIds(previewId)) {
    const payload = loadNewsPreviewPayload(id);
    if (payload?.post?.title?.trim()) {
      return payload;
    }
  }
  return null;
}

export function getNewsPreviewPath(previewId) {
  return previewId ? `/news/preview?id=${encodeURIComponent(previewId)}` : '/news/preview';
}

export function openNewsPreviewWindow(previewId, payload) {
  if (typeof window === 'undefined') return null;

  const origin = window.location.origin;
  const path = getNewsPreviewPath(previewId);
  const previewWindow = window.open(`${origin}${path}`, '_blank');

  if (!previewWindow) return null;

  const message = {
    type: PREVIEW_MESSAGE_TYPE,
    previewId,
    post: payload.post,
    bountyDetails: payload.bountyDetails ?? null,
  };

  let attempts = 0;
  const maxAttempts = 15;
  const interval = window.setInterval(() => {
    attempts += 1;
    try {
      previewWindow.postMessage(message, origin);
    } catch {
      // Preview tab may still be loading.
    }
    if (attempts >= maxAttempts) {
      window.clearInterval(interval);
    }
  }, 200);

  return previewWindow;
}

export function subscribeToNewsPreviewPayload(previewId, onPayload) {
  if (typeof window === 'undefined') return () => {};

  const handleMessage = (event) => {
    if (event.origin !== window.location.origin) return;
    if (event.data?.type !== PREVIEW_MESSAGE_TYPE) return;
    if (previewId && event.data.previewId !== previewId) return;
    if (!event.data?.post?.title) return;

    onPayload({
      post: event.data.post,
      bountyDetails: event.data.bountyDetails ?? null,
    });
  };

  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}

/** @deprecated Use storeNewsPreviewPayload */
export function setNewsPreviewPayload(payload) {
  return storeNewsPreviewPayload(payload);
}

/** @deprecated Use loadNewsPreviewPayload */
export function readNewsPreviewPayload(previewId) {
  return loadNewsPreviewPayload(previewId);
}

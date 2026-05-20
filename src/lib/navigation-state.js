const NAV_STATE_KEY = 'wb-navigation-state';

export function setNavigationState(state) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(NAV_STATE_KEY, JSON.stringify(state));
}

export function consumeNavigationState() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(NAV_STATE_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(NAV_STATE_KEY);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

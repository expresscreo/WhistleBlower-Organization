/** True when the admin list card has an active unseen notification. */
export function isAdminUnreadItem(item) {
  if (!item) return false;
  if (item.has_new_messages || item.hasNewMessages) return true;
  if (item.admin_has_viewed === false) return true;
  return false;
}

/** Newest first among unread items. */
export function compareAdminUnread(a, b) {
  const aDate = new Date(a?.created_at || a?.submitted_at || 0).getTime();
  const bDate = new Date(b?.created_at || b?.submitted_at || 0).getTime();
  return bDate - aDate;
}

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const MAX_TOKENS_PER_REQUEST = 100;

function chunk(values, size) {
  const chunks = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

function categoryForNewsPost(category) {
  if (category === 'most_wanted') return 'wanted';
  if (category === 'bounty') return 'bounties';
  return 'news';
}

function routeForNewsPost(post) {
  const id = post?.id;
  if (!id) return '/notifications';
  if (post.category === 'most_wanted') return `/most-wanted/${id}`;
  if (post.category === 'bounty') return `/bounty/${id}`;
  return `/news/${id}`;
}

function defaultPushTitle(post) {
  if (post.category === 'most_wanted') return 'New Most Wanted Alert';
  if (post.category === 'bounty') return 'New Bounty Published';
  return 'New Public Update';
}

function stripHtml(value = '') {
  return String(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildPushBody(post) {
  const plain = stripHtml(post.content);
  if (plain) return plain.slice(0, 140);
  return post.title || 'Open WhistleBlower to view the latest update.';
}

async function listEligibleTokens(service, category) {
  const { data, error } = await service
    .from('push_tokens')
    .select('expo_push_token, preferences')
    .eq('is_active', true);

  if (error) {
    throw error;
  }

  return (data || [])
    .filter((row) => row?.preferences?.[category] !== false)
    .map((row) => row.expo_push_token)
    .filter(Boolean);
}

async function logPushDelivery(service, payload) {
  const { error } = await service.from('push_delivery_logs').insert([payload]);
  if (error) {
    console.warn('Push delivery log failed:', error.message);
  }
}

export async function dispatchPublicContentPush(service, post) {
  const category = categoryForNewsPost(post.category);
  const tokens = await listEligibleTokens(service, category);

  if (!tokens.length) {
    return { sent: 0, message: 'No eligible push tokens found.' };
  }

  const route = routeForNewsPost(post);
  const title = defaultPushTitle(post);
  const body = buildPushBody(post);
  let sent = 0;

  for (const batch of chunk(tokens, MAX_TOKENS_PER_REQUEST)) {
    const messages = batch.map((to) => ({
      to,
      title,
      body,
      sound: 'default',
      data: {
        route,
        category,
        contentId: post.id,
      },
    }));

    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });
    const result = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(result?.errors?.[0]?.message || 'Expo push request failed.');
    }

    sent += messages.length;
    await logPushDelivery(service, {
      notification_type: 'public_content',
      category,
      target_id: post.id,
      route,
      recipient_count: messages.length,
      expo_response: result,
    });
  }

  return { sent };
}

export async function dispatchTrackingUpdatePush(service, { trackingType, trackingId }) {
  const normalizedType = trackingType === 'bounty' ? 'bounty' : 'report';
  const normalizedId = String(trackingId || '').trim().toUpperCase();
  if (!normalizedId) {
    return { sent: 0, message: 'Tracking ID is missing.' };
  }

  const { data, error } = await service
    .from('push_tracking_subscriptions')
    .select('expo_push_token')
    .eq('tracking_type', normalizedType)
    .eq('tracking_id', normalizedId)
    .eq('is_active', true);

  if (error) {
    throw error;
  }

  const subscriptionTokens = [...new Set((data || []).map((row) => row.expo_push_token).filter(Boolean))];
  if (!subscriptionTokens.length) {
    return { sent: 0, message: 'No eligible tracking push subscriptions found.' };
  }

  const { data: activeTokenRows, error: activeTokenError } = await service
    .from('push_tokens')
    .select('expo_push_token')
    .in('expo_push_token', subscriptionTokens)
    .eq('is_active', true);

  if (activeTokenError) {
    throw activeTokenError;
  }

  const activeTokenSet = new Set((activeTokenRows || []).map((row) => row.expo_push_token));
  const tokens = subscriptionTokens.filter((token) => activeTokenSet.has(token));
  if (!tokens.length) {
    return { sent: 0, message: 'No eligible tracking push subscriptions found.' };
  }

  let sent = 0;
  for (const batch of chunk(tokens, MAX_TOKENS_PER_REQUEST)) {
    const title = normalizedType === 'bounty' ? 'Secure Bounty Update' : 'Secure Report Update';
    const body =
      normalizedType === 'bounty'
        ? 'Your bounty has a new update. Open WhistleBlower to view it securely.'
        : 'Your report has a new update. Open WhistleBlower to view it securely.';
    const messages = batch.map((to) => ({
      to,
      title,
      body,
      sound: 'default',
      data: {
        route: '/notifications',
        category: 'tracking',
        trackingType: normalizedType,
        trackingId: normalizedId,
      },
    }));

    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });
    const result = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(result?.errors?.[0]?.message || 'Expo push request failed.');
    }

    const tickets = Array.isArray(result?.data) ? result.data : [];
    const acceptedCount = tickets.filter((ticket) => ticket?.status === 'ok').length;
    const invalidTokens = tickets
      .map((ticket, index) => (ticket?.details?.error === 'DeviceNotRegistered' ? batch[index] : null))
      .filter(Boolean);

    if (invalidTokens.length) {
      await service.from('push_tokens').update({ is_active: false, updated_at: new Date().toISOString() }).in('expo_push_token', invalidTokens);
      await service
        .from('push_tracking_subscriptions')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .in('expo_push_token', invalidTokens);
    }

    sent += acceptedCount;
    await logPushDelivery(service, {
      notification_type: 'tracking_update',
      category: normalizedType,
      target_id: normalizedId,
      route: '/notifications',
      recipient_count: acceptedCount,
      expo_response: result,
    });
  }

  return { sent };
}

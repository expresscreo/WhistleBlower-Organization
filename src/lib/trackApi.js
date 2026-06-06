async function postJson(path, payload) {
  const response = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Request failed. Please try again.');
  }

  return data;
}

export function authenticateTrackedReport(reportId, password) {
  return postJson('/api/track/report', { reportId, password });
}

export function fetchTrackedReportUpdates(reportId, password) {
  return postJson('/api/track/report/updates', { reportId, password });
}

export function sendTrackedReportMessage({
  reportId,
  password,
  message,
  replyToMessageId,
}) {
  return postJson('/api/track/report/message', {
    reportId,
    password,
    message,
    replyToMessageId,
  });
}

export function updateTrackedReport({
  reportId,
  password,
  message,
  evidencePaths,
}) {
  return postJson('/api/track/report/update', {
    reportId,
    password,
    message,
    evidencePaths,
  });
}

export function authenticateTrackedBounty(bountyId, password) {
  return postJson('/api/track/bounty', { bountyId, password });
}

export function updateTrackedBounty({
  bountyId,
  password,
  message,
  evidencePaths,
}) {
  return postJson('/api/track/bounty/update', {
    bountyId,
    password,
    message,
    evidencePaths,
  });
}

export function createTrackedBounty(payload) {
  return postJson('/api/place-bounty', payload);
}

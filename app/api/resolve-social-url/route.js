const FACEBOOK_HOST_PATTERN = /(^|\.)facebook\.com$|^fb\.watch$|^fb\.com$|^l\.facebook\.com$/i;

function parseInputUrl(raw) {
  const value = String(raw || '').trim();
  if (!value) return null;

  try {
    return new URL(value.includes('://') ? value : `https://${value}`);
  } catch {
    return null;
  }
}

function isAllowedFacebookHost(hostname) {
  const host = String(hostname || '').replace(/^www\./, '').toLowerCase();
  return FACEBOOK_HOST_PATTERN.test(host);
}

export async function GET(request) {
  const rawUrl = new URL(request.url).searchParams.get('url');
  const inputUrl = parseInputUrl(rawUrl);

  if (!inputUrl || !isAllowedFacebookHost(inputUrl.hostname)) {
    return Response.json({ error: 'A valid Facebook URL is required.' }, { status: 400 });
  }

  try {
    const response = await fetch(inputUrl.href, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent':
          'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(8000),
    });

    const resolvedUrl = response.url || inputUrl.href;

    return Response.json({
      url: resolvedUrl,
      resolved: resolvedUrl !== inputUrl.href,
    });
  } catch (error) {
    console.error('Facebook URL resolve failed:', error);
    return Response.json({ url: inputUrl.href, resolved: false });
  }
}

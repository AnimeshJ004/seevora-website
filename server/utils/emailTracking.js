const DEFAULT_ALLOWED_ORIGINS = ['https://seevora.in', 'https://www.seevora.in'];

function normalizeOrigin(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  try {
    return new URL(raw.includes('://') ? raw : `https://${raw}`).origin;
  } catch {
    return '';
  }
}

export function allowedEmailTrackingOrigins(env = process.env) {
  const origins = new Set(DEFAULT_ALLOWED_ORIGINS);
  const configured = String(env.EMAIL_TRACKING_ALLOWED_ORIGINS || '')
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);

  for (const origin of configured) origins.add(origin);
  return origins;
}

export function getSafeEmailTrackingTargetUrl(value, env = process.env) {
  if (typeof value !== 'string') return '';

  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    if (!allowedEmailTrackingOrigins(env).has(url.origin)) return '';
    return url.href;
  } catch {
    return '';
  }
}

export function buildEmailTrackingUrl({ logId, targetUrl, apiBaseUrl, env = process.env }) {
  const safeTargetUrl = getSafeEmailTrackingTargetUrl(targetUrl, env);
  if (!safeTargetUrl) return '';

  const baseUrl = String(apiBaseUrl || env.VITE_API_URL || 'http://localhost:4000').replace(/\/+$/, '');
  return `${baseUrl}/api/email-bot/track/click/${logId}?url=${encodeURIComponent(safeTargetUrl)}`;
}

export function wrapTrackableEmailLinks(body, { logId, apiBaseUrl, env = process.env } = {}) {
  if (!logId) return String(body || '');

  return String(body || '')
    .replace(/href="([^"]+)"/g, (match, url) => {
      const trackingUrl = buildEmailTrackingUrl({ logId, targetUrl: url, apiBaseUrl, env });
      return trackingUrl ? `href="${trackingUrl}"` : match;
    })
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
      const trackingUrl = buildEmailTrackingUrl({ logId, targetUrl: url, apiBaseUrl, env });
      return trackingUrl ? `[${text}](${trackingUrl})` : match;
    });
}

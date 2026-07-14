const API_CACHE_CONTROL = 'private, no-store';
const IMMUTABLE_ASSET_CACHE_CONTROL = 'public, max-age=31536000, immutable';
const PUBLIC_FILE_CACHE_CONTROL = 'public, max-age=86400';
const HTML_CACHE_CONTROL = 'no-cache, no-store, must-revalidate';

export function preventApiResponseCaching(_req, res, next) {
  res.set('Cache-Control', API_CACHE_CONTROL);
  return next();
}

export function setStaticCacheHeaders(res, filePath) {
  const normalized = String(filePath || '').replaceAll('\\', '/').toLowerCase();
  if (normalized.endsWith('/index.html')) {
    res.setHeader('Cache-Control', HTML_CACHE_CONTROL);
    return;
  }
  if (normalized.includes('/assets/')) {
    res.setHeader('Cache-Control', IMMUTABLE_ASSET_CACHE_CONTROL);
    return;
  }
  res.setHeader('Cache-Control', PUBLIC_FILE_CACHE_CONTROL);
}

export function preventSpaHtmlCaching(res) {
  res.set('Cache-Control', HTML_CACHE_CONTROL);
}

export const CACHE_CONTROL_VALUES = Object.freeze({
  api: API_CACHE_CONTROL,
  immutableAsset: IMMUTABLE_ASSET_CACHE_CONTROL,
  publicFile: PUBLIC_FILE_CACHE_CONTROL,
  html: HTML_CACHE_CONTROL,
});

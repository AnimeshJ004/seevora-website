function configuredApiOrigin() {
  return String(import.meta.env?.VITE_API_URL || '').trim().replace(/\/+$/, '');
}

function currentLocation() {
  return typeof window === 'undefined' ? null : window.location;
}

function isLocalDevFrontend(location) {
  if (!location) return false;
  return ['localhost', '127.0.0.1', '::1'].includes(location.hostname)
    && location.port !== '4000';
}

function joinOriginAndEndpoint(origin, endpoint) {
  const path = String(endpoint || '');
  const cleanOrigin = String(origin || '').replace(/\/+$/, '');

  if (cleanOrigin.endsWith('/api') && path.startsWith('/api/')) {
    return `${cleanOrigin}${path.slice(4)}`;
  }

  return `${cleanOrigin}${path.startsWith('/') ? path : `/${path}`}`;
}

export function resolveApiUrl(endpoint, { apiOrigin = '', location = null } = {}) {
  const value = String(endpoint || '');
  if (/^https?:\/\//i.test(value)) return value;

  // Keep API requests on the Vite origin during local development. Vite proxies
  // them to port 4000, so cookies stay first-party and production API settings
  // from .env cannot accidentally send localhost credentials across origins.
  if (isLocalDevFrontend(location) && value.startsWith('/api/')) {
    return value;
  }

  const configured = String(apiOrigin || '').trim().replace(/\/+$/, '');
  if (configured) return joinOriginAndEndpoint(configured, value);

  return value;
}

export function apiUrl(endpoint) {
  return resolveApiUrl(endpoint, {
    apiOrigin: configuredApiOrigin(),
    location: currentLocation(),
  });
}

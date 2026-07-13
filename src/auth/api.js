const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
let csrfToken = '';
let restoreRequest = null;

export function setCsrfToken(value) {
  csrfToken = typeof value === 'string' ? value : '';
}

export function clearAuthSession() {
  csrfToken = '';
  localStorage.removeItem('seevoraAuthToken');
  localStorage.removeItem('seevora_token');
  localStorage.removeItem('seevoraUser');
  sessionStorage.removeItem('seevora_session');
}

function redirectToLogin() {
  window.dispatchEvent(new Event('authsessionexpired'));
  if (window.location.pathname === '/login') return;
  window.history.replaceState(null, '', '/login');
  window.dispatchEvent(new Event('locationchange'));
}

export async function apiFetch(endpoint, options = {}) {
  const {
    redirectOnUnauthorized = true,
    headers: suppliedHeaders,
    ...requestOptions
  } = options;
  const method = String(requestOptions.method || 'GET').toUpperCase();
  const isUnsafe = UNSAFE_METHODS.has(method);

  const sendRequest = () => {
    const headers = new Headers(suppliedHeaders || {});
    if (isUnsafe && csrfToken) headers.set('X-CSRF-Token', csrfToken);

    return fetch(endpoint, {
      ...requestOptions,
      method,
      headers,
      credentials: 'include',
    });
  };

  if (isUnsafe && !csrfToken) await restoreAuthSession();

  let response = await sendRequest();

  if (isUnsafe && response.status === 403) {
    const errorBody = await response.clone().json().catch(() => ({}));
    if (errorBody.message === 'CSRF validation failed.') {
      const restoredUser = await restoreAuthSession();
      if (restoredUser) response = await sendRequest();
    }
  }

  if (response.status === 401) {
    clearAuthSession();
    if (redirectOnUnauthorized) redirectToLogin();
  }

  return response;
}

export async function loginSession(credentials) {
  clearAuthSession();
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
    credentials: 'include',
  });
  const data = await response.json().catch(() => ({}));

  if (response.ok) setCsrfToken(data.csrfToken);
  return { response, data };
}

async function requestRestoredSession() {
  clearAuthSession();
  const response = await fetch('/api/auth/session', {
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) return null;
  const data = await response.json().catch(() => ({}));
  if (!data.authenticated || !data.user || !data.csrfToken) return null;

  setCsrfToken(data.csrfToken);
  return data.user;
}

export function restoreAuthSession() {
  if (!restoreRequest) {
    restoreRequest = requestRestoredSession().finally(() => {
      restoreRequest = null;
    });
  }
  return restoreRequest;
}

export async function logoutSession({ allDevices = false } = {}) {
  try {
    return await apiFetch(allDevices ? '/api/auth/logout-all' : '/api/auth/logout', {
      method: 'POST',
      redirectOnUnauthorized: false,
    });
  } finally {
    clearAuthSession();
  }
}

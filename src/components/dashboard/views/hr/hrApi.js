const API_FALLBACK_ORIGIN = 'http://127.0.0.1:4000';

export async function hrApiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('seevoraAuthToken');
  const headers = {
    ...(options.headers || {}),
  };

  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, { ...options, headers });
  if (response.status === 401) {
    localStorage.removeItem('seevoraAuthToken');
    localStorage.removeItem('seevoraUser');
    sessionStorage.removeItem('seevora_session');
  }
  if (response.status !== 502) return response;

  const fallbackRes = await fetch(`${API_FALLBACK_ORIGIN}${endpoint}`, { ...options, headers });
  if (fallbackRes.status === 401) {
    localStorage.removeItem('seevoraAuthToken');
    localStorage.removeItem('seevoraUser');
    sessionStorage.removeItem('seevora_session');
  }
  return fallbackRes;
}


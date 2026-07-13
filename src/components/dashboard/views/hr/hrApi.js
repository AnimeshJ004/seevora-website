import { apiFetch } from '../../../../auth/api';

export async function hrApiFetch(endpoint, options = {}) {
  const headers = {
    ...(options.headers || {}),
  };

  return apiFetch(endpoint, { ...options, headers });
}

export function validateLogin(body) {
  const errors = {};
  const identifier = String(body.identifier || body.email || body.username || '').trim();
  const password = String(body.password || '');

  if (!identifier) errors.identifier = 'Username or email is required.';

  if (!password) errors.password = 'Password is required.';

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    data: { identifier, password },
  };
}

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

export function validateForgotPassword(body) {
  const errors = {};
  const identifier = String(body.identifier || body.email || body.username || '').trim();

  if (!identifier) errors.identifier = 'Username or email is required.';

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    data: { identifier },
  };
}

export function validateResetPassword(body) {
  const errors = {};
  const resetCode = String(body.resetCode || body.token || '').trim();
  const newPassword = String(body.newPassword || body.password || '');
  const confirmPassword = String(body.confirmPassword || '').trim();

  if (!resetCode) errors.resetCode = 'Reset code is required.';
  if (!newPassword) errors.newPassword = 'New password is required.';
  else if (newPassword.length < 8) errors.newPassword = 'Password must be at least 8 characters.';
  if (confirmPassword && confirmPassword !== newPassword) errors.confirmPassword = 'Passwords do not match.';

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    data: { resetCode, newPassword, confirmPassword },
  };
}

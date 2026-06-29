const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[0-9+\-\s()]{7,20}$/;

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export function validateSignup(body) {
  const errors = {};
  const username = String(body.username || '').trim();
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');
  const phone = String(body.phone || '').trim();

  if (!username) errors.username = 'Username is required.';
  else if (username.length < 2 || username.length > 80) errors.username = 'Username must be 2-80 characters.';

  if (!email) errors.email = 'Email is required.';
  else if (!emailPattern.test(email)) errors.email = 'Enter a valid email address.';

  if (!password) {
    errors.password = 'Password is required.';
  } else if (!isStrongPassword(password)) {
    errors.password = 'Password must be at least 8 characters and include uppercase, number, and special character.';
  }

  if (phone && !phonePattern.test(phone)) {
    errors.phone = 'Enter a valid phone number.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    data: { username, email, password, phone: phone || null },
  };
}

export function validateLogin(body) {
  const errors = {};
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');

  if (!email) errors.email = 'Email is required.';
  else if (!emailPattern.test(email)) errors.email = 'Enter a valid email address.';

  if (!password) errors.password = 'Password is required.';
  else if (password.length < 8) errors.password = 'Password must be at least 8 characters.';

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    data: { email, password },
  };
}

function isStrongPassword(password) {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[!@#$%^&*(),.?":{}|<>]/.test(password)
  );
}

const KEY = 'polling_user_v1';

export function getSessionUser() {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSessionUser(user) {
  sessionStorage.setItem(KEY, JSON.stringify(user));
}

export function clearSessionUser() {
  sessionStorage.removeItem(KEY);
}

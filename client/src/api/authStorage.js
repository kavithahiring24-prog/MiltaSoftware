export const TOKEN_KEY = "prm_token";
export const USER_KEY = "prm_user";
const AUTH_EVENT = "prm-auth-changed";

export function getApiBaseUrl() {
  return process.env.REACT_APP_API_URL || "http://localhost:5000/api";
}

export function resolveFileUrl(fileUrl) {
  if (!fileUrl) return "#";
  if (/^https?:\/\//i.test(fileUrl)) return fileUrl;

  const apiBase = getApiBaseUrl();
  const origin = apiBase.endsWith("/api") ? apiBase.slice(0, -4) : apiBase;
  return `${origin}${fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`}`;
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  const rawUser = localStorage.getItem(USER_KEY);
  if (!rawUser) return null;
  try {
    return JSON.parse(rawUser);
  } catch (_error) {
    return null;
  }
}

export function saveAuth(payload) {
  localStorage.setItem(TOKEN_KEY, payload.token);
  localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function subscribeToAuthChanges(listener) {
  window.addEventListener(AUTH_EVENT, listener);
  return () => window.removeEventListener(AUTH_EVENT, listener);
}

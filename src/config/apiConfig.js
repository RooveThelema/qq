/**
 * Конфигурация подключения к PostgreSQL API-бэкенду.
 * На GitHub Pages или file:// без указанного сервера игра работает в автономном режиме с localStorage.
 */

const API_URL_STORAGE_KEY = 'blinov_api_url';
const NICKNAME_STORAGE_KEY = 'blinov_nickname';

export function isFileProtocol() {
  return typeof window !== 'undefined' && window.location?.protocol === 'file:';
}

export function normalizeApiUrl(rawUrl) {
  const clean = String(rawUrl || '').trim().replace(/\/+$/, '');
  if (!clean) return '';
  if (/^https?:\/\//i.test(clean)) return clean;
  return `http://${clean}`;
}

export function getApiBaseUrl() {
  if (typeof window === 'undefined') return '';

  const params = new URLSearchParams(window.location.search || '');
  const queryApi = params.get('api');
  if (queryApi !== null) {
    const normalized = normalizeApiUrl(queryApi);
    if (normalized) {
      localStorage.setItem(API_URL_STORAGE_KEY, normalized);
      return normalized;
    }
    localStorage.removeItem(API_URL_STORAGE_KEY);
    return '';
  }

  const saved = normalizeApiUrl(localStorage.getItem(API_URL_STORAGE_KEY) || '');
  if (saved) return saved;

  const { protocol, hostname, origin, pathname } = window.location;
  const isStaticPagesHost = hostname.endsWith('.github.io') || hostname.endsWith('.pages.dev');
  const isSubpathStatic = pathname !== '/' && pathname !== '/index.html';
  if ((protocol === 'http:' || protocol === 'https:') && !isStaticPagesHost && !isSubpathStatic) {
    return origin;
  }

  return '';
}

export function setApiBaseUrl(rawUrl) {
  const normalized = normalizeApiUrl(rawUrl);
  if (normalized) {
    localStorage.setItem(API_URL_STORAGE_KEY, normalized);
  } else {
    localStorage.removeItem(API_URL_STORAGE_KEY);
  }
  return normalized;
}

export function getSavedNickname() {
  if (typeof localStorage === 'undefined') return 'BunkerFighter';
  const saved = (localStorage.getItem(NICKNAME_STORAGE_KEY) || '').trim();
  return saved || 'BunkerFighter';
}

export function saveNickname(name) {
  const clean = String(name || 'BunkerFighter').trim().replace(/[<>]/g, '').slice(0, 32) || 'BunkerFighter';
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(NICKNAME_STORAGE_KEY, clean);
  }
  return clean;
}

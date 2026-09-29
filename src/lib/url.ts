/**
 * Base path helper ensuring all internal paths and assets are correctly prefixed
 * with the site's base URL (e.g., for GitHub Pages deployments at /europulse/)
 * and follow consistent trailing slashes for pages.
 */

const rawBase = import.meta.env.BASE_URL || '/';
// Ensure clean base path: starts with / and ends with /
export const BASE_URL = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

const FILE_EXT_REGEX = /\.[a-zA-Z0-9]{2,5}($|\?|#)/;

export function url(path: string = ''): string {
  // Return untouched if empty or external
  if (!path) return BASE_URL;
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('mailto:') ||
    path.startsWith('tel:') ||
    path.startsWith('#') ||
    path.startsWith('javascript:')
  ) {
    return path;
  }

  // Separate hash and query parameters
  let cleanPath = path.trim();
  let hash = '';
  let search = '';

  const hashIdx = cleanPath.indexOf('#');
  if (hashIdx !== -1) {
    hash = cleanPath.slice(hashIdx);
    cleanPath = cleanPath.slice(0, hashIdx);
  }

  const queryIdx = cleanPath.indexOf('?');
  if (queryIdx !== -1) {
    search = cleanPath.slice(queryIdx);
    cleanPath = cleanPath.slice(0, queryIdx);
  }

  // Normalize path
  if (!cleanPath.startsWith('/')) {
    cleanPath = `/${cleanPath}`;
  }

  const isFile = FILE_EXT_REGEX.test(cleanPath);

  // Apply trailing slash rule for routes (not files)
  if (!isFile && cleanPath !== '/' && !cleanPath.endsWith('/')) {
    cleanPath = `${cleanPath}/`;
  }

  // Prepend BASE_URL
  const basePrefix = BASE_URL === '/' ? '' : BASE_URL.replace(/\/$/, '');
  const finalPath = `${basePrefix}${cleanPath}`;

  return `${finalPath}${search}${hash}`;
}

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(d);
  } catch {
    return dateString;
  }
}

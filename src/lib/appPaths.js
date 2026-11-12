// The app can be served from the domain root (Cloudflare Pages) or from a
// sub-path (GitHub Pages sets base to "/clip-lens-app/"). Router links handle
// the base automatically; these helpers are for full-page redirects and
// Supabase redirect URLs, which bypass the router.
const BASE_URL = import.meta.env.BASE_URL || '/';

function normalizedBase() {
  return BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`;
}

// Prefix an app-relative path with the deployment base. Safe to call twice.
export function appUrl(path = '/') {
  const base = normalizedBase();
  const value = typeof path === 'string' && path ? path : '/';
  if (base === '/') return value.startsWith('/') ? value : `/${value}`;
  const baseWithoutSlash = base.slice(0, -1);
  if (value === baseWithoutSlash || value.startsWith(base)) return value;
  return `${base}${value.startsWith('/') ? value.slice(1) : value}`;
}

// Remove the deployment base from a window.location pathname so it can be
// passed to router links and React Router's basename handling.
export function stripBase(pathname = '/') {
  const base = normalizedBase();
  if (base === '/') return pathname || '/';
  const baseWithoutSlash = base.slice(0, -1);
  if (pathname === baseWithoutSlash) return '/';
  if (pathname.startsWith(base)) return `/${pathname.slice(base.length)}`;
  return pathname;
}

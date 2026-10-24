export function parseYouTubeVideoId(value: unknown) {
  if (typeof value !== 'string' || value.length > 2048) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : 'https://' + value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
    let id = '';
    if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(url.hostname)) {
      id = url.pathname === '/watch'
        ? url.searchParams.get('v') || ''
        : url.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{11})\/?$/)?.[1] || '';
    } else if (url.hostname === 'youtu.be') {
      id = url.pathname.match(/^\/([\w-]{11})\/?$/)?.[1] || '';
    }
    return /^[\w-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

export function canonicalYouTubeUrl(value: unknown) {
  const id = /^[\w-]{11}$/.test(typeof value === 'string' ? value : '')
    ? value as string
    : parseYouTubeVideoId(value);
  return id ? `https://www.youtube.com/watch?v=${id}` : '';
}

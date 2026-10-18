import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Fetches the public data + statistics of a YouTube video (title, channel,
// thumbnail, views, likes, duration, publish date) so the analysis can be
// grounded in real numbers. Uses the public innertube player endpoint
// (works without an API key), with oEmbed and a watch-page scrape as
// fallbacks. Note: private YouTube Studio metrics (impressions, CTR,
// retention) are channel-owner-only and cannot be read from a public link.

const YT_RE = /^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{6,})/i;
const PLAYER_KEY = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';

function parseCount(raw) {
  if (raw == null) return null;
  const m = String(raw).replace(/,/g, '').replace(/\u00a0/g, '').match(/([\d.]+)\s*([KMB])?/i);
  if (!m) return null;
  const n = parseFloat(m[1]);
  if (isNaN(n)) return null;
  const mult = { K: 1e3, M: 1e6, B: 1e9 }[m[2] ? m[2].toUpperCase() : ''] || 1;
  return Math.round(n * mult);
}

async function fetchPlayer(videoId) {
  const res = await fetch(`https://www.youtube.com/youtubei/v1/player?key=${PLAYER_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      context: { client: { clientName: 'WEB', clientVersion: '2.20240610.00.00', hl: 'en' } },
      videoId,
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  if (!data) return null;
  const details = data.videoDetails || {};
  const micro = data.microformat && data.microformat.playerMicroformatRenderer
    ? data.microformat.playerMicroformatRenderer
    : {};
  const thumbs = (details.thumbnail && Array.isArray(details.thumbnail.thumbnails) && details.thumbnail.thumbnails.length)
    ? details.thumbnail.thumbnails[details.thumbnail.thumbnails.length - 1].url
    : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  return {
    title: details.title || null,
    channel: details.author || null,
    thumbnail_url: thumbs,
    views: parseCount(details.viewCount),
    duration_seconds: details.lengthSeconds ? parseInt(details.lengthSeconds, 10) : null,
    published_at: micro.publishDate || micro.uploadDate || null,
  };
}

async function fetchOEmbed(watchUrl) {
  const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`, {
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) return null;
  return res.json().catch(() => null);
}

async function fetchWatchPage(videoId) {
  const res = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=en&bpctr=9999999999&has_verified=1`, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cookie': 'CONSENT=YES+cb; SOCS=CAI',
    },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) return null;
  return res.text().catch(() => null);
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const url = String(body.url || '');
    const match = url.match(YT_RE);
    if (!match) return Response.json({ error: 'invalid_url' }, { status: 400 });

    const videoId = match[1];
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;

    const [playerRes, oembedRes, pageRes] = await Promise.allSettled([
      fetchPlayer(videoId),
      fetchOEmbed(watchUrl),
      fetchWatchPage(videoId),
    ]);

    const player = playerRes.status === 'fulfilled' ? playerRes.value : null;
    const oembed = oembedRes.status === 'fulfilled' ? oembedRes.value : null;
    const html = pageRes.status === 'fulfilled' ? pageRes.value : null;

    const likes = html
      ? parseCount(
          (html.match(/"likeCount":"(\d+)"/) || [])[1] ||
            (html.match(/along with ([\d.,\s]*[\dKMB]) other people/i) || [])[1]
        )
      : null;
    const comments = html
      ? parseCount(
          (html.match(/"commentCount":\{"simpleText":"([^"]+)"/) || [])[1] ||
            (html.match(/"commentCount":\{"content":"([^"]+)"/) || [])[1]
        )
      : null;

    const title = (player && player.title) || (oembed && oembed.title) || null;
    const views = player ? player.views : null;

    if (!title && views == null && !likes) {
      return Response.json({ error: 'video_not_found' }, { status: 404 });
    }

    return Response.json({
      video_id: videoId,
      title: title || videoId,
      channel: (player && player.channel) || (oembed && oembed.author_name) || '',
      thumbnail_url:
        (player && player.thumbnail_url) || (oembed && oembed.thumbnail_url) ||
        `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      views: views != null ? views : null,
      likes: likes != null ? likes : null,
      comments: comments != null ? comments : null,
      duration_seconds: (player && player.duration_seconds) || null,
      published_at: (player && player.published_at) || null,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
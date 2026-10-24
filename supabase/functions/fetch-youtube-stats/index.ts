const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function parseVideoId(value: unknown) {
  if (typeof value !== 'string' || value.length > 2048) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
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

function durationSeconds(duration: string | undefined) {
  if (!duration) return null;
  const match = duration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return null;
  return Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0);
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return jsonResponse({ error: 'method_not_allowed' }, 405);

  let url: unknown;
  try {
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > 4096) return jsonResponse({ error: 'request_too_large' }, 413);
    const body = await request.text();
    if (new TextEncoder().encode(body).byteLength > 4096) return jsonResponse({ error: 'request_too_large' }, 413);
    url = JSON.parse(body)?.url;
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400);
  }

  const videoId = parseVideoId(url);
  if (!videoId) return jsonResponse({ error: 'invalid_url' }, 400);

  const apiKey = Deno.env.get('YOUTUBE_DATA_API_KEY');
  if (!apiKey) return jsonResponse({ error: 'youtube_api_not_configured' }, 503);

  const endpoint = new URL('https://youtube.googleapis.com/youtube/v3/videos');
  endpoint.searchParams.set('part', 'snippet,statistics,contentDetails');
  endpoint.searchParams.set('id', videoId);
  endpoint.searchParams.set('key', apiKey);

  let response: Response;
  try {
    response = await fetch(endpoint, { signal: AbortSignal.timeout(10000) });
  } catch {
    return jsonResponse({ error: 'youtube_api_unavailable' }, 502);
  }
  if (!response.ok) {
    return jsonResponse({ error: 'youtube_api_error' }, response.status === 404 ? 404 : 502);
  }

  let payload: { items?: Array<Record<string, any>> };
  try {
    payload = await response.json();
  } catch {
    return jsonResponse({ error: 'invalid_youtube_response' }, 502);
  }
  const video = payload.items?.[0];
  if (!video) return jsonResponse({ error: 'video_not_found' }, 404);

  const statistics = video.statistics || {};
  const thumbnails = video.snippet?.thumbnails || {};
  const thumbnail = thumbnails.maxres || thumbnails.high || thumbnails.medium || thumbnails.default;
  return jsonResponse({
    video_id: videoId,
    title: typeof video.snippet?.title === 'string' ? video.snippet.title.slice(0, 500) : videoId,
    description: typeof video.snippet?.description === 'string' ? video.snippet.description.slice(0, 4000) : '',
    channel: typeof video.snippet?.channelTitle === 'string' ? video.snippet.channelTitle.slice(0, 200) : '',
    thumbnail_url: typeof thumbnail?.url === 'string' ? thumbnail.url : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    views: statistics.viewCount == null ? null : Number(statistics.viewCount),
    likes: statistics.likeCount == null ? null : Number(statistics.likeCount),
    comments: statistics.commentCount == null ? null : Number(statistics.commentCount),
    duration_seconds: durationSeconds(video.contentDetails?.duration),
    published_at: typeof video.snippet?.publishedAt === 'string' ? video.snippet.publishedAt : null,
  });
});

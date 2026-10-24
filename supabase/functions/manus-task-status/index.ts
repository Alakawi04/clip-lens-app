import { listManusMessages, manusRequest, ManusApiError, verifyManusTaskReference } from '../_shared/manus.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const MAX_IMAGE_BYTES = 12_000_000;

type AnalysisRow = {
  id: string;
  user_id: string;
  youtube_stats: Record<string, unknown> | null;
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function downloadManusAttachment(urlValue: unknown) {
  if (typeof urlValue !== 'string') throw new Error('manus_image_attachment_missing');
  let url: URL;
  try {
    url = new URL(urlValue);
  } catch {
    throw new Error('manus_image_attachment_invalid');
  }
  const isAllowedHost = (host: string) => host === 'manuscdn.com' || host.endsWith('.manuscdn.com');
  for (let redirects = 0; redirects <= 3; redirects += 1) {
    if (url.protocol !== 'https:' || url.username || url.password || !isAllowedHost(url.hostname.toLowerCase())) {
      throw new Error('manus_image_attachment_invalid');
    }
    const response = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(20000),
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location || redirects === 3) throw new Error('manus_image_download_failed');
      url = new URL(location, url);
      continue;
    }
    const contentType = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
    if (!response.ok || !['image/jpeg', 'image/png', 'image/webp'].includes(contentType || '')) {
      throw new Error('manus_image_download_failed');
    }
    const image = new Uint8Array(await response.arrayBuffer());
    if (!image.length || image.length > MAX_IMAGE_BYTES) throw new Error('manus_image_invalid');
    return { image, contentType: contentType! };
  }
  throw new Error('manus_image_download_failed');
}

async function saveGeneratedImage(
  supabaseUrl: string,
  serviceKey: string,
  authorization: string,
  publishableKey: string,
  record: AnalysisRow,
  taskId: string,
  image: Uint8Array,
  contentType: string,
) {
  const extension = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg';
  const safeTaskId = taskId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 100);
  const objectPath = `${record.user_id}/${record.id}/manus-${safeTaskId}.${extension}`;
  const storageResponse = await fetch(`${supabaseUrl}/storage/v1/object/public-assets/${objectPath}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'x-upsert': 'true',
    },
    body: image,
    signal: AbortSignal.timeout(25000),
  });
  if (!storageResponse.ok) throw new Error('thumbnail_storage_upload_failed');

  const imageUrl = `${supabaseUrl}/storage/v1/object/public/public-assets/${objectPath}`;
  const oldStats = record.youtube_stats || {};
  const oldSections = oldStats.analysis_sections && typeof oldStats.analysis_sections === 'object'
    ? oldStats.analysis_sections as Record<string, unknown>
    : {};
  const updatedStats = {
    ...oldStats,
    generated_thumbnail_url: imageUrl,
    manus_thumbnail_result_task_id: taskId,
    thumbnail_generation_error: null,
    analysis_sections: {
      ...oldSections,
      thumbnailImage: { status: 'ready', reason: '' },
    },
  };
  const patchUrl = new URL(`${supabaseUrl}/rest/v1/analyses`);
  patchUrl.searchParams.set('id', `eq.${record.id}`);
  patchUrl.searchParams.set('user_id', `eq.${record.user_id}`);
  const saveResponse = await fetch(patchUrl, {
    method: 'PATCH',
    headers: {
      Authorization: authorization,
      apikey: publishableKey,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ youtube_stats: updatedStats }),
    signal: AbortSignal.timeout(12000),
  });
  if (!saveResponse.ok) throw new Error('thumbnail_result_save_failed');
  return imageUrl;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return jsonResponse({ error: 'method_not_allowed' }, 405);

  let input: Record<string, unknown>;
  try {
    const body = await request.arrayBuffer();
    if (body.byteLength > 10000) return jsonResponse({ error: 'request_too_large' }, 413);
    input = JSON.parse(new TextDecoder().decode(body));
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400);
  }
  const analysisId = typeof input.analysisId === 'string' ? input.analysisId : '';
  const kind = input.kind === 'thumbnail' ? 'thumbnail' : input.kind === 'analysis' ? 'analysis' : '';
  if (!/^[0-9a-f-]{36}$/i.test(analysisId)) return jsonResponse({ error: 'invalid_analysis_id' }, 400);
  if (!kind) return jsonResponse({ error: 'invalid_task_kind' }, 400);

  const authorization = request.headers.get('Authorization');
  const publishableKey = request.headers.get('apikey');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const manusApiKey = Deno.env.get('MANUS_API_KEY');
  if (!manusApiKey) return jsonResponse({ error: 'manus_api_not_configured' }, 503);
  if (!authorization || !publishableKey || !supabaseUrl || (kind === 'thumbnail' && !serviceKey)) {
    return jsonResponse({ error: 'manus_status_not_configured' }, 503);
  }

  let user: { id?: string };
  let record: AnalysisRow | undefined;
  try {
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: authorization, apikey: publishableKey },
      signal: AbortSignal.timeout(10000),
    });
    if (!userResponse.ok) return jsonResponse({ error: 'authentication_required' }, 401);
    user = await userResponse.json();
    if (typeof user.id !== 'string') return jsonResponse({ error: 'authentication_required' }, 401);

    const url = new URL(`${supabaseUrl}/rest/v1/analyses`);
    url.searchParams.set('id', `eq.${analysisId}`);
    url.searchParams.set('select', 'id,user_id,youtube_stats');
    url.searchParams.set('limit', '1');
    const recordResponse = await fetch(url, {
      headers: { Authorization: authorization, apikey: publishableKey },
      signal: AbortSignal.timeout(10000),
    });
    if (!recordResponse.ok) return jsonResponse({ error: 'analysis_lookup_failed' }, 502);
    const rows = await recordResponse.json();
    record = Array.isArray(rows) ? rows[0] as AnalysisRow | undefined : undefined;
  } catch {
    return jsonResponse({ error: 'analysis_lookup_failed' }, 502);
  }
  if (!record || record.user_id !== user.id) return jsonResponse({ error: 'analysis_not_found' }, 404);

  const stats = record.youtube_stats || {};
  const taskId = kind === 'analysis' ? stats.manus_analysis_task_id : stats.manus_thumbnail_task_id;
  if (typeof taskId !== 'string' || !taskId || taskId.length > 200) {
    return jsonResponse({ error: 'manus_task_not_found' }, 404);
  }
  const taskSignature = kind === 'analysis'
    ? stats.manus_analysis_task_signature
    : stats.manus_thumbnail_task_signature;
  if (!await verifyManusTaskReference(manusApiKey, analysisId, record.user_id, kind, taskId, taskSignature)) {
    return jsonResponse({ error: 'manus_task_reference_invalid' }, 403);
  }
  if (kind === 'thumbnail' && stats.manus_thumbnail_result_task_id === taskId && typeof stats.generated_thumbnail_url === 'string') {
    return jsonResponse({ state: 'complete', url: stats.generated_thumbnail_url });
  }

  try {
    const taskQuery = new URLSearchParams({ task_id: taskId });
    const detail = await manusRequest(manusApiKey, 'task.detail?' + taskQuery.toString(), { method: 'GET' });
    const taskStatus = detail?.task?.status;
    const messages = await listManusMessages(manusApiKey, taskId);
    const events = Array.isArray(messages?.messages) ? messages.messages : [];

    if (kind === 'analysis') {
      const structured = events.find((event: Record<string, any>) => event.type === 'structured_output_result');
      if (structured?.structured_output_result?.success === true && structured.structured_output_result.value && typeof structured.structured_output_result.value === 'object') {
        return jsonResponse({ state: 'complete', result: structured.structured_output_result.value });
      }
      if (structured?.structured_output_result?.success === false) {
        return jsonResponse({ state: 'failed', error: 'manus_structured_result_failed' });
      }
    } else {
      const attachment = events
        .flatMap((event: Record<string, any>) => Array.isArray(event.assistant_message?.attachments) ? event.assistant_message.attachments : [])
        .find((item: Record<string, unknown>) => item.type === 'image' && typeof item.url === 'string');
      if (attachment) {
        const downloaded = await downloadManusAttachment(attachment.url);
        const imageUrl = await saveGeneratedImage(
          supabaseUrl,
          serviceKey!,
          authorization,
          publishableKey,
          record,
          taskId,
          downloaded.image,
          downloaded.contentType,
        );
        return jsonResponse({ state: 'complete', url: imageUrl });
      }
    }

    if (taskStatus === 'error') return jsonResponse({ state: 'failed', error: 'manus_task_failed' });
    if (taskStatus === 'waiting') return jsonResponse({ state: 'failed', error: 'manus_task_needs_input' });
    if (taskStatus === 'stopped' && !detail?.task?.has_running_background_jobs) {
      const updatedAt = Number(detail?.task?.updated_at || 0);
      const stoppedForMs = updatedAt ? Date.now() - (updatedAt < 1_000_000_000_000 ? updatedAt * 1000 : updatedAt) : 0;
      if (stoppedForMs > 120000) return jsonResponse({ state: 'failed', error: 'manus_task_result_missing' });
    }
    return jsonResponse({ state: 'running', taskStatus: typeof taskStatus === 'string' ? taskStatus : 'running' });
  } catch (error) {
    if (error instanceof ManusApiError) {
      console.error('Manus task status check failed', { code: error.code, status: error.status });
      return jsonResponse({ error: error.code }, error.status >= 400 && error.status < 600 ? error.status : 502);
    }
    const code = error instanceof Error && /^manus_|^thumbnail_/.test(error.message)
      ? error.message
      : 'manus_task_status_failed';
    console.error('Manus task result could not be processed', { code });
    return jsonResponse({ error: code }, 502);
  }
});

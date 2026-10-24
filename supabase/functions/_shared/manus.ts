const API_BASE_URL = 'https://api.manus.ai/v2';

export type ManusFile = {
  id: string;
  filename: string;
};

export type ManusTaskOutput = {
  task_id?: string;
  task_title?: string;
  task_url?: string;
};

export class ManusApiError extends Error {
  code: string;
  status: number;

  constructor(code: string, status: number) {
    super(code);
    this.name = 'ManusApiError';
    this.code = code;
    this.status = status;
  }
}

export async function signManusTaskReference(
  secret: string,
  analysisId: string,
  userId: string,
  kind: 'analysis' | 'thumbnail',
  taskId: string,
) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const payload = [analysisId, userId, kind, taskId].join(':');
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function verifyManusTaskReference(
  secret: string,
  analysisId: string,
  userId: string,
  kind: 'analysis' | 'thumbnail',
  taskId: string,
  signature: unknown,
) {
  if (typeof signature !== 'string' || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = await signManusTaskReference(secret, analysisId, userId, kind, taskId);
  let difference = expected.length ^ signature.length;
  for (let index = 0; index < expected.length; index += 1) {
    difference |= expected.charCodeAt(index) ^ (signature.charCodeAt(index) || 0);
  }
  return difference === 0;
}

async function readResponse(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function manusRequest(
  apiKey: string,
  path: string,
  init: RequestInit = {},
  timeoutMs = 20000,
) {
  const headers = new Headers(init.headers);
  headers.set('x-manus-api-key', apiKey);
  headers.set('Accept', 'application/json');

  let response: Response;
  try {
    response = await fetch(API_BASE_URL + '/' + path.replace(/^\/+/, ''), {
      ...init,
      headers,
      signal: init.signal || AbortSignal.timeout(timeoutMs),
    });
  } catch {
    throw new ManusApiError('manus_unavailable', 502);
  }

  const payload = await readResponse(response);
  if (!response.ok || payload?.ok === false) {
    const upstreamCode = typeof payload?.error?.code === 'string'
      ? payload.error.code.toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 60)
      : 'request_failed';
    throw new ManusApiError('manus_' + upstreamCode, response.status || 502);
  }
  return payload;
}

export async function uploadManusFile(
  apiKey: string,
  filename: string,
  contentType: string,
  bytes: Uint8Array,
): Promise<ManusFile> {
  const created = await manusRequest(apiKey, 'file.upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename }),
  });
  const fileId = created?.file?.id;
  const uploadUrl = created?.upload_url;
  if (typeof fileId !== 'string' || typeof uploadUrl !== 'string') {
    throw new ManusApiError('manus_invalid_file_response', 502);
  }

  let target: URL;
  try {
    target = new URL(uploadUrl);
  } catch {
    throw new ManusApiError('manus_invalid_upload_url', 502);
  }
  if (target.protocol !== 'https:' || target.username || target.password) {
    throw new ManusApiError('manus_invalid_upload_url', 502);
  }

  let uploadResponse: Response;
  try {
    uploadResponse = await fetch(target, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: bytes,
      signal: AbortSignal.timeout(30000),
    });
  } catch {
    throw new ManusApiError('manus_file_upload_failed', 502);
  }
  if (!uploadResponse.ok) throw new ManusApiError('manus_file_upload_failed', 502);

  const details = await manusRequest(
    apiKey,
    'file.detail?file_id=' + encodeURIComponent(fileId),
    { method: 'GET' },
  );
  if (details?.file?.status !== 'uploaded') {
    throw new ManusApiError('manus_file_not_ready', 502);
  }
  return { id: fileId, filename };
}

export async function createManusTask(
  apiKey: string,
  options: {
    title: string;
    prompt: string;
    files?: ManusFile[];
    locale?: string;
    schema?: Record<string, unknown>;
  },
): Promise<ManusTaskOutput> {
  const content: Array<Record<string, unknown>> = [
    { type: 'text', text: options.prompt, visibility: 'visible' },
    ...(options.files || []).map((file) => ({
      type: 'file',
      file_id: file.id,
      filename: file.filename,
    })),
  ];
  const body: Record<string, unknown> = {
    title: options.title,
    message: { content },
    agent_profile: 'standard',
    locale: options.locale || 'en',
    interactive_mode: false,
    hide_in_task_list: true,
    share_visibility: 'private',
    clear_connectors: true,
  };
  if (options.schema) body.structured_output_schema = options.schema;

  const result = await manusRequest(apiKey, 'task.create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (typeof result?.task_id !== 'string') {
    throw new ManusApiError('manus_task_create_failed', 502);
  }
  return result as ManusTaskOutput;
}

export async function listManusMessages(apiKey: string, taskId: string) {
  const query = new URLSearchParams({
    task_id: taskId,
    order: 'desc',
    limit: '100',
  });
  return manusRequest(apiKey, 'task.listMessages?' + query.toString(), { method: 'GET' });
}

import { invokeFunction } from '@/api/supabaseClient';

const POLL_INTERVAL_MS = 4500;
const MAX_WAIT_MS = 12 * 60 * 1000;

function waitForNextPoll(signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('The operation was aborted.', 'AbortError'));
      return;
    }
    const finish = () => {
      signal?.removeEventListener('abort', abort);
      resolve();
    };
    const timer = setTimeout(finish, POLL_INTERVAL_MS);
    const abort = () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      reject(new DOMException('The operation was aborted.', 'AbortError'));
    };
    signal?.addEventListener('abort', abort, { once: true });
  });
}

export async function waitForManusTask(analysisId, kind, { signal, onProgress } = {}) {
  const deadline = Date.now() + MAX_WAIT_MS;
  while (Date.now() < deadline) {
    if (signal?.aborted) throw new DOMException('The operation was aborted.', 'AbortError');
    const response = await invokeFunction('manusTaskStatus', { analysisId, kind }, { signal });
    const result = response?.data || {};
    onProgress?.(result);
    if (result.state === 'complete') return result;
    if (result.state === 'failed') {
      const error = new Error(typeof result.error === 'string' ? result.error : 'manus_task_failed');
      error.code = typeof result.error === 'string' ? result.error : 'manus_task_failed';
      throw error;
    }
    await waitForNextPoll(signal);
  }
  const error = new Error('manus_task_timeout');
  error.code = 'manus_task_timeout';
  throw error;
}

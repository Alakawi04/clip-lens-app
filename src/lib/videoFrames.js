const DATABASE_NAME = 'cliplens-local-media';
const STORE_NAME = 'analysis-frames';
const FRAME_RETENTION_MS = 24 * 60 * 60 * 1000;
const MAX_FRAME_COUNT = 6;
const MAX_FRAME_BYTES = 800_000;
const MAX_REFERENCE_IMAGE_BYTES = 900_000;

function canvasToBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('reference_image_failed')), 'image/jpeg', quality);
  });
}

function blobToBase64(blob) {
  return blob.arrayBuffer().then((buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
    }
    return btoa(binary);
  });
}

export async function prepareReferenceFrames(files) {
  const selected = Array.from(files || []);
  if (!selected.length || selected.length > 4) throw new Error('invalid_reference_image_count');
  const frames = [];
  for (const file of selected) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 25_000_000) {
      throw new Error('invalid_reference_image');
    }
    let bitmap;
    try {
      bitmap = await createImageBitmap(file);
      if (!bitmap.width || !bitmap.height) throw new Error('invalid_reference_image');
      const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext('2d', { alpha: false });
      if (!context) throw new Error('reference_image_failed');
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      let blob = await canvasToBlob(canvas, 0.78);
      if (blob.size > MAX_FRAME_BYTES) blob = await canvasToBlob(canvas, 0.58);
      if (blob.size > MAX_FRAME_BYTES) throw new Error('reference_image_too_large');
      frames.push(blob);
    } catch (error) {
      if (error?.message?.startsWith('reference_') || error?.message === 'invalid_reference_image') throw error;
      throw new Error('invalid_reference_image');
    } finally {
      bitmap?.close?.();
    }
  }
  return frames;
}

export async function getAnalysisReferenceImage(analysisId) {
  const frames = await getAnalysisFrames(analysisId);
  if (!frames?.length) return null;
  const selected = frames.length > 4
    ? [0, Math.round((frames.length - 1) / 3), Math.round(((frames.length - 1) * 2) / 3), frames.length - 1].map((index) => frames[index])
    : frames;
  const columns = selected.length === 1 ? 1 : 2;
  const rows = selected.length === 1 ? 1 : 2;
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw new Error('reference_image_failed');
  context.fillStyle = '#111318';
  context.fillRect(0, 0, canvas.width, canvas.height);
  const cellWidth = canvas.width / columns;
  const cellHeight = canvas.height / rows;
  for (let index = 0; index < selected.length; index += 1) {
    const bitmap = await createImageBitmap(selected[index]);
    try {
      const scale = Math.max(cellWidth / bitmap.width, cellHeight / bitmap.height);
      const cropWidth = cellWidth / scale;
      const cropHeight = cellHeight / scale;
      const sourceX = (bitmap.width - cropWidth) / 2;
      const sourceY = (bitmap.height - cropHeight) / 2;
      const x = (index % columns) * cellWidth;
      const y = Math.floor(index / columns) * cellHeight;
      context.drawImage(bitmap, sourceX, sourceY, cropWidth, cropHeight, x, y, cellWidth, cellHeight);
    } finally {
      bitmap.close?.();
    }
  }
  let reference = await canvasToBlob(canvas, 0.82);
  if (reference.size > MAX_REFERENCE_IMAGE_BYTES) reference = await canvasToBlob(canvas, 0.64);
  if (reference.size > MAX_REFERENCE_IMAGE_BYTES) throw new Error('reference_image_too_large');
  return { mimeType: 'image/jpeg', data: await blobToBase64(reference) };
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 2);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: 'analysisId' }).createIndex('savedAt', 'savedAt');
      } else {
        const store = request.transaction.objectStore(STORE_NAME);
        if (!store.indexNames.contains('savedAt')) store.createIndex('savedAt', 'savedAt');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not open local video storage.'));
  });
}

async function withStore(mode, action) {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, mode);
      const store = transaction.objectStore(STORE_NAME);
      const request = action(store);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Could not access local video storage.'));
    });
  } finally {
    database.close();
  }
}

export async function pruneExpiredAnalysisFrames() {
  const database = await openDatabase();
  try {
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      const request = transaction.objectStore(STORE_NAME)
        .index('savedAt')
        .openCursor(IDBKeyRange.upperBound(Date.now() - FRAME_RETENTION_MS));
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) return;
        cursor.delete();
        cursor.continue();
      };
      request.onerror = () => reject(request.error || new Error('Could not expire local video frames.'));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error('Could not expire local video frames.'));
      transaction.onabort = () => reject(transaction.error || new Error('Could not expire local video frames.'));
    });
  } finally {
    database.close();
  }
}

export async function saveAnalysisFrames(analysisId, frames) {
  await pruneExpiredAnalysisFrames();
  await withStore('readwrite', (store) => store.put({ analysisId, frames, savedAt: Date.now() }));
}

export async function getAnalysisFrames(analysisId) {
  const record = await withStore('readonly', (store) => store.get(analysisId));
  if (!record) return null;
  if (Date.now() - record.savedAt > FRAME_RETENTION_MS) {
    await deleteAnalysisFrames(analysisId);
    return null;
  }
  return record.frames;
}

export async function deleteAnalysisFrames(analysisId) {
  await withStore('readwrite', (store) => store.delete(analysisId));
}

export async function copyAnalysisFrames(sourceId, destinationId) {
  const frames = await getAnalysisFrames(sourceId);
  if (!frames?.length) return false;
  await saveAnalysisFrames(destinationId, frames);
  return true;
}

export async function getInlineAnalysisFrames(analysisId) {
  const frames = await getAnalysisFrames(analysisId);
  if (!frames?.length) return null;

  return Promise.all(frames.map(async (frame) => {
    if (!(frame instanceof Blob) || frame.size > MAX_FRAME_BYTES) {
      throw new Error('A saved video frame is invalid.');
    }
    const bytes = new Uint8Array(await frame.arrayBuffer());
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
    }
    return { mimeType: 'image/jpeg', data: btoa(binary) };
  }));
}

export function readVideoDuration(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    const timeout = setTimeout(() => finish(new Error('video_unreadable')), 15000);
    const finish = (error, duration) => {
      clearTimeout(timeout);
      video.onloadedmetadata = null;
      video.onerror = null;
      URL.revokeObjectURL(url);
      video.removeAttribute('src');
      video.load();
      if (error) reject(error);
      else resolve(duration);
    };
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      const duration = video.duration;
      if (!Number.isFinite(duration) || duration <= 0) finish(new Error('video_unreadable'));
      else finish(null, duration);
    };
    video.onerror = () => finish(new Error('video_unreadable'));
    video.src = url;
  });
}

/** @param {File} file @param {(progress: number) => void} [onProgress] */
export async function extractVideoFrames(file, onProgress = () => {}) {
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.preload = 'auto';
  video.muted = true;
  video.playsInline = true;

  const waitForEvent = (eventName, errorName = 'frame_extraction_failed') => new Promise((resolve, reject) => {
    const timeout = setTimeout(() => finish(new Error(errorName)), 20000);
    const finish = (error) => {
      clearTimeout(timeout);
      video.removeEventListener(eventName, onSuccess);
      video.removeEventListener('error', onError);
      if (error) reject(error);
      else resolve();
    };
    const onSuccess = () => finish();
    const onError = () => finish(new Error(errorName));
    video.addEventListener(eventName, onSuccess, { once: true });
    video.addEventListener('error', onError, { once: true });
  });

  const capture = (canvas) => new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob || blob.size > MAX_FRAME_BYTES) {
        reject(new Error('frame_extraction_failed'));
        return;
      }
      resolve(blob);
    }, 'image/jpeg', 0.72);
  });

  try {
    const metadataLoaded = waitForEvent('loadedmetadata', 'video_unreadable');
    video.src = url;
    await metadataLoaded;
    if (!Number.isFinite(video.duration) || video.duration <= 0 || !video.videoWidth || !video.videoHeight) {
      throw new Error('video_unreadable');
    }
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      await waitForEvent('loadeddata', 'video_unreadable');
    }

    const scale = Math.min(1, 1024 / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('frame_extraction_failed');

    const frames = [];
    for (let index = 0; index < MAX_FRAME_COUNT; index += 1) {
      const fraction = MAX_FRAME_COUNT === 1 ? 0.5 : 0.06 + (0.88 * index) / (MAX_FRAME_COUNT - 1);
      const time = Math.max(0, Math.min(Math.max(0, video.duration - 0.001), video.duration * fraction));
      if (Math.abs(video.currentTime - time) > 0.02) {
        const seeked = waitForEvent('seeked');
        video.currentTime = time;
        await seeked;
      }
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      frames.push(await capture(canvas));
      onProgress(Math.round(((index + 1) / MAX_FRAME_COUNT) * 100));
    }
    return frames;
  } finally {
    video.pause();
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(url);
  }
}

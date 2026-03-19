function getApiKey() {
  const key = localStorage.getItem('banana_api_key') || import.meta.env.VITE_BANANA_API_KEY;
  if (!key) throw new Error('API key not set — open Settings (⚙️) to enter your BananaAnything key');
  return key;
}

export function compressImage(dataURI, maxSide = 1024, quality = 0.6) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxSide || height > maxSide) {
        if (width > height) { height = Math.round((height * maxSide) / width); width = maxSide; }
        else { width = Math.round((width * maxSide) / height); height = maxSide; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = dataURI;
  });
}

async function uploadImage(dataURI) {
  const fetchRes = await fetch(dataURI);
  const blob = await fetchRes.blob();
  const formData = new FormData();
  formData.append('file', blob, 'image.jpg');
  const res = await fetch('/upload-proxy/api/v1/upload', { method: 'POST', body: formData });
  if (!res.ok) throw new Error(`Image upload failed: ${res.status}`);
  const json = await res.json();
  if (json.status !== 'success') throw new Error('Image upload failed: ' + JSON.stringify(json));
  // tmpfiles.org returns tmpfiles.org/xxxxx/file.jpg — direct download is tmpfiles.org/dl/xxxxx/file.jpg
  return json.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
}

export async function submitTask(imageUrl, { prompt, size, aspectRatio }) {
  const res = await fetch('/banana-api/api/async/image_nanoBanana_pro', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: getApiKey(), prompt, size, aspectRatio, urls: [imageUrl] }),
  });
  if (!res.ok) throw new Error(`Submit failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  if (json.code !== 200) throw new Error(`Submit error: ${json.msg}`);
  return json.data.id;
}

export async function pollUntilDone(taskId, { interval = 3000, timeout = 300000, onProgress } = {}) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, interval));
    const res = await fetch(
      `/banana-api/api/async/detail?key=${encodeURIComponent(getApiKey())}&id=${encodeURIComponent(taskId)}`,
      { cache: 'no-store' }
    );
    if (!res.ok) throw new Error(`Poll failed: ${res.status}`);
    const json = await res.json();
    if (json.code !== 200) throw new Error(`Poll error: ${json.msg}`);
    const { status, result, message } = json.data;
    if (status === 2) return { resultUrls: result };
    if (status < 0) throw new Error(message || 'Task failed');
    if (onProgress) onProgress(json.data);
  }
  throw new Error('Timed out waiting for BananaAnything result');
}

export async function render(imageDataURI, options = {}) {
  const { onProgress, ...params } = options;
  const imageUrl = await uploadImage(imageDataURI);
  const taskId = await submitTask(imageUrl, params);
  return pollUntilDone(taskId, { onProgress });
}

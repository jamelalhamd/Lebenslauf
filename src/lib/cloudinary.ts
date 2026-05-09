interface SignResponse {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  resourceType: string;
}

export interface UploadResult {
  url: string;
  publicId: string;
  resourceType: 'image' | 'raw';
}

async function getSignature(folder: string, publicId?: string, resourceType = 'image'): Promise<SignResponse> {
  const res = await fetch('/api/sign-cloudinary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder, publicId, resourceType }),
  });
  if (!res.ok) throw new Error('Failed to get Cloudinary signature');
  return res.json();
}

async function uploadBlob(
  blob: Blob,
  folder: string,
  publicId?: string,
  resourceType = 'image'
): Promise<UploadResult> {
  const { signature, timestamp, apiKey, cloudName } = await getSignature(folder, publicId, resourceType);

  const form = new FormData();
  form.append('file', blob);
  form.append('api_key', apiKey);
  form.append('timestamp', String(timestamp));
  form.append('signature', signature);
  form.append('folder', folder);
  if (publicId) form.append('public_id', publicId);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    { method: 'POST', body: form }
  );
  if (!res.ok) {
    const detail = await res.text().catch(() => res.status.toString());
    throw new Error(`Cloudinary upload failed (${res.status}): ${detail}`);
  }
  const data = await res.json() as { secure_url: string; public_id: string };
  console.log('☁️ Cloudinary upload OK:', data.secure_url);
  return { url: data.secure_url, publicId: data.public_id, resourceType: resourceType as 'image' | 'raw' };
}

export async function uploadPhotoToCloudinary(base64DataUrl: string): Promise<string> {
  const blob = await fetch(base64DataUrl).then(r => r.blob());
  const result = await uploadBlob(blob, 'cv/profile', 'photo', 'image');
  return result.url;
}

export async function uploadPDFToCloudinary(blob: Blob, publicId: string): Promise<string> {
  const result = await uploadBlob(blob, 'cv/pdfs', publicId, 'raw');
  return result.url;
}

export async function uploadMediaFile(file: File): Promise<UploadResult> {
  const isImage = file.type.startsWith('image/');
  const resourceType = isImage ? 'image' : 'raw';
  const folder = isImage ? 'cv/media/images' : 'cv/media/documents';
  return uploadBlob(file, folder, undefined, resourceType);
}

export async function deleteFromCloudinary(publicId: string, resourceType = 'image'): Promise<boolean> {
  try {
    const res = await fetch('/api/delete-cloudinary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicId, resourceType }),
    });
    return res.ok;
  } catch (e) {
    console.error('Cloudinary delete error:', e);
    return false;
  }
}

export function getDownloadUrl(url: string, resourceType: 'image' | 'raw'): string {
  if (resourceType === 'image') {
    return url.replace('/upload/', '/upload/fl_attachment/');
  }
  return url;
}

function applyTransform(url: string, transform: string): string {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  return url.replace('/upload/', `/upload/${transform}/`);
}

export function getProfilePhotoUrl(url: string, sizePx = 200): string {
  return applyTransform(url, `c_fill,g_face,w_${sizePx},h_${sizePx},q_auto,f_auto`);
}

export function getThumbnailUrl(url: string, sizePx = 300): string {
  return applyTransform(url, `c_fill,w_${sizePx},h_${sizePx},q_auto,f_auto`);
}

export function getOptimizedUrl(url: string): string {
  return applyTransform(url, 'q_auto,f_auto');
}

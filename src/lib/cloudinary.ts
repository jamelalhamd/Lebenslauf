// Unsigned uploads — no backend signature endpoint required.
// Cloud name and upload preset are intentionally public (not secrets).
const CLOUD_NAME    = (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME    as string) || 'dwrv9ie4f';
const UPLOAD_PRESET = (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string) || 'cv_upload';

export interface UploadResult {
  url: string;
  publicId: string;
  resourceType: 'image' | 'raw';
}

async function uploadBlob(
  blob: Blob,
  folder: string,
  publicId?: string,
  resourceType: 'image' | 'raw' | 'auto' = 'image',
): Promise<UploadResult> {
  const form = new FormData();
  form.append('file', blob);
  form.append('upload_preset', UPLOAD_PRESET);
  form.append('folder', folder);
  if (publicId) form.append('public_id', publicId);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
    { method: 'POST', body: form },
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => String(res.status));
    throw new Error(`Cloudinary upload failed (${res.status}): ${detail}`);
  }

  const data = await res.json() as { secure_url: string; public_id: string; resource_type: string };
  console.log('☁️ Cloudinary upload OK:', data.secure_url);
  return {
    url: data.secure_url,
    publicId: data.public_id,
    resourceType: (data.resource_type === 'image' ? 'image' : 'raw') as 'image' | 'raw',
  };
}

export async function uploadPhotoToCloudinary(base64DataUrl: string): Promise<UploadResult> {
  const blob = await fetch(base64DataUrl).then(r => r.blob());
  // Unique publicId per upload so the URL always changes → eliminates browser/CDN cache issues
  return uploadBlob(blob, 'cv/profile', `photo_${Date.now()}`, 'image');
}

export async function uploadPDFToCloudinary(blob: Blob, publicId: string): Promise<string> {
  const result = await uploadBlob(blob, 'cv/pdfs', publicId, 'raw');
  return result.url;
}

export async function uploadMediaFile(file: File): Promise<UploadResult> {
  const isImage = file.type.startsWith('image/');
  const resourceType = isImage ? 'image' : 'raw';
  const folder = isImage ? 'cv/media/images' : 'cv/media/documents';
  // Embed the original filename (with extension) in the public_id for raw files so
  // Cloudinary preserves the correct extension in the delivery URL. Without this,
  // Cloudinary auto-generates a random ID with no extension and some browsers cannot
  // determine the Content-Type from the URL alone (needed for inline PDF rendering).
  const publicId = isImage
    ? undefined
    : `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  return uploadBlob(file, folder, publicId, resourceType);
}

// Delete requires a signed backend call (Firebase Cloud Function on Blaze plan).
// On Spark plan the API returns an error — we still clean up app state by returning true.
export async function deleteFromCloudinary(publicId: string, resourceType = 'image'): Promise<boolean> {
  try {
    const res = await fetch('/api/delete-cloudinary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicId, resourceType }),
    });
    if (res.ok) return true;
    // Non-OK (function not deployed) — log but still allow app-state cleanup
    console.warn(`Cloudinary delete skipped (${res.status}) — file may remain in storage`);
    return true;
  } catch (e) {
    console.warn('Cloudinary delete unavailable:', e);
    return true;
  }
}

export function getDownloadUrl(url: string, _resourceType?: 'image' | 'raw'): string {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  // fl_attachment forces download for all resource types (image, PDF, DOC, etc.)
  return url.replace('/upload/', '/upload/fl_attachment/');
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

// Fetch the file, build a same-origin blob URL, then trigger the browser's
// native save-dialog.  A blob URL always respects the `download` attribute —
// unlike cross-origin hrefs where the attribute is silently ignored by Chrome 65+.
// Falls back to window.open when CORS or network prevents the fetch.
export async function downloadFile(fileUrl: string, filename: string): Promise<void> {
  try {
    const res = await fetch(fileUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename || 'file';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
  } catch {
    window.open(fileUrl, '_blank');
  }
}

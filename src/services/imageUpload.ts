// Product photo hosting via Cloudinary instead of Firebase Storage - avoids
// the Blaze (paid) plan Firebase now requires for Storage. Cloud name and
// upload preset are not secrets (this is an unsigned upload preset, scoped
// to accept uploads only - it can't read/delete/manage the account), so
// it's safe for these to live in the client bundle like the Firebase config.
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const isCloudinaryConfigured = Boolean(CLOUD_NAME && UPLOAD_PRESET);

/** Uploads one product photo to Cloudinary and returns its public URL. */
export async function uploadHubListingImage(file: File): Promise<string> {
  if (!isCloudinaryConfigured) {
    throw new Error('Image hosting is not configured (missing Cloudinary env vars)');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message || `Image upload failed (${res.status})`);
  }

  const data = await res.json();
  return data.secure_url as string;
}

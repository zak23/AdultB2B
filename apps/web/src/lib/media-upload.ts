import { api, ApiError } from './api';

const MEDIA_TYPE_IMAGE = 'image';

export interface UploadImageResult {
  mediaAssetId: string;
  publicUrl: string;
}

/**
 * Upload an image via presigned URL and confirm. Returns mediaAssetId for use
 * with PUT /profiles/me/avatar or PUT /profiles/me/banner.
 */
export async function uploadProfileImage(file: File): Promise<UploadImageResult> {
  const { uploadUrl, mediaAssetId, publicUrl } = await api.post<{
    uploadUrl: string;
    mediaAssetId: string;
    publicUrl: string;
  }>('/media/upload-url', {
    filename: file.name,
    contentType: file.type,
    mediaType: MEDIA_TYPE_IMAGE,
    byteSize: file.size,
  });

  const putResponse = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });

  if (!putResponse.ok) {
    throw new Error(`Upload failed: ${putResponse.statusText}`);
  }

  await api.post(`/media/${mediaAssetId}/confirm`, {});

  return { mediaAssetId, publicUrl };
}

export function isApiError(e: unknown): e is ApiError {
  return (
    typeof e === 'object' &&
    e !== null &&
    'statusCode' in e &&
    'message' in e
  );
}

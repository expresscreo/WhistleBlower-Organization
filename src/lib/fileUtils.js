/**
 * Utility functions for handling local file storage
 */

import { sanitizeFilename } from './utils';
import { supabase } from '@/lib/customSupabaseClient';
import { isAvifStorageEnabled, isImageFile, uploadCategoryFile } from './supabaseStorageService';
import {
  getBucketForStoragePath,
  PRIVATE_EVIDENCE_BUCKET,
  PUBLIC_MEDIA_BUCKET,
  extractStoragePathFromPublicUrl,
} from './storageBuckets';

const normalizeStoragePath = (filePath) =>
  String(filePath || '')
    .replace(/^\//, '')
    .replace(/^wb_evio\//, '');

const getPublicStorageUrl = (filePath, bucket = getBucketForStoragePath(filePath)) => {
  const cleanPath = normalizeStoragePath(filePath);
  if (!cleanPath) return null;

  try {
    const { data } = supabase.storage.from(bucket).getPublicUrl(cleanPath);
    return data?.publicUrl || null;
  } catch (_) {
    return null;
  }
};

async function getSignedStorageUrl(filePath, buckets = []) {
  const cleanPath = normalizeStoragePath(filePath);
  if (!cleanPath) return null;

  const bucketList = buckets.length
    ? buckets
    : [getBucketForStoragePath(cleanPath), PRIVATE_EVIDENCE_BUCKET, PUBLIC_MEDIA_BUCKET];

  for (const bucket of [...new Set(bucketList)]) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(cleanPath, 3600);
      if (!error && data?.signedUrl) return data.signedUrl;
    } catch (_) {
      // try next bucket
    }
  }

  return null;
}

const normalizeWBMediaPath = (filePath) => {
    if (!filePath || typeof filePath !== 'string') return null;
    if (filePath.startsWith('/WBMedia/')) return filePath;
    if (filePath.startsWith('WBMedia/')) return `/${filePath}`;

    const wbMediaIndex = filePath.indexOf('WBMedia/');
    if (wbMediaIndex >= 0) {
        return `/${filePath.slice(wbMediaIndex)}`;
    }

    return null;
};

// Upload to Supabase storage as a fallback when the local upload endpoint
// is not available (e.g., on production static hosting).
async function uploadFileToSupabaseFallback(file, category, subfolder, fileName) {
    if (isImageFile(file) && isAvifStorageEnabled()) {
        return uploadCategoryFile(file, category, subfolder);
    }

    const pathParts = [category];
    if (subfolder) pathParts.push(subfolder);
    pathParts.push(fileName);
    const storagePath = pathParts.join('/');
    const bucket = getBucketForStoragePath(storagePath);

    const { error: uploadError } = await supabase
        .storage
        .from(bucket)
        .upload(storagePath, file, {
            upsert: true,
            cacheControl: '3600',
            contentType: file.type || 'application/octet-stream',
        });

    if (uploadError) {
        throw new Error(`Supabase upload failed: ${uploadError.message}`);
    }

    return storagePath;
}

/**
 * Upload a file to the local WBMedia directory
 * @param {File} file - The file to upload
 * @param {string} category - The category folder (bounties, news, reports)
 * @param {string} subfolder - Optional subfolder (e.g., bounty ID, news ID)
 * @returns {Promise<string>} - The relative path to the uploaded file
 */
export const uploadFileToLocal = async (file, category = 'general', subfolder = '') => {
    try {
        if (isImageFile(file) && isAvifStorageEnabled()) {
            return uploadCategoryFile(file, category, subfolder);
        }

        // Create FormData for file upload
        const formData = new FormData();
        const sanitizedName = sanitizeFilename(file.name);
        const timestamp = Date.now();
        const fileName = `${timestamp}-${sanitizedName}`;
        
        // Determine the destination path inside the public folder
        let relativePath;
        if (subfolder) {
            relativePath = `WBMedia/${category}/${subfolder}`;
        } else {
            relativePath = `WBMedia/${category}`;
        }

        // Destination used by different servers:
        // - Node server (dev) expects a path starting with "public/"
        // - PHP endpoint (prod) expects a path relative to docroot (no leading "public/")
        const destinationPathDev = `public/${relativePath}`;
        const destinationPathProd = `${relativePath}`;

        formData.append('file', file);

        // Decide upload target:
        // - In development (localhost) use Node server /api/upload
        // - In production, use PHP endpoint /upload.php to save under WBMedia
        // - Only for reporter evidence flows elsewhere should we fall back to Supabase
        try {
            const host = typeof window !== 'undefined' ? window.location.hostname : '';
            const isLocalhost = host === 'localhost' || host === '127.0.0.1';
            const endpoint = isLocalhost
                ? `/api/upload?path=${encodeURIComponent(destinationPathDev)}`
                : `/upload.php?path=${encodeURIComponent(destinationPathProd)}`;

            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData,
            });

            // If server returns non-2xx, try fallback
            if (!response.ok) {
                throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
            }

            // Try to parse JSON safely; if this fails for any reason, fallback to Supabase
            try {
                // Validate content-type before parsing JSON
                const contentType = response.headers.get('content-type') || '';
                if (!contentType.includes('application/json')) {
                    const text = await response.text();
                    throw new Error(`Unexpected response content-type. First 120 chars: ${text.slice(0, 120)}`);
                }

                const result = await response.json();
                if (!result?.success || !result?.filePath) {
                    throw new Error(result?.error || 'Upload failed: invalid JSON payload');
                }

                return result.filePath;
            } catch (jsonErr) {
                // If JSON parsing fails or payload invalid, use Supabase fallback
                console.warn('Local upload returned non-JSON or invalid payload; using Supabase fallback:', jsonErr?.message || jsonErr);
                // For bounties/news we want local WBMedia, but if PHP/Node is unavailable,
                // still upload to WBMedia via Supabase and return a public URL.
                return await uploadFileToSupabaseFallback(file, category, subfolder, fileName);
            }
        } catch (err) {
            console.warn('Local upload failed, falling back to Supabase storage:', err?.message || err);
            // Fallback to Supabase storage (works in production/static hosting)
            return await uploadFileToSupabaseFallback(file, category, subfolder, fileName);
        }
    } catch (error) {
        console.error('Error uploading file:', error);
        throw new Error(`Failed to upload file: ${error.message}`);
    }
};

/**
 * Get the public URL for a local file
 * @param {string} filePath - The file path
 * @returns {string} - The public URL
 */
export const getLocalFileUrl = (filePath) => {
    if (!filePath) return null;
    
    // If it's already a full URL, return as is
    if (filePath.startsWith('http')) return filePath;

    const normalizedWBMediaPath = normalizeWBMediaPath(filePath);
    if (normalizedWBMediaPath) return normalizedWBMediaPath;

    const storagePath = normalizeStoragePath(filePath);
    const bucket = getBucketForStoragePath(storagePath);

    if (bucket === PUBLIC_MEDIA_BUCKET) {
        return getPublicStorageUrl(storagePath, bucket);
    }

    if (storagePath.startsWith('reports/')) {
        // Signed URLs must be resolved asynchronously (see resolveMediaUrl).
        return null;
    }

    const publicUrl = getPublicStorageUrl(storagePath, bucket);
    if (publicUrl) return publicUrl;

    if (storagePath.startsWith('bounties/') || storagePath.startsWith('news/') || storagePath.startsWith('general/')) {
        return getPublicStorageUrl(storagePath, PUBLIC_MEDIA_BUCKET);
    }
    
    // Handle bounty report evidence paths from uploadFileToLocal (WBMedia/bounties/delito/)
    if (filePath.includes('bounties/delito') || filePath.includes('bounties/')) {
        if (!filePath.startsWith('/')) return `/WBMedia/bounties/delito/${filePath}`;
        return filePath;
    }
    
    if (filePath.startsWith('WBMedia/')) return `/${filePath}`;
    
    return `/WBMedia/${filePath}`;
};

/**
 * Resolve an image/file path to a URL usable in both localhost and production.
 * - http(s) URLs are returned as-is
 * - Supabase storage paths are converted to public URLs
 * - Local WBMedia relative paths are normalized with a leading slash
 */
export const resolveImageUrl = (filePath) => {
    if (!filePath) return null;
    if (typeof filePath !== 'string') return null;
    if (filePath.startsWith('http')) return filePath;

    const normalizedWBMediaPath = normalizeWBMediaPath(filePath);
    if (normalizedWBMediaPath) return normalizedWBMediaPath;

    const storagePath = normalizeStoragePath(filePath);
    if (storagePath.startsWith('reports/')) {
        return getPublicStorageUrl(storagePath, PRIVATE_EVIDENCE_BUCKET);
    }

    if (
        storagePath.startsWith('bounties/') ||
        storagePath.startsWith('news/') ||
        storagePath.startsWith('general/')
    ) {
        return getPublicStorageUrl(storagePath, PUBLIC_MEDIA_BUCKET);
    }

    if (filePath.includes('bounties/delito') || filePath.includes('bounties/')) {
        if (!filePath.startsWith('/')) return `/WBMedia/bounties/delito/${filePath}`;
        return filePath;
    }
    return `/WBMedia/${filePath}`;
};

export { getSignedStorageUrl, normalizeStoragePath, extractStoragePathFromPublicUrl };

/**
 * Delete a local file (placeholder for future implementation)
 * @param {string} filePath - The file path to delete
 * @returns {Promise<boolean>} - Success status
 */
export const deleteLocalFile = async (filePath) => {
    try {
        console.log(`Would delete file: ${filePath}`);
        // In production, implement actual file deletion
        return true;
    } catch (error) {
        console.error('Error deleting file:', error);
        return false;
    }
};

/**
 * Convert Supabase storage paths to local paths
 * @param {string} supabasePath - The Supabase storage path
 * @returns {string} - The local file path
 */
export const convertSupabaseToLocal = (supabasePath) => {
    if (!supabasePath) return null;
    
    // Extract the filename from Supabase path
    const fileName = supabasePath.split('/').pop();
    return `/WBMedia/${fileName}`;
};

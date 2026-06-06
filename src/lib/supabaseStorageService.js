import { supabase } from '@/lib/customSupabaseClient';
import { sanitizeFilename } from '@/lib/utils';
import {
  extractStoragePathFromPublicUrl,
  getBucketForFolder,
  getBucketForStoragePath,
} from '@/lib/storageBuckets';

const USE_AVIF_STORAGE = process.env.NEXT_PUBLIC_USE_AVIF_STORAGE === 'true';
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const isImageFile = (file) => file?.type?.startsWith('image/');

export { isImageFile };

function validateImageFile(file) {
  if (!file) throw new Error('No file provided');
  if (!isImageFile(file)) throw new Error('File must be an image');
  if (file.size > MAX_FILE_SIZE) throw new Error('File size must be less than 10MB');
}

export function buildCategoryFolder(category = 'general', subfolder = '') {
  const safeCategory = String(category || 'general').replace(/[^a-zA-Z0-9._-]/g, '_');
  if (!subfolder) return safeCategory;
  const safeSubfolder = String(subfolder).replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${safeCategory}/${safeSubfolder}`;
}

export function extractStoragePathFromUrl(url) {
  if (!url || typeof url !== 'string') return url;
  if (!url.startsWith('http')) return url.replace(/^\//, '').replace(/^wb_evio\//, '');
  return extractStoragePathFromPublicUrl(url);
}

async function uploadAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

async function uploadDirectToStorage(file, userId, folder) {
  const sanitizedName = sanitizeFilename(file.name);
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const safeUserId = String(userId).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 64);
  const filePath = `${folder}/${safeUserId}-${timestamp}-${randomStr}-${sanitizedName}`;
  const bucket = getBucketForFolder(folder);

  const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || 'application/octet-stream',
  });

  if (error) throw new Error(error.message);

  return filePath;
}

async function uploadWithAVIF(file, userId, folder) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('userId', userId);
  formData.append('folder', folder);

  const response = await fetch('/api/upload-image', { method: 'POST', body: formData });
  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'AVIF upload failed');
  }

  return result.path || extractStoragePathFromUrl(result.url);
}

async function uploadImage(file, userId, folder = 'General') {
  validateImageFile(file);

  if (USE_AVIF_STORAGE) {
    try {
      return await uploadWithAVIF(file, userId, folder);
    } catch (error) {
      console.warn('AVIF upload failed, falling back to direct storage:', error?.message || error);
      return uploadDirectToStorage(file, userId, folder);
    }
  }

  return uploadDirectToStorage(file, userId, folder);
}

/**
 * Upload any file to Supabase storage. Images are converted to AVIF when enabled.
 */
export async function uploadStorageFile(file, folder, namespace = 'upload') {
  if (isImageFile(file)) {
    return uploadImage(file, namespace, folder);
  }
  return uploadDirectToStorage(file, namespace, folder);
}

export async function uploadCategoryFile(file, category = 'general', subfolder = '') {
  const folder = buildCategoryFolder(category, subfolder);
  const namespace = subfolder || category || 'upload';
  return uploadStorageFile(file, folder, namespace);
}

export async function uploadReportEvidence(file, reportNamespace) {
  return uploadImage(file, reportNamespace, `reports/${reportNamespace}`);
}

export async function uploadAttachment(file, userId) {
  return uploadImage(file, userId, 'attachments');
}

export async function uploadProfileImage(file, userId) {
  return uploadImage(file, userId, 'profile');
}

export async function uploadGeneralImage(file, userId = 'upload') {
  return uploadImage(file, userId, 'General');
}

export async function deleteImage(imageUrl) {
  if (!imageUrl) return false;
  if (imageUrl.startsWith('data:')) return true;

  const filePath = imageUrl.startsWith('http')
    ? extractStoragePathFromUrl(imageUrl)
    : imageUrl.replace(/^\//, '');

  if (!filePath) return false;

  const bucket = getBucketForStoragePath(filePath);
  const { error } = await supabase.storage.from(bucket).remove([filePath]);
  return !error;
}

export async function getStorageMode() {
  return USE_AVIF_STORAGE ? 'avif' : 'direct';
}

export function isAvifStorageEnabled() {
  return USE_AVIF_STORAGE;
}

export const supabaseStorageService = {
  uploadImage,
  uploadStorageFile,
  uploadCategoryFile,
  uploadReportEvidence,
  uploadAttachment,
  uploadProfileImage,
  uploadGeneralImage,
  uploadAsDataURL,
  deleteImage,
  getStorageMode,
  isAvifStorageEnabled,
  buildCategoryFolder,
  extractStoragePathFromUrl,
  isImageFile,
};

/**
 * Utility functions for handling local file storage
 */

import { sanitizeFilename } from './utils';
import { supabase } from '@/lib/customSupabaseClient';

/**
 * Upload a file to the local WBMedia directory
 * @param {File} file - The file to upload
 * @param {string} category - The category folder (bounties, news, reports)
 * @param {string} subfolder - Optional subfolder (e.g., bounty ID, news ID)
 * @returns {Promise<string>} - The relative path to the uploaded file
 */
export const uploadFileToLocal = async (file, category = 'general', subfolder = '') => {
    try {
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

        const destinationPath = `public/${relativePath}`;

        formData.append('file', file);

        // Upload to the server (pass path via query to ensure it's available in destination)
        const response = await fetch(`/api/upload?path=${encodeURIComponent(destinationPath)}`, {
            method: 'POST',
            body: formData,
        });
        
        if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Upload failed');
        }
        
        return result.filePath;
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
    
    // If it's already a local path starting with /WBMedia/, return as is
    if (filePath.startsWith('/WBMedia/')) return filePath;
    
    // If it's a Supabase path, prefer fetching a public URL (works in localhost and prod)
    if (filePath.includes('wb_evio')) {
        try {
            const { data } = supabase.storage.from('wb_evio').getPublicUrl(filePath);
            return data?.publicUrl || filePath;
        } catch (_) {
            return filePath;
        }
    }
    
    // If it's a relative path without leading slash, add it
    if (filePath.startsWith('WBMedia/')) return `/${filePath}`;
    
    // Default: assume it's a filename and prepend WBMedia
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
    if (filePath.includes('wb_evio')) {
        try {
            const { data } = supabase.storage.from('wb_evio').getPublicUrl(filePath);
            return data?.publicUrl || filePath;
        } catch (_) {
            return filePath;
        }
    }
    if (filePath.startsWith('/WBMedia/')) return filePath;
    if (filePath.startsWith('WBMedia/')) return `/${filePath}`;
    return `/WBMedia/${filePath}`;
};

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

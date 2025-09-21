/**
 * Utility functions for handling local file storage
 */

import { sanitizeFilename } from './utils';

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
        
        // Determine the file path
        let filePath;
        if (subfolder) {
            filePath = `WBMedia/${category}/${subfolder}`;
        } else {
            filePath = `WBMedia/${category}`;
        }
        
        formData.append('file', file);
        formData.append('path', filePath);
        
        // Upload to the server
        const response = await fetch('/api/upload', {
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
    
    // If it's a Supabase path, convert to local path
    if (filePath.includes('wb_evio')) {
        // Extract filename from Supabase path
        const fileName = filePath.split('/').pop();
        return `/WBMedia/${fileName}`;
    }
    
    // If it's a relative path without leading slash, add it
    if (filePath.startsWith('WBMedia/')) return `/${filePath}`;
    
    // Default: assume it's a filename and prepend WBMedia
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

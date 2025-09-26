// Web Crypto API utilities for password hashing
// This replaces bcryptjs with browser-native crypto functionality

/**
 * Hash a password using Web Crypto API with PBKDF2
 * @param {string} password - The password to hash
 * @param {string} salt - The salt to use (optional, will generate if not provided)
 * @returns {Promise<{hash: string, salt: string}>}
 */
export async function hashPassword(password, salt = null) {
    try {
        // Generate a random salt if none provided
        const saltBytes = salt ? 
            new Uint8Array(Array.from(salt, c => c.charCodeAt(0))) : 
            crypto.getRandomValues(new Uint8Array(16));
        
        // Convert password to bytes
        const passwordBytes = new TextEncoder().encode(password);
        
        // Import the password as a key
        const key = await crypto.subtle.importKey(
            'raw',
            passwordBytes,
            { name: 'PBKDF2' },
            false,
            ['deriveBits']
        );
        
        // Derive the hash
        const hashBuffer = await crypto.subtle.deriveBits(
            {
                name: 'PBKDF2',
                salt: saltBytes,
                iterations: 100000,
                hash: 'SHA-256'
            },
            key,
            256 // 256 bits = 32 bytes
        );
        
        // Convert to base64 strings for storage
        const hashArray = new Uint8Array(hashBuffer);
        const hashString = btoa(String.fromCharCode(...hashArray));
        const saltString = btoa(String.fromCharCode(...saltBytes));
        
        return {
            hash: hashString,
            salt: saltString
        };
    } catch (error) {
        console.error('Password hashing error:', error);
        throw new Error('Failed to hash password');
    }
}

/**
 * Verify a password against a hash
 * @param {string} password - The password to verify
 * @param {string} hash - The stored hash
 * @param {string} salt - The stored salt (optional)
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, hash, salt) {
    try {
        // Handle different password storage formats
        
        // 1. New format: hash:salt (Web Crypto API)
        if (hash && hash.includes(':')) {
            const [storedHash, storedSalt] = hash.split(':');
            const { hash: computedHash } = await hashPassword(password, storedSalt);
            return computedHash === storedHash;
        }
        
        // 2. Old format: placeholder hash (temporary debugging)
        if (hash === 'temp_hash_for_debugging') {
            // For debugging purposes, accept any password
            console.warn('Using temporary password verification for debugging');
            return true;
        }
        
        // 3. New format with separate salt parameter
        if (salt && salt !== '') {
            const { hash: computedHash } = await hashPassword(password, salt);
            return computedHash === hash;
        }
        
        // 4. Fallback: direct comparison (for very old bcrypt hashes or other formats)
        // This is a simple fallback - in production you'd want to handle bcrypt properly
        console.warn('Using fallback password verification - consider migrating to new format');
        return false; // Disable fallback for security
        
    } catch (error) {
        console.error('Password verification error:', error);
        return false;
    }
}

/**
 * Generate a random password
 * @param {number} length - Length of the password (default: 12)
 * @returns {string}
 */
export function generateRandomPassword(length = 12) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => chars[byte % chars.length]).join('');
}

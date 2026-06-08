// Password hashing utilities.
// New passwords are hashed server-side when Web Crypto is unavailable (non-secure
// contexts, older browsers, etc.) so report/bounty submission still works.

function hasWebCrypto() {
  return (
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.subtle !== 'undefined' &&
    typeof globalThis.crypto.getRandomValues === 'function'
  );
}

/**
 * Generate a UUID v4. Uses randomUUID when available; falls back for older
 * browsers and non-secure contexts where randomUUID is missing.
 */
export function generateUUID() {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

async function hashPasswordWithWebCrypto(password, salt = null) {
  const saltBytes = (() => {
    if (salt === null || salt === undefined) {
      return globalThis.crypto.getRandomValues(new Uint8Array(16));
    }
    if (typeof salt === 'string') {
      return new Uint8Array(Array.from(atob(salt), (c) => c.charCodeAt(0)));
    }
    if (salt instanceof Uint8Array) {
      return salt;
    }
    throw new Error('Invalid salt format. Must be string (base64), Uint8Array, or null.');
  })();

  const passwordBytes = new TextEncoder().encode(password);
  const key = await globalThis.crypto.subtle.importKey(
    'raw',
    passwordBytes,
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  );

  const hashBuffer = await globalThis.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: 100000,
      hash: 'SHA-256',
    },
    key,
    256,
  );

  const hashArray = new Uint8Array(hashBuffer);
  const hashString = btoa(String.fromCharCode(...hashArray));
  const saltString = btoa(String.fromCharCode(...saltBytes));

  return {
    hash: hashString,
    salt: saltString,
  };
}

async function hashPasswordViaServer(password) {
  const response = await fetch('/api/crypto/hash-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Failed to hash password');
  }

  if (!data.hash || !data.salt) {
    throw new Error('Failed to hash password');
  }

  return {
    hash: data.hash,
    salt: data.salt,
  };
}

/**
 * Hash a password using PBKDF2 (Web Crypto when available, otherwise server API).
 * @param {string} password
 * @param {string|null} salt - base64 salt for verification flows only
 * @returns {Promise<{hash: string, salt: string}>}
 */
export async function hashPassword(password, salt = null) {
  if (!password || typeof password !== 'string') {
    throw new Error('Password is required');
  }

  if (salt !== null && salt !== undefined) {
    if (!hasWebCrypto()) {
      throw new Error('Unable to process password in this environment.');
    }
    return hashPasswordWithWebCrypto(password, salt);
  }

  if (!hasWebCrypto()) {
    return hashPasswordViaServer(password);
  }

  try {
    return await hashPasswordWithWebCrypto(password, null);
  } catch (error) {
    console.warn('Client password hashing failed; using server fallback:', error);
    return hashPasswordViaServer(password);
  }
}

/**
 * Verify a password against a hash (client-side only; tracking uses server APIs).
 */
export async function verifyPassword(password, hash, salt) {
  try {
    let cleanHash = hash;
    if (hash && typeof hash === 'string') {
      if (hash.startsWith("_value: '") && hash.endsWith("'")) {
        cleanHash = hash.slice(9, -1);
      }
    }

    if (cleanHash && cleanHash.includes(':')) {
      const [storedHash, storedSalt] = cleanHash.split(':');
      const { hash: computedHash } = await hashPassword(password, storedSalt);
      return computedHash === storedHash;
    }

    if (!cleanHash || cleanHash === '' || cleanHash === 'null') {
      return false;
    }

    if (salt && salt !== '') {
      const { hash: computedHash } = await hashPassword(password, salt);
      return computedHash === cleanHash;
    }

    return false;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

/**
 * Generate a random password.
 */
export function generateRandomPassword(length = 12) {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';

  if (hasWebCrypto()) {
    const array = new Uint8Array(length);
    globalThis.crypto.getRandomValues(array);
    return Array.from(array, (byte) => chars[byte % chars.length]).join('');
  }

  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// VERSION: v1.0.0 | LAST UPDATED: 2025-10-26 | FEATURE: Web Crypto API Encryption

/**
 * Encryption Utility
 * Uses Web Crypto API (AES-GCM) for encrypting sensitive data like API keys
 * Provides secure encryption/decryption for browser storage
 */

import { createLogger } from '../../utils/logger.js';

const logger = createLogger('Encryption');

/**
 * Encryption algorithm configuration
 */
const ALGORITHM = {
  name: 'AES-GCM',
  length: 256
};

/**
 * IV (Initialization Vector) length in bytes
 */
const IV_LENGTH = 12;

/**
 * Generate a secure encryption key from a password
 * @param {string} password - Password to derive key from
 * @param {Uint8Array} salt - Salt for key derivation
 * @returns {Promise<CryptoKey>} Derived encryption key
 */
async function deriveKey(password, salt) {
  // Import password as key material
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  // Derive AES-GCM key
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    ALGORITHM,
    false,
    ['encrypt', 'decrypt']
  );

  return key;
}

/**
 * Get or generate extension-specific encryption password
 * Uses extension ID as base for password derivation
 * @returns {string} Extension-specific password
 */
function getEncryptionPassword() {
  // Use extension ID + static secret as password base
  const extensionId = chrome.runtime.id;
  const staticSecret = 'web-weaver-encryption-2025';
  
  return `${extensionId}-${staticSecret}`;
}

/**
 * Generate random salt
 * @returns {Uint8Array} Random salt
 */
function generateSalt() {
  return crypto.getRandomValues(new Uint8Array(16));
}

/**
 * Generate random IV (Initialization Vector)
 * @returns {Uint8Array} Random IV
 */
function generateIV() {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
}

/**
 * Encrypt data using AES-GCM
 * @param {string} plaintext - Data to encrypt
 * @returns {Promise<Object>} Encrypted data {ciphertext: string, iv: string, salt: string}
 */
export async function encrypt(plaintext) {
  try {
    if (!plaintext || typeof plaintext !== 'string') {
      throw new Error('Plaintext must be a non-empty string');
    }

    // Generate salt and IV
    const salt = generateSalt();
    const iv = generateIV();

    // Derive encryption key
    const password = getEncryptionPassword();
    const key = await deriveKey(password, salt);

    // Encode plaintext
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    // Encrypt
    const ciphertext = await crypto.subtle.encrypt(
      {
        name: ALGORITHM.name,
        iv: iv
      },
      key,
      data
    );

    // Convert to base64 for storage
    const result = {
      ciphertext: arrayBufferToBase64(ciphertext),
      iv: arrayBufferToBase64(iv),
      salt: arrayBufferToBase64(salt)
    };

    logger.debug('Data encrypted successfully');
    return result;

  } catch (error) {
    logger.error('Encryption failed', error);
    throw new Error(`Encryption failed: ${error.message}`);
  }
}

/**
 * Decrypt data using AES-GCM
 * @param {Object} encryptedData - Encrypted data {ciphertext: string, iv: string, salt: string}
 * @returns {Promise<string>} Decrypted plaintext
 */
export async function decrypt(encryptedData) {
  try {
    if (!encryptedData || !encryptedData.ciphertext || !encryptedData.iv || !encryptedData.salt) {
      throw new Error('Invalid encrypted data format');
    }

    // Decode from base64
    const ciphertext = base64ToArrayBuffer(encryptedData.ciphertext);
    const iv = base64ToArrayBuffer(encryptedData.iv);
    const salt = base64ToArrayBuffer(encryptedData.salt);

    // Derive decryption key (same as encryption)
    const password = getEncryptionPassword();
    const key = await deriveKey(password, salt);

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      {
        name: ALGORITHM.name,
        iv: iv
      },
      key,
      ciphertext
    );

    // Decode plaintext
    const decoder = new TextDecoder();
    const plaintext = decoder.decode(decrypted);

    logger.debug('Data decrypted successfully');
    return plaintext;

  } catch (error) {
    logger.error('Decryption failed', error);
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

/**
 * Check if data is encrypted (has required structure)
 * @param {any} data - Data to check
 * @returns {boolean} True if data appears to be encrypted
 */
export function isEncrypted(data) {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.ciphertext === 'string' &&
    typeof data.iv === 'string' &&
    typeof data.salt === 'string'
  );
}

/**
 * Convert ArrayBuffer to base64 string
 * @param {ArrayBuffer} buffer - Buffer to convert
 * @returns {string} Base64 string
 */
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert base64 string to ArrayBuffer
 * @param {string} base64 - Base64 string
 * @returns {ArrayBuffer} Array buffer
 */
function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Encrypt API key for storage
 * @param {string} apiKey - API key to encrypt
 * @returns {Promise<Object>} Encrypted API key data
 */
export async function encryptApiKey(apiKey) {
  logger.info('Encrypting API key');
  return await encrypt(apiKey);
}

/**
 * Decrypt API key from storage
 * @param {Object} encryptedApiKey - Encrypted API key data
 * @returns {Promise<string>} Decrypted API key
 */
export async function decryptApiKey(encryptedApiKey) {
  logger.info('Decrypting API key');
  return await decrypt(encryptedApiKey);
}

/**
 * Hash data (one-way, for validation only)
 * @param {string} data - Data to hash
 * @returns {Promise<string>} SHA-256 hash (hex string)
 */
export async function hash(data) {
  try {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    
    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  } catch (error) {
    logger.error('Hashing failed', error);
    throw new Error(`Hashing failed: ${error.message}`);
  }
}

/**
 * Generate secure random token
 * @param {number} length - Token length in bytes (default: 32)
 * @returns {string} Random token (base64)
 */
export function generateToken(length = 32) {
  const buffer = crypto.getRandomValues(new Uint8Array(length));
  return arrayBufferToBase64(buffer);
}

// TEST SCENARIOS:
// 1. Encrypt plaintext API key
// 2. Decrypt encrypted API key
// 3. Verify encrypted data has correct structure (ciphertext, iv, salt)
// 4. isEncrypted returns true for encrypted data
// 5. isEncrypted returns false for plaintext
// 6. Encryption with empty string throws error
// 7. Decryption with invalid data throws error
// 8. Decryption with wrong key/salt fails gracefully
// 9. Hash produces consistent output for same input
// 10. Hash produces different output for different input
// 11. Generate random token (32 bytes)
// 12. Encrypt and decrypt round-trip preserves data
// 13. Multiple encryptions of same plaintext produce different ciphertexts (due to random IV)
// 14. Extension-specific password generation uses runtime.id

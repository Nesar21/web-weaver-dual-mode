// VERSION: v1.0.0 | LAST UPDATED: 2025-10-26 | FEATURE: API Key Storage Management

/**
 * API Key Storage Management
 * Handles secure storage, retrieval, and validation of API keys
 * Supports both session (temporary) and local (persistent with Remember Me) storage
 * All keys stored encrypted using Web Crypto API
 */

import { get, set, remove, STORAGE_TYPE } from './storage-manager.js';
import { encrypt, decrypt, isEncrypted } from './encryption.js';
import { validateGeminiApiKey } from '../../utils/validators.js';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('APIKeyStorage');

/**
 * Storage keys for API keys
 */
const STORAGE_KEYS = {
  GEMINI_API_KEY: 'gemini_api_key',
  GEMINI_KEY_ENCRYPTED: 'gemini_key_encrypted',
  REMEMBER_ME: 'api_key_remember_me',
  LAST_VALIDATED: 'api_key_last_validated',
  VALIDATION_STATUS: 'api_key_validation_status'
};

/**
 * Save Gemini API key
 * @param {string} apiKey - API key to save
 * @param {boolean} rememberMe - Whether to persist across sessions
 * @returns {Promise<Object>} Result {success: boolean, error: string|null}
 */
export async function saveApiKey(apiKey, rememberMe = false) {
  try {
    // Validate API key format
    const validation = validateGeminiApiKey(apiKey);
    if (!validation.valid) {
      logger.warn('API key validation failed', validation.error);
      return {
        success: false,
        error: validation.error
      };
    }

    // Encrypt API key
    const encrypted = await encrypt(apiKey);

    // Determine storage type
    const storageType = rememberMe ? STORAGE_TYPE.LOCAL : STORAGE_TYPE.SESSION;

    // Save encrypted key
    await set(STORAGE_KEYS.GEMINI_API_KEY, encrypted, storageType);
    await set(STORAGE_KEYS.GEMINI_KEY_ENCRYPTED, true, storageType);
    await set(STORAGE_KEYS.REMEMBER_ME, rememberMe, STORAGE_TYPE.LOCAL);

    logger.info(`API key saved (${rememberMe ? 'persistent' : 'session'})`);

    return {
      success: true,
      error: null
    };

  } catch (error) {
    logger.error('Failed to save API key', error);
    return {
      success: false,
      error: `Failed to save API key: ${error.message}`
    };
  }
}

/**
 * Get Gemini API key
 * Automatically checks both session and local storage
 * @returns {Promise<string|null>} Decrypted API key or null if not found
 */
export async function getApiKey() {
  try {
    // Check if Remember Me was enabled
    const rememberMe = await get(STORAGE_KEYS.REMEMBER_ME, STORAGE_TYPE.LOCAL);
    const storageType = rememberMe ? STORAGE_TYPE.LOCAL : STORAGE_TYPE.SESSION;

    // Get encrypted key
    const encrypted = await get(STORAGE_KEYS.GEMINI_API_KEY, storageType);

    if (!encrypted) {
      logger.debug('No API key found in storage');
      return null;
    }

    // Verify it's encrypted
    if (!isEncrypted(encrypted)) {
      logger.warn('API key in storage is not encrypted, removing');
      await removeApiKey();
      return null;
    }

    // Decrypt
    const apiKey = await decrypt(encrypted);
    logger.debug('API key retrieved and decrypted');

    return apiKey;

  } catch (error) {
    logger.error('Failed to retrieve API key', error);
    return null;
  }
}

/**
 * Remove API key from storage
 * Clears from both session and local storage
 * @returns {Promise<void>}
 */
export async function removeApiKey() {
  try {
    await remove(STORAGE_KEYS.GEMINI_API_KEY, STORAGE_TYPE.SESSION);
    await remove(STORAGE_KEYS.GEMINI_API_KEY, STORAGE_TYPE.LOCAL);
    await remove(STORAGE_KEYS.GEMINI_KEY_ENCRYPTED, STORAGE_TYPE.SESSION);
    await remove(STORAGE_KEYS.GEMINI_KEY_ENCRYPTED, STORAGE_TYPE.LOCAL);
    await remove(STORAGE_KEYS.REMEMBER_ME, STORAGE_TYPE.LOCAL);
    await remove(STORAGE_KEYS.LAST_VALIDATED, STORAGE_TYPE.LOCAL);
    await remove(STORAGE_KEYS.VALIDATION_STATUS, STORAGE_TYPE.LOCAL);

    logger.info('API key removed from storage');
  } catch (error) {
    logger.error('Failed to remove API key', error);
    throw error;
  }
}

/**
 * Check if API key exists in storage
 * @returns {Promise<boolean>} True if API key exists
 */
export async function hasApiKey() {
  const apiKey = await getApiKey();
  return apiKey !== null;
}

/**
 * Get API key validation status
 * @returns {Promise<Object>} Status {validated: boolean, lastValidated: number|null, status: string}
 */
export async function getValidationStatus() {
  const lastValidated = await get(STORAGE_KEYS.LAST_VALIDATED, STORAGE_TYPE.LOCAL);
  const status = await get(STORAGE_KEYS.VALIDATION_STATUS, STORAGE_TYPE.LOCAL);

  return {
    validated: status === 'valid',
    lastValidated: lastValidated,
    status: status || 'unchecked'
  };
}

/**
 * Update API key validation status
 * @param {string} status - Validation status (valid, invalid, expired, error)
 * @returns {Promise<void>}
 */
export async function updateValidationStatus(status) {
  await set(STORAGE_KEYS.LAST_VALIDATED, Date.now(), STORAGE_TYPE.LOCAL);
  await set(STORAGE_KEYS.VALIDATION_STATUS, status, STORAGE_TYPE.LOCAL);

  logger.info(`API key validation status updated: ${status}`);
}

/**
 * Validate API key by making a test request
 * @param {string} apiKey - API key to validate
 * @returns {Promise<Object>} Result {valid: boolean, error: string|null}
 */
export async function validateApiKeyWithServer(apiKey) {
  try {
    // Format validation first
    const formatValidation = validateGeminiApiKey(apiKey);
    if (!formatValidation.valid) {
      return formatValidation;
    }

    // Test request to Gemini API
    const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`;
    
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: 'test' }]
        }]
      })
    });

    if (response.status === 200) {
      await updateValidationStatus('valid');
      logger.info('API key validated successfully');
      return { valid: true, error: null };
    } else if (response.status === 401 || response.status === 403) {
      await updateValidationStatus('invalid');
      return { valid: false, error: 'Invalid API key or insufficient permissions' };
    } else if (response.status === 429) {
      await updateValidationStatus('valid'); // Key is valid, just rate limited
      return { valid: true, error: null };
    } else {
      await updateValidationStatus('error');
      return { valid: false, error: `Validation failed with status ${response.status}` };
    }

  } catch (error) {
    logger.error('API key validation failed', error);
    await updateValidationStatus('error');
    return { valid: false, error: `Validation error: ${error.message}` };
  }
}

/**
 * Get Remember Me preference
 * @returns {Promise<boolean>} True if Remember Me is enabled
 */
export async function getRememberMePreference() {
  const rememberMe = await get(STORAGE_KEYS.REMEMBER_ME, STORAGE_TYPE.LOCAL);
  return rememberMe === true;
}

/**
 * Mask API key for display in UI
 * @param {string} apiKey - API key to mask
 * @returns {string} Masked API key (AIza****...last4chars)
 */
export function maskApiKey(apiKey) {
  if (!apiKey || apiKey.length < 8) {
    return '••••••••';
  }

  const start = apiKey.slice(0, 4);
  const end = apiKey.slice(-4);
  return `${start}${'•'.repeat(8)}${end}`;
}

/**
 * Migrate unencrypted API key to encrypted storage
 * For backwards compatibility with older versions
 * @returns {Promise<boolean>} True if migration performed
 */
export async function migrateToEncrypted() {
  try {
    // Check both storages for unencrypted keys
    const sessionKey = await get(STORAGE_KEYS.GEMINI_API_KEY, STORAGE_TYPE.SESSION);
    const localKey = await get(STORAGE_KEYS.GEMINI_API_KEY, STORAGE_TYPE.LOCAL);
    const isEncryptedFlag = await get(STORAGE_KEYS.GEMINI_KEY_ENCRYPTED, STORAGE_TYPE.LOCAL);

    // If already encrypted, no migration needed
    if (isEncryptedFlag) {
      return false;
    }

    // Find unencrypted key
    const unencryptedKey = sessionKey || localKey;
    if (!unencryptedKey || isEncrypted(unencryptedKey)) {
      return false;
    }

    logger.warn('Found unencrypted API key, migrating to encrypted storage');

    // Save with encryption
    const rememberMe = localKey ? true : false;
    await saveApiKey(unencryptedKey, rememberMe);

    logger.info('API key migration completed');
    return true;

  } catch (error) {
    logger.error('API key migration failed', error);
    return false;
  }
}

/**
 * Get API key with automatic migration
 * @returns {Promise<string|null>} Decrypted API key
 */
export async function getApiKeyWithMigration() {
  // Attempt migration if needed
  await migrateToEncrypted();

  // Get API key normally
  return await getApiKey();
}

// TEST SCENARIOS:
// 1. Save API key with Remember Me = true (local storage)
// 2. Save API key with Remember Me = false (session storage)
// 3. Get API key from storage and decrypt
// 4. Remove API key (clears both session and local)
// 5. hasApiKey returns true when key exists
// 6. hasApiKey returns false when key doesn't exist
// 7. Validate API key format (valid AIza... format)
// 8. Validate API key format (invalid format)
// 9. Validate API key with server (200 response)
// 10. Validate API key with server (401 invalid)
// 11. Get validation status after validation
// 12. Get Remember Me preference
// 13. Mask API key for UI display
// 14. Migrate unencrypted key to encrypted storage
// 15. getApiKeyWithMigration performs automatic migration

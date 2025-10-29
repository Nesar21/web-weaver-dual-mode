// VERSION: v1.0.0 | LAST UPDATED: 2025-10-26 | FEATURE: Settings Storage Management

/**
 * Settings Storage Management
 * Handles loading, saving, and merging user settings with defaults
 * Provides specialized getters/setters for common settings
 */

import { get, set, STORAGE_TYPE } from './storage-manager.js';
import { getDefaultsConfig } from '../../utils/config-loader.js';
import { validateSettings } from '../../utils/validators.js';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('SettingsStorage');

/**
 * Settings storage key
 */
const SETTINGS_KEY = 'user_settings';

/**
 * Load user settings, merged with defaults
 * @returns {Promise<Object>} Complete settings object
 */
export async function loadSettings() {
  try {
    // Load defaults
    const defaults = await getDefaultsConfig();

    // Load user settings
    const userSettings = await get(SETTINGS_KEY, STORAGE_TYPE.LOCAL);

    if (!userSettings) {
      logger.info('No user settings found, using defaults');
      return defaults;
    }

    // Deep merge user settings with defaults
    const merged = deepMerge(defaults, userSettings);

    logger.debug('Settings loaded and merged');
    return merged;

  } catch (error) {
    logger.error('Failed to load settings', error);
    // Return defaults on error
    return await getDefaultsConfig();
  }
}

/**
 * Save user settings
 * @param {Object} settings - Settings object to save
 * @returns {Promise<Object>} Result {success: boolean, error: string|null}
 */
export async function saveSettings(settings) {
  try {
    // Validate settings
    const validation = validateSettings(settings);
    if (!validation.valid) {
      logger.warn('Settings validation failed', validation.errors);
      return {
        success: false,
        error: validation.errors.join(', ')
      };
    }

    // Save settings
    await set(SETTINGS_KEY, settings, STORAGE_TYPE.LOCAL);

    logger.info('Settings saved successfully');
    return {
      success: true,
      error: null
    };

  } catch (error) {
    logger.error('Failed to save settings', error);
    return {
      success: false,
      error: `Failed to save settings: ${error.message}`
    };
  }
}

/**
 * Update specific setting value
 * @param {string} path - Setting path (e.g., 'extraction.mode' or 'ui.theme')
 * @param {any} value - New value
 * @returns {Promise<Object>} Result {success: boolean, error: string|null}
 */
export async function updateSetting(path, value) {
  try {
    const settings = await loadSettings();

    // Set value at path
    setNestedValue(settings, path, value);

    // Save updated settings
    return await saveSettings(settings);

  } catch (error) {
    logger.error('Failed to update setting', error, { path, value });
    return {
      success: false,
      error: `Failed to update setting: ${error.message}`
    };
  }
}

/**
 * Get specific setting value
 * @param {string} path - Setting path (e.g., 'extraction.mode')
 * @returns {Promise<any>} Setting value or null if not found
 */
export async function getSetting(path) {
  try {
    const settings = await loadSettings();
    return getNestedValue(settings, path);
  } catch (error) {
    logger.error('Failed to get setting', error, { path });
    return null;
  }
}

/**
 * Reset settings to defaults
 * @returns {Promise<Object>} Result {success: boolean, error: string|null}
 */
export async function resetSettings() {
  try {
    const defaults = await getDefaultsConfig();
    await set(SETTINGS_KEY, defaults, STORAGE_TYPE.LOCAL);

    logger.info('Settings reset to defaults');
    return {
      success: true,
      error: null
    };

  } catch (error) {
    logger.error('Failed to reset settings', error);
    return {
      success: false,
      error: `Failed to reset settings: ${error.message}`
    };
  }
}

/**
 * Get AI provider settings
 * @returns {Promise<Object>} AI provider settings
 */
export async function getAIProviderSettings() {
  const settings = await loadSettings();
  return settings.ai_provider || {};
}

/**
 * Update AI provider settings
 * @param {Object} providerSettings - New provider settings
 * @returns {Promise<Object>} Result {success: boolean, error: string|null}
 */
export async function updateAIProviderSettings(providerSettings) {
  const settings = await loadSettings();
  settings.ai_provider = { ...settings.ai_provider, ...providerSettings };
  return await saveSettings(settings);
}

/**
 * Get extraction settings
 * @returns {Promise<Object>} Extraction settings
 */
export async function getExtractionSettings() {
  const settings = await loadSettings();
  return settings.extraction || {};
}

/**
 * Update extraction settings
 * @param {Object} extractionSettings - New extraction settings
 * @returns {Promise<Object>} Result {success: boolean, error: string|null}
 */
export async function updateExtractionSettings(extractionSettings) {
  const settings = await loadSettings();
  settings.extraction = { ...settings.extraction, ...extractionSettings };
  return await saveSettings(settings);
}

/**
 * Get smart features settings
 * @returns {Promise<Object>} Smart features settings
 */
export async function getSmartFeaturesSettings() {
  const settings = await loadSettings();
  return settings.smart_features || {};
}

/**
 * Update smart features settings
 * @param {Object} smartSettings - New smart features settings
 * @returns {Promise<Object>} Result {success: boolean, error: string|null}
 */
export async function updateSmartFeaturesSettings(smartSettings) {
  const settings = await loadSettings();
  settings.smart_features = { ...settings.smart_features, ...smartSettings };
  return await saveSettings(settings);
}

/**
 * Get UI settings
 * @returns {Promise<Object>} UI settings
 */
export async function getUISettings() {
  const settings = await loadSettings();
  return settings.ui || {};
}

/**
 * Update UI settings
 * @param {Object} uiSettings - New UI settings
 * @returns {Promise<Object>} Result {success: boolean, error: string|null}
 */
export async function updateUISettings(uiSettings) {
  const settings = await loadSettings();
  settings.ui = { ...settings.ui, ...uiSettings };
  return await saveSettings(settings);
}

/**
 * Get export settings
 * @returns {Promise<Object>} Export settings
 */
export async function getExportSettings() {
  const settings = await loadSettings();
  return settings.export || {};
}

/**
 * Update export settings
 * @param {Object} exportSettings - New export settings
 * @returns {Promise<Object>} Result {success: boolean, error: string|null}
 */
export async function updateExportSettings(exportSettings) {
  const settings = await loadSettings();
  settings.export = { ...settings.export, ...exportSettings };
  return await saveSettings(settings);
}

/**
 * Mark onboarding as completed
 * @returns {Promise<Object>} Result {success: boolean, error: string|null}
 */
export async function markOnboardingComplete() {
  return await updateSetting('extension.onboarding_completed', true);
}

/**
 * Check if onboarding is completed
 * @returns {Promise<boolean>} True if onboarding completed
 */
export async function isOnboardingComplete() {
  const value = await getSetting('extension.onboarding_completed');
  return value === true;
}

/**
 * Accept privacy policy
 * @returns {Promise<Object>} Result {success: boolean, error: string|null}
 */
export async function acceptPrivacyPolicy() {
  return await updateSetting('extension.privacy_accepted', true);
}

/**
 * Check if privacy policy is accepted
 * @returns {Promise<boolean>} True if privacy accepted
 */
export async function isPrivacyAccepted() {
  const value = await getSetting('extension.privacy_accepted');
  return value === true;
}

/**
 * Deep merge two objects
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} Merged object
 * @private
 */
function deepMerge(target, source) {
  const result = { ...target };

  for (const key in source) {
    if (source[key] instanceof Object && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
}

/**
 * Get nested value from object using dot notation path
 * @param {Object} obj - Object to query
 * @param {string} path - Dot notation path (e.g., 'ui.theme')
 * @returns {any} Value or null if not found
 * @private
 */
function getNestedValue(obj, path) {
  const parts = path.split('.');
  let current = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return null;
    }
    current = current[part];
  }

  return current !== undefined ? current : null;
}

/**
 * Set nested value in object using dot notation path
 * @param {Object} obj - Object to modify
 * @param {string} path - Dot notation path
 * @param {any} value - Value to set
 * @private
 */
function setNestedValue(obj, path, value) {
  const parts = path.split('.');
  let current = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current) || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part];
  }

  current[parts[parts.length - 1]] = value;
}

// TEST SCENARIOS:
// 1. Load settings with no user data (returns defaults)
// 2. Load settings with user data (merges with defaults)
// 3. Save valid settings
// 4. Save invalid settings (validation fails)
// 5. Update specific setting using path (e.g., 'ui.theme')
// 6. Get specific setting using path
// 7. Reset settings to defaults
// 8. Get/update AI provider settings
// 9. Get/update extraction settings
// 10. Get/update smart features settings
// 11. Get/update UI settings
// 12. Get/update export settings
// 13. Mark onboarding complete and check status
// 14. Accept privacy policy and check status
// 15. Deep merge preserves nested objects
// 16. Nested value getter/setter with deep paths

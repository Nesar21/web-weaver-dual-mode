// VERSION: v1.0.2 | FIXED FOR 'available' STATUS | 2025-10-29

/**
 * AI Provider Manager
 * Routes requests to Chrome Built-in AI or Gemini Cloud API
 * Manages provider selection, availability checking, and model switching
 */

import { getModelsConfig } from '../../utils/config-loader.js';
import { getAIProviderSettings, updateAIProviderSettings } from '../storage/settings-storage.js';
import { createLogger } from '../../utils/logger.js';
import { showChromeAIUnavailable } from '../error-handling/notifications.js';

const logger = createLogger('ProviderManager');

/**
 * Provider IDs
 * @enum {string}
 */
export const PROVIDER_ID = {
  CHROME_AI: 'chrome_ai',
  GEMINI_CLOUD: 'gemini_cloud'
};

/**
 * Check if Chrome Built-in AI is available
 * @returns {Promise} Result {available: boolean, apis: Object, reason: string|null}
 */
export async function checkChromeAIAvailability() {
  try {
    const availability = {
      available: false,
      apis: {
        languageModel: false,
        summarizer: false,
        translator: false,
        languageDetector: false
      },
      reason: null
    };

    // ✅ FIXED: Check self.LanguageModel
    if (typeof self === 'undefined' || !self.LanguageModel) {
      availability.reason = 'Chrome Built-in AI requires Chrome 120+ with flags enabled.';
      logger.warn('Chrome AI unavailable', availability.reason);
      return availability;
    }

    // Test all 6 APIs from your console pattern
    const apis = [
      { name: 'languageModel', cls: self.LanguageModel, args: [], key: 'languageModel' },
      { name: 'summarizer', cls: self.Summarizer, args: [], key: 'summarizer' },
      { name: 'translator', cls: self.Translator, args: [{ sourceLanguage: 'en', targetLanguage: 'es' }], key: 'translator' },
      { name: 'languageDetector', cls: self.LanguageDetector, args: [], key: 'languageDetector' }
    ];

    for (const api of apis) {
      if (!api.cls) {
        availability.apis[api.key] = false;
        continue;
      }

      try {
        const avail = await api.cls.availability?.(...api.args);
        // ✅ FIXED: Check for 'available' not 'readily'
        availability.apis[api.key] = (avail === 'available');
        logger.info(`${api.name} availability:`, avail);
      } catch (error) {
        availability.apis[api.key] = false;
        logger.warn(`${api.name} check failed:`, error);
      }
    }

    // Consider available if LanguageModel works
    availability.available = availability.apis.languageModel;

    if (!availability.available) {
      availability.reason = 'Chrome AI APIs not ready. Ensure Chrome 120+ with flags enabled and model downloaded.';
    }

    logger.info('Chrome AI availability check complete', availability);
    return availability;

  } catch (error) {
    logger.error('Chrome AI availability check failed', error);
    return {
      available: false,
      apis: {
        languageModel: false,
        summarizer: false,
        translator: false,
        languageDetector: false
      },
      reason: `Error checking Chrome AI: ${error.message}`
    };
  }
}

/**
 * Get current AI provider from settings
 * @returns {Promise} Provider ID
 */
export async function getCurrentProvider() {
  const settings = await getAIProviderSettings();
  return settings.selected_provider || PROVIDER_ID.CHROME_AI;
}

/**
 * Get current model for provider
 * @param {string} providerId - Provider ID
 * @returns {Promise} Model ID
 */
export async function getCurrentModel(providerId) {
  const settings = await getAIProviderSettings();
  const modelMap = settings.selected_model || {};
  
  // Get model from settings or use default
  if (modelMap[providerId]) {
    return modelMap[providerId];
  }
  
  // Load default from config
  const config = await getModelsConfig();
  return config.default_model[providerId];
}

/**
 * Set AI provider
 * @param {string} providerId - Provider ID to use
 * @returns {Promise} Result {success: boolean, error: string|null}
 */
export async function setProvider(providerId) {
  try {
    // Validate provider
    if (providerId !== PROVIDER_ID.CHROME_AI && providerId !== PROVIDER_ID.GEMINI_CLOUD) {
      return {
        success: false,
        error: `Invalid provider ID: ${providerId}`
      };
    }
    
    // Check Chrome AI availability if selecting it
    if (providerId === PROVIDER_ID.CHROME_AI) {
      const availability = await checkChromeAIAvailability();
      if (!availability.available) {
        logger.warn('Chrome AI not available, cannot switch to it', availability.reason);
        showChromeAIUnavailable();
        return {
          success: false,
          error: availability.reason
        };
      }
    }
    
    // Update settings
    const result = await updateAIProviderSettings({
      selected_provider: providerId
    });
    
    if (result.success) {
      logger.info(`Provider switched to: ${providerId}`);
    }
    
    return result;
    
  } catch (error) {
    logger.error('Failed to set provider', error, { providerId });
    return {
      success: false,
      error: `Failed to set provider: ${error.message}`
    };
  }
}

/**
 * Set model for provider
 * @param {string} providerId - Provider ID
 * @param {string} modelId - Model ID to use
 * @returns {Promise} Result {success: boolean, error: string|null}
 */
export async function setModel(providerId, modelId) {
  try {
    const settings = await getAIProviderSettings();
    const modelMap = settings.selected_model || {};
    modelMap[providerId] = modelId;
    
    const result = await updateAIProviderSettings({
      selected_model: modelMap
    });
    
    if (result.success) {
      logger.info(`Model set for ${providerId}: ${modelId}`);
    }
    
    return result;
    
  } catch (error) {
    logger.error('Failed to set model', error, { providerId, modelId });
    return {
      success: false,
      error: `Failed to set model: ${error.message}`
    };
  }
}

/**
 * Get provider information
 * @param {string} providerId - Provider ID
 * @returns {Promise} Provider info or null
 */
export async function getProviderInfo(providerId) {
  try {
    const config = await getModelsConfig();
    return config.providers[providerId] || null;
  } catch (error) {
    logger.error('Failed to get provider info', error, { providerId });
    return null;
  }
}

/**
 * Get available models for provider
 * @param {string} providerId - Provider ID
 * @returns {Promise<Array>} Array of model objects
 */
export async function getAvailableModels(providerId) {
  try {
    const providerInfo = await getProviderInfo(providerId);
    if (!providerInfo || !providerInfo.models) {
      return [];
    }
    
    return Object.values(providerInfo.models);
  } catch (error) {
    logger.error('Failed to get available models', error, { providerId });
    return [];
  }
}

/**
 * Get provider status
 * @param {string} providerId - Provider ID
 * @returns {Promise} Status {available: boolean, currentModel: string, reason: string|null}
 */
export async function getProviderStatus(providerId) {
  try {
    if (providerId === PROVIDER_ID.CHROME_AI) {
      const availability = await checkChromeAIAvailability();
      const currentModel = await getCurrentModel(providerId);
      return {
        available: availability.available,
        currentModel,
        apis: availability.apis,
        reason: availability.reason
      };
    } else if (providerId === PROVIDER_ID.GEMINI_CLOUD) {
      const currentModel = await getCurrentModel(providerId);
      // Gemini Cloud always available (if API key configured)
      return {
        available: true,
        currentModel,
        reason: null
      };
    }
    
    return {
      available: false,
      currentModel: null,
      reason: 'Unknown provider'
    };
  } catch (error) {
    logger.error('Failed to get provider status', error, { providerId });
    return {
      available: false,
      currentModel: null,
      reason: `Status check error: ${error.message}`
    };
  }
}

/**
 * Switch to fallback provider
 * @returns {Promise} Result {success: boolean, provider: string, error: string|null}
 */
export async function switchToFallback() {
  try {
    const current = await getCurrentProvider();
    
    // Determine fallback
    const fallback = current === PROVIDER_ID.CHROME_AI
      ? PROVIDER_ID.GEMINI_CLOUD
      : PROVIDER_ID.CHROME_AI;
    
    logger.info(`Switching to fallback provider: ${fallback}`);
    
    const result = await setProvider(fallback);
    if (result.success) {
      return {
        success: true,
        provider: fallback,
        error: null
      };
    } else {
      return {
        success: false,
        provider: current,
        error: result.error
      };
    }
    
  } catch (error) {
    logger.error('Failed to switch to fallback', error);
    return {
      success: false,
      provider: null,
      error: `Fallback switch failed: ${error.message}`
    };
  }
}

/**
 * Auto-select best available provider
 * @returns {Promise} Result {provider: string, model: string, reason: string}
 */
export async function autoSelectProvider() {
  try {
    // Check Chrome AI first (free, local)
    const chromeAI = await checkChromeAIAvailability();
    if (chromeAI.available) {
      await setProvider(PROVIDER_ID.CHROME_AI);
      const model = await getCurrentModel(PROVIDER_ID.CHROME_AI);
      logger.info('Auto-selected Chrome AI');
      return {
        provider: PROVIDER_ID.CHROME_AI,
        model,
        reason: 'Chrome Built-in AI available and ready'
      };
    }
    
    // Fallback to Gemini Cloud
    await setProvider(PROVIDER_ID.GEMINI_CLOUD);
    const model = await getCurrentModel(PROVIDER_ID.GEMINI_CLOUD);
    logger.info('Auto-selected Gemini Cloud (Chrome AI unavailable)');
    return {
      provider: PROVIDER_ID.GEMINI_CLOUD,
      model,
      reason: chromeAI.reason || 'Chrome AI unavailable'
    };
    
  } catch (error) {
    logger.error('Auto-select provider failed', error);
    return {
      provider: PROVIDER_ID.GEMINI_CLOUD,
      model: 'gemini-2.0-flash-lite',
      reason: `Auto-select error: ${error.message}`
    };
  }
}

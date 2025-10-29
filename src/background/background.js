// VERSION: v1.0.0 | LAST UPDATED: 2025-10-27 | FEATURE: Background Service Worker

/**
 * Background Service Worker
 * Handles extension lifecycle, message routing, and background tasks
 * Coordinates between popup, content scripts, and core functionality
 */

// ===================================
// ALL STATIC IMPORTS AT THE TOP
// (No dynamic import() allowed in service workers!)
// ===================================

import { initLogger, createLogger } from '../utils/logger.js';
import { getAllConfigs } from '../utils/config-loader.js';
import { loadSettings, saveSettings, markOnboardingComplete } from '../core/storage/settings-storage.js';
import { cleanupOldData } from '../core/storage/storage-manager.js';
import { migrateToEncrypted, saveApiKey, hasApiKey, getValidationStatus } from '../core/storage/api-key-storage.js';
import { extractFromCurrentTab, exportAsCSV, applySmartFeatures } from '../core/extraction/extraction-engine.js';
import { autoSelectProvider, getProviderStatus, setProvider, setModel, getCurrentProvider, getCurrentModel } from '../core/ai-providers/provider-manager.js';
import { getRateLimitStatus } from '../core/rate-limiting/rate-limiter.js';

const logger = createLogger('Background');

/**
 * Extension installation handler
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  try {
    logger.info(`Extension installed: ${details.reason}`);
    
    if (details.reason === 'install') {
      await handleFirstInstall();
    } else if (details.reason === 'update') {
      await handleUpdate(details.previousVersion);
    }
  } catch (error) {
    logger.error('Installation handler failed', error);
  }
});

/**
 * Extension startup handler
 */
chrome.runtime.onStartup.addListener(async () => {
  try {
    logger.info('Extension started');
    await initialize();
  } catch (error) {
    logger.error('Startup handler failed', error);
  }
});

/**
 * Handle first installation
 */
async function handleFirstInstall() {
  logger.info('First installation detected');
  
  // Load default settings
  const settings = await loadSettings();
  
  // Initialize logger with settings
  initLogger({
    log_level: settings.advanced.log_level,
    debug_mode: settings.advanced.debug_mode
  });
  
  // Auto-select best available provider
  await autoSelectProvider();
  
  // Open onboarding page
  chrome.tabs.create({
    url: chrome.runtime.getURL('src/ui/onboarding/onboarding.html')
  });
  
  logger.info('First install setup complete');
}

/**
 * Handle extension update
 */
async function handleUpdate(previousVersion) {
  logger.info(`Extension updated from ${previousVersion}`);
  
  // Migrate API keys to encrypted storage
  await migrateToEncrypted();
  
  // Clean up old data
  await cleanupOldData();
  
  logger.info('Update complete');
}

/**
 * Initialize background service
 */
async function initialize() {
  try {
    // Load all configurations
    await getAllConfigs();
    
    // Load settings and initialize logger
    const settings = await loadSettings();
    initLogger({
      log_level: settings.advanced.log_level,
      debug_mode: settings.advanced.debug_mode
    });
    
    // Cleanup old data
    await cleanupOldData();
    
    logger.info('Background service initialized');
  } catch (error) {
    logger.error('Initialization failed', error);
  }
}

/**
 * Message handler
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle message asynchronously
  handleMessage(message, sender)
    .then(sendResponse)
    .catch(error => {
      logger.error('Message handler error', error);
      sendResponse({
        success: false,
        error: error.message
      });
    });
  
  // Return true to indicate async response
  return true;
});

/**
 * Handle incoming messages
 */
async function handleMessage(message, sender) {
  const { type, data } = message;
  
  logger.debug(`Message received: ${type}`);
  
  switch (type) {
    case 'EXTRACT':
      return await handleExtractMessage(data);
      
    case 'GET_SETTINGS':
      return await handleGetSettingsMessage();
      
    case 'UPDATE_SETTINGS':
      return await handleUpdateSettingsMessage(data);
      
    case 'SAVE_API_KEY':
      return await handleSaveApiKeyMessage(data);
      
    case 'GET_API_KEY_STATUS':
      return await handleGetApiKeyStatusMessage();
      
    case 'GET_PROVIDER_STATUS':
      return await handleGetProviderStatusMessage(data);
      
    case 'SWITCH_PROVIDER':
      return await handleSwitchProviderMessage(data);
      
    case 'SWITCH_MODEL':
      return await handleSwitchModelMessage(data);
      
    case 'GET_RATE_LIMIT_STATUS':
      return await handleGetRateLimitStatusMessage(data);
      
    case 'EXPORT_CSV':
      return await handleExportCSVMessage(data);
      
    case 'APPLY_SMART_FEATURES':
      return await handleSmartFeaturesMessage(data);
      
    case 'PING':
      return { success: true, message: 'pong' };
      
    default:
      logger.warn(`Unknown message type: ${type}`);
      return { success: false, error: 'Unknown message type' };
  }
}

/**
 * Handle extraction request
 */
async function handleExtractMessage(data) {
  try {
    logger.info('Starting extraction');
    const result = await extractFromCurrentTab(data.options);
    return { success: true, result };
  } catch (error) {
    logger.error('Extraction failed', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle get settings request
 */
async function handleGetSettingsMessage() {
  try {
    const settings = await loadSettings();
    return { success: true, settings };
  } catch (error) {
    logger.error('Failed to get settings', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle update settings request
 */
async function handleUpdateSettingsMessage(data) {
  try {
    const result = await saveSettings(data.settings);
    
    // Reinitialize logger if logging settings changed
    if (data.settings.advanced) {
      initLogger({
        log_level: data.settings.advanced.log_level,
        debug_mode: data.settings.advanced.debug_mode
      });
    }
    
    return result;
  } catch (error) {
    logger.error('Failed to update settings', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle save API key request
 */
async function handleSaveApiKeyMessage(data) {
  try {
    const result = await saveApiKey(data.apiKey, data.rememberMe);
    return result;
  } catch (error) {
    logger.error('Failed to save API key', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle get API key status request
 */
async function handleGetApiKeyStatusMessage() {
  try {
    const exists = await hasApiKey();
    const validation = await getValidationStatus();
    return { 
      success: true, 
      exists, 
      validation 
    };
  } catch (error) {
    logger.error('Failed to get API key status', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle get provider status request
 */
async function handleGetProviderStatusMessage(data) {
  try {
    const status = await getProviderStatus(data.providerId);
    return { success: true, status };
  } catch (error) {
    logger.error('Failed to get provider status', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle switch provider request
 */
async function handleSwitchProviderMessage(data) {
  try {
    logger.info(`Switching to provider: ${data.providerId}`);
    const result = await setProvider(data.providerId);
    return result;
  } catch (error) {
    logger.error('Failed to switch provider', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle switch model request
 */
async function handleSwitchModelMessage(data) {
  try {
    logger.info(`Switching to model: ${data.modelId}`);
    const result = await setModel(data.providerId, data.modelId);
    return result;
  } catch (error) {
    logger.error('Failed to switch model', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle get rate limit status request
 */
async function handleGetRateLimitStatusMessage(data) {
  try {
    const status = await getRateLimitStatus(data.modelId);
    return { success: true, status };
  } catch (error) {
    logger.error('Failed to get rate limit status', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle export CSV request
 */
async function handleExportCSVMessage(data) {
  try {
    const provider = await getCurrentProvider();
    const model = await getCurrentModel(provider);
    const csv = await exportAsCSV(data.data, data.mode, provider, model);
    return { success: true, csv };
  } catch (error) {
    logger.error('Failed to export CSV', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle apply smart features request
 */
async function handleSmartFeaturesMessage(data) {
  try {
    const provider = await getCurrentProvider();
    const model = await getCurrentModel(provider);
    const processed = await applySmartFeatures(data.data, data.options, provider, model);
    return { success: true, data: processed };
  } catch (error) {
    logger.error('Failed to apply smart features', error);
    return { success: false, error: error.message };
  }
}

// Initialize on service worker start
initialize();

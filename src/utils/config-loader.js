// VERSION: v1.0.0 | LAST UPDATED: 2025-10-26 | FEATURE: Configuration Loader Utility

/**
 * Configuration Loader Utility
 * Loads and caches configuration files from config/ directory
 * Provides type-safe access to all configuration data
 */

/**
 * Configuration cache to avoid repeated file loads
 * @type {Map<string, Object>}
 */
const configCache = new Map();

/**
 * Base path for configuration files
 * @type {string}
 */
const CONFIG_BASE_PATH = chrome.runtime.getURL('config');

/**
 * Available configuration files
 * @type {Object}
 */
export const CONFIG_FILES = {
  MODELS: 'models.json',
  RATE_LIMITS: 'rate-limits.json',
  ENDPOINTS: 'endpoints.json',
  PROMPTS: 'prompts.json',
  DEFAULTS: 'defaults.json'
};

/**
 * Load a configuration file from config/ directory
 * @param {string} filename - Name of the config file to load
 * @returns {Promise<Object>} Parsed configuration object
 * @throws {Error} If file load or parse fails
 */
async function loadConfigFile(filename) {
  try {
    const url = `${CONFIG_BASE_PATH}/${filename}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to load config file: ${filename} (Status: ${response.status})`);
    }
    
    const text = await response.text();
    const config = JSON.parse(text);
    
    return config;
  } catch (error) {
    console.error(`[ConfigLoader] Error loading ${filename}:`, error);
    throw new Error(`Configuration load failed: ${filename} - ${error.message}`);
  }
}

/**
 * Get configuration with caching
 * @param {string} configKey - Key from CONFIG_FILES
 * @param {boolean} forceReload - Force reload from file (bypass cache)
 * @returns {Promise<Object>} Configuration object
 */
export async function getConfig(configKey, forceReload = false) {
  const filename = CONFIG_FILES[configKey];
  
  if (!filename) {
    throw new Error(`Invalid config key: ${configKey}`);
  }
  
  // Return cached config if available and not forcing reload
  if (!forceReload && configCache.has(filename)) {
    return configCache.get(filename);
  }
  
  // Load from file
  const config = await loadConfigFile(filename);
  
  // Cache for future use
  configCache.set(filename, config);
  
  return config;
}

/**
 * Load models configuration
 * @returns {Promise<Object>} Models configuration
 */
export async function getModelsConfig() {
  return await getConfig('MODELS');
}

/**
 * Load rate limits configuration
 * @returns {Promise<Object>} Rate limits configuration
 */
export async function getRateLimitsConfig() {
  return await getConfig('RATE_LIMITS');
}

/**
 * Load API endpoints configuration
 * @returns {Promise<Object>} Endpoints configuration
 */
export async function getEndpointsConfig() {
  return await getConfig('ENDPOINTS');
}

/**
 * Load prompts configuration
 * @returns {Promise<Object>} Prompts configuration
 */
export async function getPromptsConfig() {
  return await getConfig('PROMPTS');
}

/**
 * Load default settings configuration
 * @returns {Promise<Object>} Defaults configuration
 */
export async function getDefaultsConfig() {
  return await getConfig('DEFAULTS');
}

/**
 * Load all configurations at once
 * @returns {Promise<Object>} Object with all configurations
 */
export async function getAllConfigs() {
  const [models, rateLimits, endpoints, prompts, defaults] = await Promise.all([
    getModelsConfig(),
    getRateLimitsConfig(),
    getEndpointsConfig(),
    getPromptsConfig(),
    getDefaultsConfig()
  ]);
  
  return {
    models,
    rateLimits,
    endpoints,
    prompts,
    defaults
  };
}

/**
 * Clear configuration cache
 * Useful for development or when configs are updated
 */
export function clearConfigCache() {
  configCache.clear();
}

/**
 * Get specific model configuration by provider and model ID
 * @param {string} providerId - Provider ID (chrome_ai or gemini_cloud)
 * @param {string} modelId - Model ID
 * @returns {Promise<Object|null>} Model configuration or null if not found
 */
export async function getModelConfig(providerId, modelId) {
  const config = await getModelsConfig();
  const provider = config.providers[providerId];
  
  if (!provider) {
    return null;
  }
  
  return provider.models[modelId] || null;
}

/**
 * Get rate limit configuration for specific model
 * @param {string} modelId - Model ID
 * @returns {Promise<Object|null>} Rate limit config or null if not found
 */
export async function getRateLimitForModel(modelId) {
  const config = await getRateLimitsConfig();
  const geminiConfig = config.providers.gemini_cloud;
  
  if (!geminiConfig || !geminiConfig.models) {
    return null;
  }
  
  return geminiConfig.models[modelId] || null;
}

/**
 * Get prompt template for content type and extraction mode
 * @param {string} contentType - Content type (products, articles, jobs, posts, generic)
 * @param {string} mode - Extraction mode (extract_all or extract_main)
 * @returns {Promise<string|null>} Prompt template or null if not found
 */
export async function getPromptTemplate(contentType, mode) {
  const config = await getPromptsConfig();
  
  if (contentType === 'generic') {
    return config.generic[`${mode}_prompt`] || null;
  }
  
  const contentConfig = config.content_types[contentType];
  if (!contentConfig) {
    return null;
  }
  
  return contentConfig[`${mode}_prompt`] || null;
}

/**
 * Get smart feature prompt by feature name
 * @param {string} featureName - Feature name (deduplication, csv_formatting, comparisons, recommendations, trends)
 * @returns {Promise<string|null>} Feature prompt or null if not found
 */
export async function getSmartFeaturePrompt(featureName) {
  const config = await getPromptsConfig();
  const feature = config.smart_features[featureName];
  
  return feature?.prompt || null;
}

/**
 * Get quality scoring prompt
 * @returns {Promise<string>} Quality scoring prompt
 */
export async function getQualityScoringPrompt() {
  const config = await getPromptsConfig();
  return config.quality_scoring.prompt;
}

// TEST SCENARIOS:
// 1. Load all configs on extension startup
// 2. Cache hit on second load (verify no network request)
// 3. Force reload bypasses cache
// 4. Invalid config key throws error
// 5. Missing config file throws descriptive error
// 6. Get specific model config (chrome_ai/gemini_nano)
// 7. Get rate limit for gemini-2.0-flash-lite
// 8. Get prompt template for products/extract_all
// 9. Get smart feature prompt for deduplication
// 10. Clear cache and verify reload

// VERSION: v1.0.0 | LAST UPDATED: 2025-10-26 | FEATURE: Gemini Cloud API Provider

/**
 * Gemini Cloud API Provider
 * Integrates with Google's Gemini API for cloud-based AI processing
 * Supports three models: gemini-2.0-flash-lite, gemini-2.0-flash-exp, gemini-1.5-pro
 */

import { getEndpointsConfig, getModelsConfig } from '../../../utils/config-loader.js';
import { getApiKey } from '../../storage/api-key-storage.js';
import { createLogger, logAIProvider } from '../../../utils/logger.js';
import { handleAIProviderError } from '../../error-handling/error-handler.js';
import { checkRateLimit, recordRequest } from '../../rate-limiting/rate-limiter.js';
import { validateGeminiApiKey } from '../../../utils/validators.js';
import { parseJSON } from '../../../utils/json-parser.js';

const logger = createLogger('GeminiCloud');

/**
 * Generate content using Gemini API
 * @param {string} modelId - Model ID (gemini-2.0-flash-lite, gemini-2.0-flash-exp, gemini-1.5-pro)
 * @param {Array<Object>} contents - Content array (text and/or images)
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} Generation result {text: string, candidates: Array}
 */
export async function generateContent(modelId, contents, options = {}) {
  const startTime = Date.now();

  try {
    logger.info(`Generating content with ${modelId}`);

    // Check rate limits
    const rateLimitCheck = await checkRateLimit(modelId);
    if (!rateLimitCheck.allowed) {
      const error = new Error(rateLimitCheck.reason);
      error.waitTime = rateLimitCheck.waitTime;
      error.limitType = rateLimitCheck.limitType;
      throw error;
    }

    // Get API key
    const apiKey = await getApiKey();
    if (!apiKey) {
      throw new Error('API key not configured');
    }

    // Validate API key
    const validation = validateGeminiApiKey(apiKey);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Get endpoint configuration
    const endpointsConfig = await getEndpointsConfig();
    const endpoint = endpointsConfig.gemini_cloud.endpoints.generate_content;

    // Build URL
    const url = buildApiUrl(endpoint, modelId, apiKey);

    // Build request body
    const requestBody = buildRequestBody(contents, options);

    // Make API request
    const response = await fetch(url, {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    // Record request for rate limiting
    await recordRequest(modelId);

    // Handle response
    const responseTime = Date.now() - startTime;
    logAIProvider('gemini_cloud', 'response', { modelId, responseTime });

    if (!response.ok) {
      await handleApiError(response, modelId);
    }

    const data = await response.json();

    // Extract text from response
    const text = extractTextFromResponse(data);

    logger.info(`Content generated successfully in ${responseTime}ms`);

    return {
      text,
      candidates: data.candidates || [],
      responseTime
    };

  } catch (error) {
    const responseTime = Date.now() - startTime;
    logAIProvider('gemini_cloud', 'error', { modelId, responseTime, error: error.message });
    
    const handled = handleAIProviderError(error, 'gemini_cloud');
    logger.error('Content generation failed', error);
    
    throw new Error(handled.userMessage);
  }
}

/**
 * Generate content with vision (multimodal)
 * @param {string} modelId - Model ID
 * @param {string} text - Text prompt
 * @param {string} imageDataUrl - Image data URL (base64)
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} Generation result
 */
export async function generateContentWithVision(modelId, text, imageDataUrl, options = {}) {
  try {
    logger.info(`Generating multimodal content with ${modelId}`);

    // Extract base64 data from data URL
    const base64Data = extractBase64FromDataUrl(imageDataUrl);
    const mimeType = extractMimeTypeFromDataUrl(imageDataUrl);

    // Build contents with text and image
    const contents = [{
      parts: [
        { text },
        {
          inline_data: {
            mime_type: mimeType,
            data: base64Data
          }
        }
      ]
    }];

    return await generateContent(modelId, contents, options);

  } catch (error) {
    logger.error('Multimodal content generation failed', error);
    throw error;
  }
}

/**
 * Extract structured data using Gemini
 * @param {string} modelId - Model ID
 * @param {string} html - HTML content
 * @param {string} prompt - Extraction prompt
 * @param {Object} options - Extraction options
 * @returns {Promise<Object>} Extraction result {data: any, confidence: number}
 */
export async function extractData(modelId, html, prompt, options = {}) {
  try {
    logger.info(`Extracting data with ${modelId}`);

    // Build full prompt
    const fullPrompt = `${prompt}\n\nHTML:\n${html}`;

    // Build contents
    const contents = [{
      parts: [{ text: fullPrompt }]
    }];

    // Generate with lower temperature for structured output
    const result = await generateContent(modelId, contents, {
      ...options,
      temperature: options.temperature || 0.3
    });

    // Parse JSON response
    const parseResult = parseJSON(result.text);

    if (!parseResult.success) {
      throw new Error(`Failed to parse JSON response: ${parseResult.error}`);
    }

    logger.info('Data extracted successfully');

    return {
      data: parseResult.data,
      confidence: calculateConfidence(result),
      responseTime: result.responseTime
    };

  } catch (error) {
    logger.error('Data extraction failed', error);
    throw error;
  }
}

/**
 * Extract data with vision (multimodal)
 * @param {string} modelId - Model ID
 * @param {string} html - HTML content
 * @param {string} imageDataUrl - Screenshot data URL
 * @param {string} prompt - Extraction prompt
 * @param {Object} options - Extraction options
 * @returns {Promise<Object>} Extraction result
 */
export async function extractDataWithVision(modelId, html, imageDataUrl, prompt, options = {}) {
  try {
    logger.info(`Extracting data with vision using ${modelId}`);

    // Build full prompt
    const fullPrompt = `${prompt}\n\nHTML:\n${html}\n\nSCREENSHOT: Provided as image input`;

    // Generate with vision
    const result = await generateContentWithVision(modelId, fullPrompt, imageDataUrl, {
      ...options,
      temperature: options.temperature || 0.3
    });

    // Parse JSON response
    const parseResult = parseJSON(result.text);

    if (!parseResult.success) {
      throw new Error(`Failed to parse JSON response: ${parseResult.error}`);
    }

    logger.info('Multimodal data extracted successfully');

    return {
      data: parseResult.data,
      confidence: calculateConfidence(result),
      responseTime: result.responseTime
    };

  } catch (error) {
    logger.error('Multimodal data extraction failed', error);
    throw error;
  }
}
/**
 * Calculate quality score using Gemini
 * @param {string} modelId - Model ID
 * @param {Object} extractedData - Extracted data to score
 * @param {string} prompt - Quality scoring prompt
 * @returns {Promise<Object>} Quality score result
 */
export async function calculateQualityScore(modelId, extractedData, prompt) {
  try {
    logger.info(`Calculating quality score with ${modelId}`);

    // Build full prompt
    const fullPrompt = `${prompt}\n\nEXTRACTED DATA:\n${JSON.stringify(extractedData, null, 2)}`;

    // Build contents
    const contents = [{
      parts: [{ text: fullPrompt }]
    }];

    // Generate with low temperature
    const result = await generateContent(modelId, contents, {
      temperature: 0.1
    });

    // Parse quality score response
    const parseResult = parseJSON(result.text);

    if (!parseResult.success) {
      throw new Error(`Failed to parse quality score: ${parseResult.error}`);
    }

    logger.info('Quality score calculated', parseResult.data);
    return parseResult.data;

  } catch (error) {
    logger.error('Quality score calculation failed', error);
    throw error;
  }
}

/**
 * Deduplicate items using Gemini
 * @param {string} modelId - Model ID
 * @param {Array} items - Items to deduplicate
 * @param {string} prompt - Deduplication prompt
 * @returns {Promise<Array>} Deduplicated items
 */
export async function deduplicateItems(modelId, items, prompt) {
  try {
    logger.info(`Deduplicating ${items.length} items with ${modelId}`);

    // Build full prompt
    const fullPrompt = `${prompt}\n\nITEMS:\n${JSON.stringify(items, null, 2)}`;

    // Build contents
    const contents = [{
      parts: [{ text: fullPrompt }]
    }];

    // Generate
    const result = await generateContent(modelId, contents, {
      temperature: 0.2
    });

    // Parse deduplicated array
    const parseResult = parseJSON(result.text);

    if (!parseResult.success || !Array.isArray(parseResult.data)) {
      throw new Error('Invalid deduplication response');
    }

    logger.info(`Deduplication complete: ${items.length} → ${parseResult.data.length} items`);
    return parseResult.data;

  } catch (error) {
    logger.error('Deduplication failed', error);
    throw error;
  }
}

/**
 * Format data as CSV using Gemini
 * @param {string} modelId - Model ID
 * @param {Object} data - Data to format
 * @param {string} prompt - CSV formatting prompt
 * @param {string} mode - CSV mode (standard, data_scientist, custom)
 * @returns {Promise<string>} CSV string
 */
export async function formatAsCSV(modelId, data, prompt, mode) {
  try {
    logger.info(`Formatting data as CSV (${mode}) with ${modelId}`);

    // Build full prompt with mode
    const fullPrompt = prompt
      .replace('{mode}', mode)
      .replace('{json}', JSON.stringify(data, null, 2));

    // Build contents
    const contents = [{
      parts: [{ text: fullPrompt }]
    }];

    // Generate
    const result = await generateContent(modelId, contents, {
      temperature: 0.1
    });

    // Extract CSV (may be in markdown code block)
    let csv = result.text.trim();
    
    // Remove markdown code blocks if present
    if (csv.startsWith('```')) {
        csv = csv.replace(/``````\n?/g, '');
    }

    logger.info('CSV formatted successfully');
    return csv;

  } catch (error) {
    logger.error('CSV formatting failed', error);
    throw error;
  }
}

/**
 * Generate comparisons using Gemini
 * @param {string} modelId - Model ID
 * @param {Array} items - Items to compare
 * @param {string} prompt - Comparison prompt
 * @returns {Promise<Object>} Comparison result
 */
export async function generateComparisons(modelId, items, prompt) {
  try {
    logger.info(`Generating comparisons for ${items.length} items with ${modelId}`);

    // Build full prompt
    const fullPrompt = `${prompt}\n\nITEMS:\n${JSON.stringify(items, null, 2)}`;

    // Build contents
    const contents = [{
      parts: [{ text: fullPrompt }]
    }];

    // Generate
    const result = await generateContent(modelId, contents, {
      temperature: 0.4
    });

    // Parse comparison result
    const parseResult = parseJSON(result.text);

    if (!parseResult.success) {
      throw new Error('Invalid comparison response');
    }

    logger.info('Comparisons generated successfully');
    return parseResult.data;

  } catch (error) {
    logger.error('Comparison generation failed', error);
    throw error;
  }
}

/**
 * Generate recommendations using Gemini
 * @param {string} modelId - Model ID
 * @param {Array} items - Items to recommend from
 * @param {string} context - User context for personalization
 * @param {string} prompt - Recommendation prompt
 * @returns {Promise<Object>} Recommendation result
 */
export async function generateRecommendations(modelId, items, context, prompt) {
  try {
    logger.info(`Generating recommendations with ${modelId}`);

    // Build full prompt with context
    const fullPrompt = prompt
      .replace('{context}', context)
      .replace('{items}', JSON.stringify(items, null, 2));

    // Build contents
    const contents = [{
      parts: [{ text: fullPrompt }]
    }];

    // Generate
    const result = await generateContent(modelId, contents, {
      temperature: 0.5
    });

    // Parse recommendations
    const parseResult = parseJSON(result.text);

    if (!parseResult.success) {
      throw new Error('Invalid recommendations response');
    }

    logger.info('Recommendations generated successfully');
    return parseResult.data;

  } catch (error) {
    logger.error('Recommendation generation failed', error);
    throw error;
  }
}

/**
 * Detect trends using Gemini
 * @param {string} modelId - Model ID
 * @param {Array} items - Items to analyze for trends
 * @param {string} prompt - Trends prompt
 * @returns {Promise<Object>} Trends analysis result
 */
export async function detectTrends(modelId, items, prompt) {
  try {
    logger.info(`Detecting trends in ${items.length} items with ${modelId}`);

    // Build full prompt
    const fullPrompt = `${prompt}\n\nITEMS:\n${JSON.stringify(items, null, 2)}`;

    // Build contents
    const contents = [{
      parts: [{ text: fullPrompt }]
    }];

    // Generate
    const result = await generateContent(modelId, contents, {
      temperature: 0.4
    });

    // Parse trends result
    const parseResult = parseJSON(result.text);

    if (!parseResult.success) {
      throw new Error('Invalid trends response');
    }

    logger.info('Trends detected successfully');
    return parseResult.data;

  } catch (error) {
    logger.error('Trend detection failed', error);
    throw error;
  }
}
/**
 * Build API URL with model and API key
 * @param {Object} endpoint - Endpoint config
 * @param {string} modelId - Model ID
 * @param {string} apiKey - API key
 * @returns {string} Complete API URL
 * @private
 */
function buildApiUrl(endpoint, modelId, apiKey) {
  const baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  const path = endpoint.path.replace('{model}', modelId);
  return `${baseUrl}${path}?key=${apiKey}`;
}

/**
 * Build request body for Gemini API
 * @param {Array<Object>} contents - Content array
 * @param {Object} options - Generation options
 * @returns {Object} Request body
 * @private
 */
function buildRequestBody(contents, options) {
  const body = {
    contents
  };

  // Add generation config if options provided
  if (Object.keys(options).length > 0) {
    body.generationConfig = {};

    if (options.temperature !== undefined) {
      body.generationConfig.temperature = options.temperature;
    }

    if (options.topK !== undefined) {
      body.generationConfig.topK = options.topK;
    }

    if (options.topP !== undefined) {
      body.generationConfig.topP = options.topP;
    }

    if (options.maxOutputTokens !== undefined) {
      body.generationConfig.maxOutputTokens = options.maxOutputTokens;
    }
  }

  return body;
}

/**
 * Extract text from API response
 * @param {Object} response - API response
 * @returns {string} Extracted text
 * @private
 */
function extractTextFromResponse(response) {
  if (!response.candidates || response.candidates.length === 0) {
    throw new Error('No candidates in response');
  }

  const candidate = response.candidates[0];

  if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
    throw new Error('No content in candidate');
  }

  return candidate.content.parts[0].text || '';
}

/**
 * Handle API error response
 * @param {Response} response - Fetch response
 * @param {string} modelId - Model ID
 * @throws {Error} Appropriate error
 * @private
 */
async function handleApiError(response, modelId) {
  const status = response.status;
  let errorMessage = `API error: ${status}`;

  try {
    const errorData = await response.json();
    errorMessage = errorData.error?.message || errorMessage;
  } catch (e) {
    // Ignore JSON parse error
  }

  logger.error('API error', { status, modelId, message: errorMessage });

  // Throw specific error types
  if (status === 401 || status === 403) {
    throw new Error('Invalid or expired API key');
  } else if (status === 429) {
    throw new Error('Rate limit exceeded');
  } else if (status === 404) {
    throw new Error(`Model not found: ${modelId}`);
  } else if (status === 500 || status === 503) {
    throw new Error('Gemini API service unavailable');
  } else {
    throw new Error(errorMessage);
  }
}

/**
 * Calculate confidence score from response
 * @param {Object} result - Generation result
 * @returns {number} Confidence score (0-100)
 * @private
 */
function calculateConfidence(result) {
  // Gemini doesn't provide explicit confidence scores
  // Estimate based on response characteristics
  
  if (!result.candidates || result.candidates.length === 0) {
    return 50;
  }

  const candidate = result.candidates[0];

  // Check finish reason
  if (candidate.finishReason === 'STOP') {
    return 85; // Normal completion
  } else if (candidate.finishReason === 'MAX_TOKENS') {
    return 70; // Truncated response
  } else if (candidate.finishReason === 'SAFETY') {
    return 40; // Safety filter triggered
  } else {
    return 60; // Unknown/other
  }
}

/**
 * Extract base64 data from data URL
 * @param {string} dataUrl - Data URL (data:image/png;base64,...)
 * @returns {string} Base64 data
 * @private
 */
function extractBase64FromDataUrl(dataUrl) {
  const parts = dataUrl.split(',');
  if (parts.length < 2) {
    throw new Error('Invalid data URL format');
  }
  return parts[1];
}

/**
 * Extract MIME type from data URL
 * @param {string} dataUrl - Data URL
 * @returns {string} MIME type (e.g., 'image/png')
 * @private
 */
function extractMimeTypeFromDataUrl(dataUrl) {
  const match = dataUrl.match(/data:([^;]+);/);
  if (!match) {
    throw new Error('Invalid data URL format');
  }
  return match[1];
}

/**
 * Get model information
 * @param {string} modelId - Model ID
 * @returns {Promise<Object|null>} Model info
 */
export async function getModelInfo(modelId) {
  try {
    const config = await getModelsConfig();
    const geminiModels = config.providers.gemini_cloud.models;
    
    return geminiModels[modelId] || null;

  } catch (error) {
    logger.error('Failed to get model info', error, { modelId });
    return null;
  }
}

/**
 * Check if model supports vision
 * @param {string} modelId - Model ID
 * @returns {Promise<boolean>} True if model supports vision
 */
export async function supportsVision(modelId) {
  const modelInfo = await getModelInfo(modelId);
  return modelInfo?.supports_vision || false;
}

// TEST SCENARIOS:
// 1. Generate content with text-only prompt
// 2. Generate content with vision (text + image)
// 3. Extract structured data from HTML
// 4. Extract data with vision (HTML + screenshot)
// 5. Calculate quality score for extracted data
// 6. Deduplicate array of items
// 7. Format data as CSV (standard mode)
// 8. Format data as CSV (data_scientist mode)
// 9. Generate comparisons for multiple items
// 10. Generate personalized recommendations
// 11. Detect market trends in items
// 12. Rate limit check before request
// 13. Rate limit recording after successful request
// 14. API error handling (401, 403, 429, 404, 500, 503)
// 15. JSON parsing with error recovery
// 16. Base64 and MIME type extraction from data URLs
// 17. Confidence score calculation from finish reason
// 18. Model info retrieval (context window, capabilities)
// 19. Vision support check per model
// 20. Build API URL with model and key
// 21. Build request body with generation config
// 22. Extract text from nested API response structure

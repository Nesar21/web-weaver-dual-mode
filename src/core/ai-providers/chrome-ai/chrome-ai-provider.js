// VERSION: v3.0.6 | TEXT-ONLY MODE | LAST UPDATED: 2025-10-29
// [EXPERIMENTAL] This provider uses Chrome's experimental AI APIs

/**
 * Chrome Built-in AI Provider
 * Integrates with Chrome's experimental AI APIs:
 * - Prompt API (LanguageModel/Gemini Nano)
 * - Summarizer API
 * - Translator API
 * - LanguageDetector API
 */

import { createLogger } from '../../../utils/logger.js';
import { getEndpointsConfig } from '../../../utils/config-loader.js';
import { handleAIProviderError } from '../../error-handling/error-handler.js';
import { recoverFromChromeAITimeout } from '../../error-handling/error-recovery.js';
import { parseJSON } from '../../../utils/json-parser-chrome.js';

const logger = createLogger('ChromeAI');

/**
 * Check if Chrome AI is available
 * @returns {boolean} True if Chrome AI is available
 */
export function isChromeAIAvailable() {
  return typeof self !== 'undefined' && self.LanguageModel !== undefined;
}

/**
 * Create language model session
 * @param {Object} options - Session options
 * @returns {Promise<Object>} Language model session
 */
async function createLanguageModelSession(options = {}) {
  if (!isChromeAIAvailable()) {
    throw new Error('Chrome Built-in AI is not available. Please enable it in chrome://flags or use Gemini Cloud API instead.');
  }

  try {
    const session = await self.LanguageModel.create({
      temperature: options.temperature || 0.7,
      topK: options.topK || 40
    });

    logger.info('Language model session created');
    return session;

  } catch (error) {
    logger.error('Failed to create language model session', error);
    throw error;
  }
}

/**
 * Generate text using Prompt API
 * @param {string} prompt - Prompt text
 * @param {Object} options - Generation options
 * @returns {Promise<string>} Generated text
 */
export async function generateText(prompt, options = {}) {
  let session = null;

  try {
    logger.info('Generating text with Chrome AI');

    session = await createLanguageModelSession(options);

    const timeout = options.timeout || 30000;
    const response = await Promise.race([
      session.prompt(prompt),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Chrome AI timeout')), timeout)
      )
    ]);

    logger.info('Text generated successfully');
    return response;

  } catch (error) {
    const handled = handleAIProviderError(error, 'chrome_ai');
    logger.error('Text generation failed', error);
    throw new Error(handled.userMessage);

  } finally {
    if (session && typeof session.destroy === 'function') {
      try {
        session.destroy();
      } catch (e) {
        logger.warn('Failed to destroy session', e);
      }
    }
  }
}

/**
 * Generate text with streaming
 * @param {string} prompt - Prompt text
 * @param {Function} onChunk - Callback for each chunk
 * @param {Object} options - Generation options
 * @returns {Promise<string>} Complete generated text
 */
export async function generateTextStream(prompt, onChunk, options = {}) {
  let session = null;

  try {
    logger.info('Generating text stream with Chrome AI');

    session = await createLanguageModelSession(options);

    let fullText = '';
    const stream = await session.promptStreaming(prompt);

    for await (const chunk of stream) {
      fullText = chunk;
      if (onChunk) {
        onChunk(chunk);
      }
    }

    logger.info('Text stream completed');
    return fullText;

  } catch (error) {
    const handled = handleAIProviderError(error, 'chrome_ai');
    logger.error('Text streaming failed', error);
    throw new Error(handled.userMessage);

  } finally {
    if (session && typeof session.destroy === 'function') {
      try {
        session.destroy();
      } catch (e) {
        logger.warn('Failed to destroy session', e);
      }
    }
  }
}

/**
 * Summarize text using Summarizer API
 * @param {string} text - Text to summarize
 * @param {Object} options - Summarization options
 * @returns {Promise<string>} Summary
 */
export async function summarizeText(text, options = {}) {
  if (!self.Summarizer) {
    throw new Error('Chrome Summarizer API not available');
  }

  let summarizer = null;

  try {
    logger.info('Summarizing text with Chrome AI');

    const availability = await self.Summarizer.availability();
    if (availability !== 'available') {
      throw new Error('Summarizer not available on this device');
    }

    summarizer = await self.Summarizer.create({
      type: options.type || 'tl;dr',
      format: options.format || 'plain-text',
      length: options.length || 'medium'
    });

    const summary = await summarizer.summarize(text);

    logger.info('Text summarized successfully');
    return summary;

  } catch (error) {
    const handled = handleAIProviderError(error, 'chrome_ai');
    logger.error('Summarization failed', error);
    throw new Error(handled.userMessage);

  } finally {
    if (summarizer && typeof summarizer.destroy === 'function') {
      try {
        summarizer.destroy();
      } catch (e) {
        logger.warn('Failed to destroy summarizer', e);
      }
    }
  }
}

/**
 * Translate text using Translator API
 * @param {string} text - Text to translate
 * @param {string} targetLanguage - Target language code
 * @param {string} sourceLanguage - Source language code (optional, auto-detect)
 * @returns {Promise<string>} Translated text
 */
export async function translateText(text, targetLanguage, sourceLanguage = null) {
  if (!self.Translator) {
    throw new Error('Chrome Translator API not available');
  }

  let translator = null;

  try {
    logger.info(`Translating text to ${targetLanguage}`);

    const availability = await self.Translator.availability({
      sourceLanguage: sourceLanguage || 'en',
      targetLanguage
    });
    if (availability !== 'available') {
      throw new Error('Translator not available on this device');
    }

    const config = {
      targetLanguage
    };
    if (sourceLanguage) {
      config.sourceLanguage = sourceLanguage;
    }

    translator = await self.Translator.create(config);

    const translated = await translator.translate(text);

    logger.info('Text translated successfully');
    return translated;

  } catch (error) {
    const handled = handleAIProviderError(error, 'chrome_ai');
    logger.error('Translation failed', error);
    throw new Error(handled.userMessage);

  } finally {
    if (translator && typeof translator.destroy === 'function') {
      try {
        translator.destroy();
      } catch (e) {
        logger.warn('Failed to destroy translator', e);
      }
    }
  }
}

/**
 * Detect language using LanguageDetector API
 * @param {string} text - Text to detect language for
 * @returns {Promise<Array<Object>>} Language detection results [{language: string, confidence: number}]
 */
export async function detectLanguage(text) {
  if (!self.LanguageDetector) {
    throw new Error('Chrome LanguageDetector API not available');
  }

  let detector = null;

  try {
    logger.info('Detecting language with Chrome AI');

    const availability = await self.LanguageDetector.availability();
    if (availability !== 'available') {
      throw new Error('Language detector not available on this device');
    }

    detector = await self.LanguageDetector.create();

    const results = await detector.detect(text);

    logger.info('Language detected successfully', results);
    return results;

  } catch (error) {
    const handled = handleAIProviderError(error, 'chrome_ai');
    logger.error('Language detection failed', error);
    throw new Error(handled.userMessage);

  } finally {
    if (detector && typeof detector.destroy === 'function') {
      try {
        detector.destroy();
      } catch (e) {
        logger.warn('Failed to destroy language detector', e);
      }
    }
  }
}

/**
 * Truncate HTML to fit Chrome AI's input limits
 * @param {string} html - HTML content
 * @param {number} maxChars - Maximum characters (default: 15000)
 * @returns {string} Truncated HTML
 */
function truncateHTML(html, maxChars = 15000) {
  if (html.length <= maxChars) {
    return html;
  }
  
  const truncated = html.substring(0, maxChars);
  logger.warn(`HTML truncated from ${html.length} to ${maxChars} characters due to Chrome AI context limits`);
  return truncated + '\n\n[...content truncated due to Chrome AI size limits...]';
}

/**
 * Extract structured data using Chrome AI
 * @param {string} html - HTML content
 * @param {string} prompt - Extraction prompt
 * @param {Object} options - Extraction options
 * @returns {Promise<Object>} Extraction result {data: any, confidence: number}
 */
export async function extractData(html, prompt, options) {
  try {
    logger.info('Extracting data with Chrome AI');
    
    const truncatedHTML = truncateHTML(html, 15000);
    
    const fullPrompt = `${prompt}\n\n${truncatedHTML}`;
    
    const response = await generateText(fullPrompt, {
      temperature: options.temperature || 0.3,
      timeout: options.timeout || 60000
    });
    
    const parseResult = parseJSON(response);
    
    if (!parseResult.success) {
      throw new Error(`JSON parsing failed: ${parseResult.error}`);
    }
    
    logger.info('Data extracted successfully');
    return {
      data: parseResult.data,
      confidence: options.confidence || 85
    };
    
  } catch (error) {
    logger.error('Data extraction failed', error);
    throw error;
  }
}

/**
 * Calculate quality score using Chrome AI
 * @param {Object} extractedData - Extracted data to score
 * @param {string} prompt - Quality scoring prompt
 * @returns {Promise<Object>} Quality score result
 */
export async function calculateQualityScore(extractedData, prompt) {
  try {
    logger.info('Calculating quality score with Chrome AI');

    const fullPrompt = `${prompt}\n\nEXTRACTED DATA:\n${JSON.stringify(extractedData, null, 2)}`;

    const response = await generateText(fullPrompt, {
      temperature: 0.1,
      timeout: 30000
    });

    const scoreResult = JSON.parse(response);

    logger.info('Quality score calculated', scoreResult);
    return scoreResult;

  } catch (error) {
    logger.error('Quality score calculation failed', error);
    throw error;
  }
}

/**
 * Check Chrome AI capabilities
 * @returns {Promise<Object>} Capabilities object
 */
export async function checkCapabilities() {
  const capabilities = {
    languageModel: false,
    summarizer: false,
    translator: false,
    languageDetector: false,
    details: {}
  };

  try {
    if (self.LanguageModel) {
      const lmAvail = await self.LanguageModel.availability();
      capabilities.languageModel = (lmAvail === 'available');
      capabilities.details.languageModel = { available: lmAvail };
    }

    if (self.Summarizer) {
      const sumAvail = await self.Summarizer.availability();
      capabilities.summarizer = (sumAvail === 'available');
      capabilities.details.summarizer = { available: sumAvail };
    }

    if (self.Translator) {
      const transAvail = await self.Translator.availability({ 
        sourceLanguage: 'en', 
        targetLanguage: 'es' 
      });
      capabilities.translator = (transAvail === 'available');
      capabilities.details.translator = { available: transAvail };
    }

    if (self.LanguageDetector) {
      const detAvail = await self.LanguageDetector.availability();
      capabilities.languageDetector = (detAvail === 'available');
      capabilities.details.languageDetector = { available: detAvail };
    }

    logger.info('Chrome AI capabilities checked', capabilities);
    return capabilities;

  } catch (error) {
    logger.error('Capabilities check failed', error);
    return capabilities;
  }
}

/**
 * Get model information
 * @returns {Promise<Object>} Model info
 */
export async function getModelInfo() {
  try {
    if (!self.LanguageModel) {
      return null;
    }

    const availability = await self.LanguageModel.availability();

    return {
      id: 'gemini_nano',
      name: 'Gemini Nano',
      provider: 'chrome_ai',
      available: (availability === 'available'),
      maxTokens: 8192,
      contextLimit: 4000,
      defaultTemperature: 0.7,
      defaultTopK: 40
    };

  } catch (error) {
    logger.error('Failed to get model info', error);
    return null;
  }
}

// VERSION: v1.0.0 | CHROME LANGUAGE DETECTOR | LAST UPDATED: 2025-10-30
// [EXPERIMENTAL] This module uses Chrome's experimental Language Detector API

/**
 * Chrome Built-in Language Detector
 * Integrates with Chrome's experimental Language Detector API
 * Detects language of text with confidence scores
 */

import { createLogger } from '../../utils/logger.js';
import { handleAIProviderError } from '../error-handling/error-handler.js';

const logger = createLogger('LanguageDetector');

/**
 * Check if Chrome Language Detector API is available
 * @returns {Promise<Object>} Availability status
 */
export async function isLanguageDetectorAvailable() {
  try {
    if (typeof self === 'undefined' || !self.translation || !self.translation.canDetect) {
      return {
        available: false,
        reason: 'Chrome Language Detector API not available (Chrome 131+ required)'
      };
    }

    const canDetect = await self.translation.canDetect();
    
    return {
      available: canDetect === 'readily' || canDetect === 'after-download',
      status: canDetect,
      reason: canDetect === 'no' ? 'Language detection not available for this device' : null
    };
  } catch (error) {
    logger.error('Language detector availability check failed', error);
    return { available: false, reason: error.message };
  }
}

/**
 * Create language detector instance
 * @param {Object} options - Detector options
 * @returns {Promise<Object>} Detector instance
 */
async function createLanguageDetector(options = {}) {
  if (!self.translation || !self.translation.canDetect) {
    throw new Error('Chrome Language Detector API not available. Defaulting to English.');
  }

  try {
    logger.info('Creating language detector');

    const detector = await self.translation.createDetector();

    // Handle model download if needed
    if (detector.ready) {
      detector.addEventListener('downloadprogress', (e) => {
        const progress = Math.round((e.loaded / e.total) * 100);
        logger.info(`Downloading language detection model: ${progress}%`);
        
        // Notify UI of download progress
        if (options.onProgress) {
          options.onProgress(progress, 'language-detector');
        }

        // Send message to background script for UI updates
        try {
          chrome.runtime.sendMessage({
            type: 'DETECTOR_DOWNLOAD_PROGRESS',
            progress
          });
        } catch (msgError) {
          // Ignore if background script isn't ready
        }
      });

      await detector.ready;
      logger.info('Language detector ready');
    }

    return detector;

  } catch (error) {
    logger.error('Failed to create language detector', error);
    throw error;
  }
}

/**
 * Detect language of text
 * @param {string} text - Text to detect language for
 * @param {Object} options - Detection options
 * @returns {Promise<Object>} Detection result {language: string, confidence: number, all: Array}
 */
export async function detectLanguage(text, options = {}) {
  let detector = null;

  try {
    logger.info('Detecting language');

    // Check availability
    const availability = await isLanguageDetectorAvailable();
    if (!availability.available) {
      logger.warn('Language detector not available, defaulting to English');
      return {
        language: 'en',
        confidence: 0,
        detected: false,
        reason: availability.reason
      };
    }

    // Create detector
    detector = await createLanguageDetector(options);

    // Perform detection
    const timeout = options.timeout || 10000;
    const results = await Promise.race([
      detector.detect(text),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Language detection timeout')), timeout)
      )
    ]);

    // Results are sorted by confidence, highest first
    const topResult = results[0];

    logger.info(`Language detected: ${topResult.detectedLanguage} (confidence: ${topResult.confidence})`);

    return {
      language: topResult.detectedLanguage,
      confidence: topResult.confidence,
      detected: true,
      all: results.map(r => ({
        language: r.detectedLanguage,
        confidence: r.confidence
      }))
    };

  } catch (error) {
    const handled = handleAIProviderError(error, 'chrome_ai');
    logger.error('Language detection failed', error);
    
    // Return default instead of throwing
    return {
      language: 'en',
      confidence: 0,
      detected: false,
      error: handled.userMessage
    };

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
 * Detect languages for multiple texts (batch detection)
 * @param {Array<string>} texts - Array of texts to detect
 * @param {Object} options - Detection options
 * @returns {Promise<Array<Object>>} Array of detection results
 */
export async function detectLanguageBatch(texts, options = {}) {
  let detector = null;

  try {
    logger.info(`Batch detecting language for ${texts.length} texts`);

    // Check availability
    const availability = await isLanguageDetectorAvailable();
    if (!availability.available) {
      logger.warn('Language detector not available, defaulting to English for all');
      return texts.map(text => ({
        text,
        language: 'en',
        confidence: 0,
        detected: false
      }));
    }

    // Create detector once for all detections
    detector = await createLanguageDetector(options);

    // Detect each text sequentially
    const results = [];
    for (let i = 0; i < texts.length; i++) {
      try {
        const detectionResults = await detector.detect(texts[i]);
        const topResult = detectionResults[0];

        results.push({
          text: texts[i],
          language: topResult.detectedLanguage,
          confidence: topResult.confidence,
          detected: true,
          index: i
        });

        // Progress callback
        if (options.onItemComplete) {
          options.onItemComplete(i + 1, texts.length);
        }
      } catch (itemError) {
        logger.error(`Failed to detect language for item ${i}`, itemError);
        results.push({
          text: texts[i],
          language: 'en',
          confidence: 0,
          detected: false,
          error: itemError.message,
          index: i
        });
      }
    }

    logger.info('Batch language detection completed');
    return results;

  } catch (error) {
    const handled = handleAIProviderError(error, 'chrome_ai');
    logger.error('Batch language detection failed', error);
    
    // Return defaults instead of throwing
    return texts.map((text, index) => ({
      text,
      language: 'en',
      confidence: 0,
      detected: false,
      error: handled.userMessage,
      index
    }));

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
 * Get language detector capabilities
 * @returns {Promise<Object>} Capabilities object
 */
export async function getDetectorCapabilities() {
  try {
    const availability = await isLanguageDetectorAvailable();

    return {
      available: availability.available,
      status: availability.status,
      supportsOffline: true,
      requiresDownload: availability.status === 'after-download',
      maxTextLength: 1000, // Recommended for best accuracy
      provider: 'chrome_ai',
      detectedLanguages: 10 // Returns top 10 languages by confidence
    };
  } catch (error) {
    logger.error('Failed to get detector capabilities', error);
    return {
      available: false,
      error: error.message
    };
  }
}

/**
 * Get language detector model information
 * @returns {Promise<Object>} Model info
 */
export async function getDetectorInfo() {
  try {
    if (!self.translation) {
      return null;
    }

    const availability = await self.translation.canDetect();

    return {
      id: 'chrome_language_detector',
      name: 'Chrome Language Detector',
      provider: 'chrome_ai',
      available: (availability === 'readily' || availability === 'after-download'),
      requiresDownload: (availability === 'after-download'),
      modelSize: '~15MB',
      maxTextLength: 1000,
      supportsOffline: true,
      detectedLanguages: 10
    };

  } catch (error) {
    logger.error('Failed to get detector info', error);
    return null;
  }
}

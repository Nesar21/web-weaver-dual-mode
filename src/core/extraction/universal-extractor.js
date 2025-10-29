/* VERSION: v1.0.0 | FEATURE: Universal Content Extraction */

import { PatternDetector } from '../../utils/pattern-detector.js';
import { ContentTypeDetector } from '../../utils/content-type-detector.js';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('UniversalExtractor');

/**
 * Universal content extractor
 * Works on any website without site-specific configuration
 */
export class UniversalExtractor {
  constructor(aiProvider, settings) {
    this.ai = aiProvider;
    this.settings = settings;
    this.contentDetector = new ContentTypeDetector(aiProvider);
  }
  
  /**
   * Extract all content from current page
   */
  async extract() {
    const startTime = Date.now();
    logger.info('🌐 Starting universal extraction');
    
    try {
      // Step 1: Find repeating elements (DOM-based, instant)
      const pattern = PatternDetector.findRepeatingElements();
      
      if (pattern.count === 0) {
        throw new Error('No repeating content found. Page might not have structured data.');
      }
      
      logger.info(`✅ Found ${pattern.count} items using selector: ${pattern.selector}`);
      
      // Step 2: Detect content type (AI-based, ~3 seconds)
      const contentType = await this.contentDetector.detect(
        pattern.elements,
        pattern.category
      );
      
      logger.info(`✅ Detected content type: ${contentType}`);
      
      // Step 3: Extract all items (AI-based, batched)
      const items = await this.extractItems(pattern.elements, contentType);
      
      const duration = Math.round((Date.now() - startTime) / 1000);
      logger.info(`✅ Extracted ${items.length} items in ${duration}s`);
      
      return {
        success: true,
        content_type: contentType,
        selector: pattern.selector,
        items: items,
        count: items.length,
        duration: duration
      };
      
    } catch (error) {
      logger.error('❌ Universal extraction failed', error);
      return {
        success: false,
        error: error.message,
        items: [],
        count: 0
      };
    }
  }
  
  /**
   * Extract items in batches
   */
  async extractItems(elements, contentType) {
    const items = [];
    const batches = PatternDetector.getElementBatches(elements, 10);
    
    logger.info(`Processing ${batches.length} batches`);
    
    for (const batch of batches) {
      logger.debug(`Processing batch ${batch.index + 1}/${batches.length}`);
      
      const batchItems = await this.extractBatch(
        batch.html,
        contentType,
        batch.elements.length
      );
      
      items.push(...batchItems);
      
      // Update progress
      this.updateProgress(items.length, elements.length);
    }
    
    return items;
  }
  
  /**
   * Extract a single batch
   */
async extractBatch(html, contentType, expectedCount) {
  const fields = ContentTypeDetector.getExpectedFields(contentType);

  const prompt = `Extract ${contentType} from these HTML elements.
    Each element is separated by "---ITEM---".

    CRITICAL RULES:
    1. Extract ONLY visible text from HTML
    2. Do NOT generate, infer, or create any data
    3. If a field is not visible, set to null
    4. Copy text exactly as written
    5. Return ${expectedCount} JSON objects (one per item)

    Expected fields: ${fields.join(', ')}

    HTML:
    ${html.substring(0, 100000)}

    Return a JSON array of ${expectedCount} objects.`;

    try {
      const response = await this.ai.generateText(prompt);

      // 🧩 Handle code fences
      let jsonText = response;
      if (jsonText.includes('```json')) {
        jsonText = jsonText.split('```json')[1]?.split('```')[0] || jsonText;
      } else if (jsonText.includes('```')) {
        jsonText = jsonText.split('```')[1]?.split('```')[0] || jsonText;
      }

      // 🧹 Clean and parse
      const parsed = JSON.parse(jsonText.trim());

      // 🔄 Ensure always array
      return Array.isArray(parsed) ? parsed : [parsed];

    } catch (error) {
      logger?.warn?.(`Batch extraction failed: ${error.message}`);
      return [];
    }
    }

    /**
     * Update progress in UI
     */
    updateProgress(current, total) {
    const percent = Math.round((current / total) * 100);

    chrome.runtime.sendMessage({
      type: 'EXTRACTION_PROGRESS',
      current,
      total,
      percent
    }).catch(() => {
      // Popup might be closed
    });
    }
}
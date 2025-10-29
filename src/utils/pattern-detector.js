/* VERSION: v1.0.0 | FEATURE: DOM Pattern Detection */

/**
 * Detect repeating elements on a page
 * Works universally across all websites
 */
export class PatternDetector {
  /**
   * Find repeating elements using common patterns
   */
  static findRepeatingElements() {
    const patterns = [
      // Jobs - LinkedIn, Indeed, Glassdoor
      '[data-job-id]', '.job-card', '.job-listing', '.jobs-search-result',
      '.job-item', '.position-card', '.vacancy', '.job-result',
      
      // Products - Amazon, Flipkart, eBay
      '[data-asin]', '[data-product-id]', '.product-card', '.s-result-item',
      '.product-item', '.product', '.item-card', '.product-grid-item',
      
      // Articles - Medium, Dev.to, blogs
      'article', '.article-card', '.post', '.story-card', '.news-item',
      '.blog-post', '[data-article-id]',
      
      // Social - Twitter, Facebook, LinkedIn
      '[data-post-id]', '[data-tweet-id]', '.post-container', '.feed-item',
      '.status', '.tweet', '.social-post',
      
      // Generic fallbacks
      '.card', '.item', '.result', '.listing', '.entry', '.tile'
    ];
    
    let bestMatch = {
      selector: null,
      count: 0,
      elements: [],
      category: 'unknown'
    };
    
    for (const selector of patterns) {
      try {
        const elements = document.querySelectorAll(selector);
        
        // Need at least 2 items to be a "pattern"
        if (elements.length >= 2 && elements.length > bestMatch.count) {
          bestMatch = {
            selector,
            count: elements.length,
            elements: Array.from(elements),
            category: this.categorizeSelector(selector)
          };
        }
      } catch (e) {
        // Invalid selector, skip
        continue;
      }
    }
    
    return bestMatch;
  }
  
  /**
   * Categorize selector to guess content type
   */
  static categorizeSelector(selector) {
    const lower = selector.toLowerCase();
    
    if (lower.includes('job') || lower.includes('position') || lower.includes('vacancy')) {
      return 'job_listings';
    }
    if (lower.includes('product') || lower.includes('asin')) {
      return 'products';
    }
    if (lower.includes('article') || lower.includes('post') || lower.includes('story')) {
      return 'articles';
    }
    if (lower.includes('tweet') || lower.includes('feed') || lower.includes('social')) {
      return 'social_posts';
    }
    
    return 'generic';
  }
  
  /**
   * Get HTML of elements in batches
   */
  static getElementBatches(elements, batchSize = 10) {
    const batches = [];
    
    for (let i = 0; i < elements.length; i += batchSize) {
      const batch = elements.slice(i, i + batchSize);
      batches.push({
        index: Math.floor(i / batchSize),
        elements: batch,
        html: batch.map(el => el.outerHTML).join('\n\n---ITEM---\n\n')
      });
    }
    
    return batches;
  }
}

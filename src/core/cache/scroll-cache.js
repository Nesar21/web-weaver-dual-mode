/**
 * Scroll Cache Engine - Stores HTML snapshots with FIFO management
 * Location: /src/core/cache/scroll-cache.js
 * VERSION: v1.2.0 - UPDATED: 2025-10-29 - 25MB LIMIT FOR FLASH LITE
 */

class ScrollCache {
  constructor() {
    this.cache = {
      items: [], // Array of cached items (oldest at index 0, newest at end)
      totalTokens: 0,
      totalBytes: 0,
      maxTokens: 6400000, // 🔥 UPDATED: 6.4M tokens = 25 MB @ 4 chars/token
      maxBytes: 26214400, // 🔥 UPDATED: 25 MB (25600 KB)
      url: null,
      timestamp: Date.now()
    };

    this.TOKENS_PER_CHAR = 0.25; // Approximation: 4 chars per token
  }

  /**
   * Add new item to cache (newest items at end)
   * Auto-deletes oldest when hitting 95% capacity
   */
  async addItem(htmlContent, metadata = {}) {
    const tokens = this.estimateTokens(htmlContent);
    const bytes = new Blob([htmlContent]).size;

    const item = {
      html: htmlContent,
      tokens: tokens,
      bytes: bytes,
      timestamp: Date.now(),
      metadata: metadata
    };

    // 🔥 FIFO DELETION at 95% full (delete oldest from top)
    if (this.cache.totalTokens + tokens > this.cache.maxTokens) {
      await this.trimCache(tokens);
    }

    // Add to end (newest)
    this.cache.items.push(item);
    this.cache.totalTokens += tokens;
    this.cache.totalBytes += bytes;
    this.cache.timestamp = Date.now();

    return {
      success: true,
      itemCount: this.cache.items.length,
      totalTokens: this.cache.totalTokens,
      totalKB: Math.round(this.cache.totalBytes / 1024)
    };
  }

  /**
   * Trim oldest items until new item fits (FIFO - First In, First Out)
   */
  async trimCache(tokensNeeded) {
    while (
      this.cache.items.length > 0 &&
      this.cache.totalTokens + tokensNeeded > this.cache.maxTokens
    ) {
      // Remove oldest item (from beginning of array)
      const oldestItem = this.cache.items.shift();
      this.cache.totalTokens -= oldestItem.tokens;
      this.cache.totalBytes -= oldestItem.bytes;
    }
  }

  /**
   * Get newest N items up to specified token limit
   * Used for Pro/Exp models with lower TPM limits
   */
  getNewestItemsUpToTokens(maxTokens) {
    const selectedItems = [];
    let accumulatedTokens = 0;
    let accumulatedBytes = 0;

    // Iterate from end (newest) to beginning (oldest)
    for (let i = this.cache.items.length - 1; i >= 0; i--) {
      const item = this.cache.items[i];
      
      if (accumulatedTokens + item.tokens <= maxTokens) {
        selectedItems.unshift(item); // Add to beginning to maintain chronological order
        accumulatedTokens += item.tokens;
        accumulatedBytes += item.bytes;
      } else {
        break; // Stop when limit reached
      }
    }

    return {
      items: selectedItems,
      itemCount: selectedItems.length,
      tokens: accumulatedTokens,
      kb: Math.round(accumulatedBytes / 1024)
    };
  }

  /**
   * Get all cache items (for Lite model)
   */
  getAllItems() {
    return {
      items: this.cache.items,
      itemCount: this.cache.items.length,
      tokens: this.cache.totalTokens,
      kb: Math.round(this.cache.totalBytes / 1024)
    };
  }

  /**
   * Get current cache size statistics
   */
  getCacheSize() {
    const kb = Math.round(this.cache.totalBytes / 1024);
    const mb = (kb / 1024).toFixed(2);
    const maxKB = 25600; // 🔥 UPDATED: 25 MB
    const maxMB = 25; // 🔥 UPDATED: 25 MB
    const percentFull = (this.cache.totalTokens / this.cache.maxTokens) * 100;

    return {
      tokens: this.cache.totalTokens,
      kb: kb,
      mb: parseFloat(mb),
      maxTokens: this.cache.maxTokens,
      maxKB: maxKB,
      maxMB: maxMB,
      percentFull: Math.round(percentFull),
      itemCount: this.cache.items.length
    };
  }

  /**
   * Estimate tokens from HTML content
   */
  estimateTokens(content) {
    return Math.ceil(content.length * this.TOKENS_PER_CHAR);
  }

  /**
   * Clear entire cache
   */
  clearCache() {
    this.cache.items = [];
    this.cache.totalTokens = 0;
    this.cache.totalBytes = 0;
    this.cache.timestamp = Date.now();

    return {
      success: true,
      message: 'Cache cleared'
    };
  }

  /**
   * Check if cache exists and has items
   */
  hasCache() {
    return this.cache.items.length > 0;
  }

  /**
   * Update cache URL (for tracking page changes)
   */
  updateURL(url) {
    // If URL changed, clear old cache
    if (this.cache.url && this.cache.url !== url) {
      this.clearCache();
    }
    this.cache.url = url;
  }
}

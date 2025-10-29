/**
 * Cache Allocator - TPM-aware cache allocation for Gemini Cloud API models
 * Location: /src/core/cache/cache-allocator.js
 * VERSION: v1.2.0 - UPDATED: 2025-10-29 - 25MB LIMIT FOR FLASH LITE
 */

export class CacheAllocator {
  constructor() {
    // 🔥 ONLY Gemini Cloud API models (NO Chrome AI fallback)
    this.MODEL_LIMITS = {
      'gemini-2.0-flash-lite': {
        tpm: 1000000,
        safeTPM: 6400000, // 🔥 UPDATED: 6.4M tokens = 25 MB @ 4 chars/token
        name: 'Gemini 2.0 Flash Lite',
        rpm: 30
      },
      'gemini-2.0-flash-exp': {
        tpm: 250000,
        safeTPM: 225000, // 90% safety buffer
        name: 'Gemini 2.0 Flash Experimental',
        rpm: 10
      },
      'gemini-2.5-pro': {
        tpm: 125000,
        safeTPM: 112500, // 90% safety buffer
        name: 'Gemini 2.5 Pro',
        rpm: 2
      }
    };
  }

  /**
   * Calculate extraction allocation for selected model
   * Returns how much cache can be sent based on model TPM limits
   */
  async allocate(selectedModel, scrollCache) {
    const modelConfig = this.MODEL_LIMITS[selectedModel];
    
    if (!modelConfig) {
      return {
        error: true,
        message: `Unknown model: ${selectedModel}. Cache allocation not possible.`
      };
    }

    const cacheSize = scrollCache.getCacheSize();
    const safeTPM = modelConfig.safeTPM;

    // 🔥 CASE 1: Gemini 2.0 Flash Lite (1M TPM)
    // Send ALL cache (up to 6.4M tokens / 25 MB), auto-delete oldest at 95%
    if (selectedModel === 'gemini-2.0-flash-lite') {
      const percentFull = (cacheSize.tokens / safeTPM) * 100;
      
      return {
        success: true,
        modelName: modelConfig.name,
        sendAllCache: true, // Send everything
        itemsToSend: cacheSize.itemCount,
        tokensToSend: cacheSize.tokens,
        kbToSend: cacheSize.kb,
        percentUsed: percentFull,
        warning: percentFull >= 90 ? 'Cache at 90%+. Wait 1 minute before next extraction to avoid TPM errors.' : null
      };
    }

    // 🔥 CASE 2: Pro/Exp models (125K/250K TPM)
    // Send ONLY 90% TPM worth (newest items first)
    if (cacheSize.tokens > safeTPM) {
      // Cache exceeds model limit - allocate newest items up to 90% TPM
      const allocation = scrollCache.getNewestItemsUpToTokens(safeTPM);
      
      return {
        success: true,
        modelName: modelConfig.name,
        sendAllCache: false,
        itemsToSend: allocation.itemCount,
        tokensToSend: allocation.tokens,
        kbToSend: allocation.kb,
        percentUsed: 90, // Capped at 90%
        warning: `Cache exceeds ${modelConfig.name} TPM limit. Sending newest ${allocation.itemCount} items (${allocation.kb} KB) only.`
      };
    } else {
      // Cache fits within model limit - send all
      return {
        success: true,
        modelName: modelConfig.name,
        sendAllCache: true,
        itemsToSend: cacheSize.itemCount,
        tokensToSend: cacheSize.tokens,
        kbToSend: cacheSize.kb,
        percentUsed: (cacheSize.tokens / safeTPM) * 100,
        warning: null
      };
    }
  }

  /**
   * Get user-friendly model info for display
   */
  getModelInfo(selectedModel) {
    const config = this.MODEL_LIMITS[selectedModel];
    if (!config) return null;

    return {
      name: config.name,
      tpmLimit: config.tpm,
      safeTpmLimit: config.safeTPM,
      rpm: config.rpm,
      limitKB: Math.round((config.safeTPM * 4) / 1024) // Convert tokens to KB (approx)
    };
  }
}

/**
 * Cache UI Manager - User-friendly display and interaction for scroll cache
 * Location: /src/core/cache/cache-ui.js
 * VERSION: v1.1.0 - UPDATED: 2025-10-29 - 10MB LIMIT FOR FLASH LITE
 */

export class CacheUI {
  constructor() {
    this.elements = {
      section: null,
      sizeDisplay: null,
      limitDisplay: null,
      itemCount: null,
      progressBar: null,
      warningBanner: null,
      previewCard: null,
      infoIcon: null
    };
  }

  /**
   * Initialize cache UI elements (call from popup.js)
   */
  initialize() {
    this.elements.section = document.getElementById('cache-section');
    this.elements.sizeDisplay = document.getElementById('cache-size-display');
    this.elements.limitDisplay = document.getElementById('cache-limit-display');
    this.elements.itemCount = document.getElementById('cache-item-count');
    this.elements.progressBar = document.getElementById('cache-fill');
    this.elements.warningBanner = document.getElementById('cache-warning-banner');
    this.elements.previewCard = document.getElementById('extraction-preview');
    this.elements.infoIcon = document.getElementById('cache-info-icon');

    // Setup info icon tooltip
    if (this.elements.infoIcon) {
      this.setupInfoTooltip();
    }
  }

  /**
   * Show cache section (for Gemini Cloud users only)
   */
  show() {
    if (this.elements.section) {
      this.elements.section.classList.remove('hidden');
    }
  }

  /**
   * Hide cache section (for Chrome AI users)
   */
  hide() {
    if (this.elements.section) {
      this.elements.section.classList.add('hidden');
    }
  }

  /**
   * Update cache display with real-time stats
   */
  updateDisplay(cacheSize, modelInfo = null) {
    // Update size display (in KB)
    if (this.elements.sizeDisplay) {
      this.elements.sizeDisplay.textContent = `${cacheSize.kb} KB`;
    }

    // 🔥 NEW: Update limit display (10 MB for Lite, or model-specific)
    const limitKB = modelInfo ? modelInfo.limitKB : 10240; // 🔥 DEFAULT: 10 MB (2.56M tokens)
    if (this.elements.limitDisplay) {
      this.elements.limitDisplay.textContent = `${limitKB} KB`;
    }

    // Update item count
    if (this.elements.itemCount) {
      this.elements.itemCount.textContent = `(${cacheSize.itemCount} items)`;
    }

    // Update progress bar
    const percentFull = cacheSize.percentFull;
    if (this.elements.progressBar) {
      this.elements.progressBar.style.width = `${percentFull}%`;
      
      // Color coding
      if (percentFull >= 95) {
        this.elements.progressBar.className = 'cache-fill critical';
      } else if (percentFull >= 90) {
        this.elements.progressBar.className = 'cache-fill warning';
      } else if (percentFull >= 70) {
        this.elements.progressBar.className = 'cache-fill caution';
      } else {
        this.elements.progressBar.className = 'cache-fill normal';
      }
    }

    // Show/hide warning banner
    if (percentFull >= 90) {
      this.showWarning('Cache at 90%+. Wait 1 minute before next extraction to avoid TPM errors.');
    } else {
      this.hideWarning();
    }
  }

  /**
   * Display extraction preview before sending
   */
  showExtractionPreview(allocation) {
    if (!this.elements.previewCard) return;

    const message = allocation.sendAllCache
      ? `📤 Sending all ${allocation.itemsToSend} items (${allocation.kbToSend} KB) to ${allocation.modelName}`
      : `📤 Sending newest ${allocation.itemsToSend} items (${allocation.kbToSend} KB) to ${allocation.modelName}`;

    this.elements.previewCard.textContent = message;
    this.elements.previewCard.classList.remove('hidden');

    // Auto-hide after 5 seconds
    setTimeout(() => {
      this.hideExtractionPreview();
    }, 5000);
  }

  /**
   * Hide extraction preview
   */
  hideExtractionPreview() {
    if (this.elements.previewCard) {
      this.elements.previewCard.classList.add('hidden');
    }
  }

  /**
   * Show warning banner
   */
  showWarning(message) {
    if (!this.elements.warningBanner) return;

    this.elements.warningBanner.textContent = `⚠️ ${message}`;
    this.elements.warningBanner.classList.remove('hidden');
  }

  /**
   * Hide warning banner
   */
  hideWarning() {
    if (this.elements.warningBanner) {
      this.elements.warningBanner.classList.add('hidden');
    }
  }

  /**
   * Setup info icon tooltip
   */
  setupInfoTooltip() {
    const tooltip = document.createElement('div');
    tooltip.className = 'cache-info-tooltip hidden';
    tooltip.innerHTML = `
      <strong>Why Cache Restrictions?</strong><br>
      Gemini Cloud API has TPM (Tokens Per Minute) limits:<br>
      • Lite (1M TPM): Send all cache up to 10 MB<br>
      • Exp (250K TPM): Send newest 90% only<br>
      • Pro (125K TPM): Send newest 90% only<br><br>
      This prevents TPM errors and ensures smooth extraction.
    `;

    this.elements.infoIcon.parentNode.appendChild(tooltip);

    this.elements.infoIcon.addEventListener('mouseenter', () => {
      tooltip.classList.remove('hidden');
    });

    this.elements.infoIcon.addEventListener('mouseleave', () => {
      tooltip.classList.add('hidden');
    });
  }

  /**
   * Get HTML structure for cache section (to insert in popup.html)
   */
  static getCacheSectionHTML() {
    return `
      <div id="cache-section" class="cache-section hidden">
        <div class="cache-header">
          <h3>Scroll Cache</h3>
          <span id="cache-info-icon" class="cache-info-icon">ℹ️</span>
        </div>
        <div class="cache-stats">
          <span id="cache-size-display">0 KB</span> / <span id="cache-limit-display">10240 KB</span>
          <span id="cache-item-count">(0 items)</span>
        </div>
        <div class="cache-progress-container">
          <div id="cache-fill" class="cache-fill normal" style="width: 0%"></div>
        </div>
        <div id="cache-warning-banner" class="cache-warning-banner hidden"></div>
        <div id="extraction-preview" class="extraction-preview-card hidden"></div>
      </div>
    `;
  }

  /**
   * Get CSS styles for cache UI (to insert in popup.css)
   */
  static getCacheCSS() {
    return `
      /* Cache Section Container */
      .cache-section {
        margin: 16px 0;
        padding: 16px;
        background: #f8f9fa;
        border: 1px solid #e1e4e8;
        border-radius: 8px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }

      .cache-section.hidden {
        display: none;
      }

      /* Cache Header */
      .cache-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }

      .cache-header h3 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: #24292e;
      }

      .cache-info-icon {
        cursor: help;
        font-size: 16px;
        transition: transform 0.2s;
      }

      .cache-info-icon:hover {
        transform: scale(1.2);
      }

      /* Info Tooltip */
      .cache-info-tooltip {
        position: absolute;
        right: 16px;
        top: 45px;
        background: #24292e;
        color: #fff;
        padding: 12px;
        border-radius: 6px;
        font-size: 11px;
        line-height: 1.5;
        width: 280px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 1000;
      }

      .cache-info-tooltip.hidden {
        display: none;
      }

      /* Cache Stats */
      .cache-stats {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        font-size: 13px;
        color: #586069;
      }

      #cache-size-display {
        font-weight: 600;
        color: #0366d6;
      }

      #cache-item-count {
        font-size: 11px;
        color: #6a737d;
      }

      /* Progress Bar */
      .cache-progress-container {
        width: 100%;
        height: 8px;
        background: #e1e4e8;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 12px;
      }

      .cache-fill {
        height: 100%;
        transition: width 0.3s ease, background-color 0.3s ease;
        border-radius: 4px;
      }

      .cache-fill.normal {
        background: linear-gradient(90deg, #28a745, #34d058);
      }

      .cache-fill.caution {
        background: linear-gradient(90deg, #ffd33d, #f9c513);
      }

      .cache-fill.warning {
        background: linear-gradient(90deg, #f66a0a, #fb8532);
      }

      .cache-fill.critical {
        background: linear-gradient(90deg, #d73a49, #cb2431);
      }

      /* Warning Banner */
      .cache-warning-banner {
        background: #fff3cd;
        border: 1px solid #ffc107;
        border-radius: 6px;
        padding: 10px;
        font-size: 12px;
        color: #856404;
        margin-bottom: 12px;
      }

      .cache-warning-banner.hidden {
        display: none;
      }

      /* Extraction Preview Card */
      .extraction-preview-card {
        background: #e3f2fd;
        border: 1px solid #2196f3;
        border-radius: 6px;
        padding: 10px;
        font-size: 12px;
        color: #0d47a1;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .extraction-preview-card.hidden {
        display: none;
      }
    `;
  }
}

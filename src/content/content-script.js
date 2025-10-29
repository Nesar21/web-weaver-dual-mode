// VERSION: v1.1.0 | LAST UPDATED: 2025-10-29 | FEATURE: Content Script + Scroll Cache

/**
 * Content Script
 * Runs in context of web pages to extract HTML and communicate with background
 * Provides page-level utilities for extraction engine
 * NOW WITH SCROLL CACHE: Captures HTML on scroll for Gemini Cloud API
 */

// 🔥 ScrollCache loaded globally from scroll-cache.js (loaded first in manifest)
// No import needed - ScrollCache class is available

// 🔥 Initialize ScrollCache instance
let scrollCacheInstance = null;
let isGeminiCloudProvider = false; // Set dynamically based on provider

/**
 * Initialize content script
 */
function initialize() {
  console.log('[Web Weaver] Content script loaded');
  
  // Listen for messages from background
  chrome.runtime.onMessage.addListener(handleMessage);
  
  // Notify background that content script is ready
  chrome.runtime.sendMessage({
    type: 'CONTENT_SCRIPT_READY',
    url: window.location.href
  }).catch(() => {
    // Background may not be ready yet, ignore
  });

  // 🔥 Check provider and initialize scroll cache if Gemini Cloud
  checkProviderAndInitCache();
}

/**
 * Check provider and initialize scroll cache (Gemini Cloud only)
 */
async function checkProviderAndInitCache() {
  try {
    // Get current provider from storage
    const settings = await chrome.storage.sync.get('aiProvider');
    const provider = settings.aiProvider || 'gemini-cloud';
    
    isGeminiCloudProvider = (provider === 'gemini-cloud');
    
    if (isGeminiCloudProvider) {
      // Initialize ScrollCache for Gemini Cloud
      scrollCacheInstance = new ScrollCache();
      scrollCacheInstance.updateURL(window.location.href);
      
      // Setup scroll listener
      setupScrollListener();
      
      console.log('[Web Weaver] Scroll cache initialized for Gemini Cloud');
    } else {
      console.log('[Web Weaver] Chrome AI detected - scroll cache disabled');
    }
  } catch (error) {
    console.error('[Web Weaver] Failed to check provider', error);
  }
}

/**
 * Setup scroll event listener (Gemini Cloud only)
 */
function setupScrollListener() {
  let scrollTimeout;
  
  window.addEventListener('scroll', () => {
    // Debounce scroll events (500ms delay)
    clearTimeout(scrollTimeout);
    
    scrollTimeout = setTimeout(async () => {
      if (isGeminiCloudProvider && scrollCacheInstance) {
        await captureAndCacheHTML();
      }
    }, 500);
  }, { passive: true });
  
  console.log('[Web Weaver] Scroll listener active');
}

/**
 * Capture visible HTML and add to cache
 */
async function captureAndCacheHTML() {
  try {
    // Get current visible HTML
    const visibleHTML = getPageHTML();
    
    // Add to cache
    const result = await scrollCacheInstance.addItem(visibleHTML, {
      timestamp: Date.now(),
      url: window.location.href,
      scrollY: window.scrollY
    });
    
    // Notify popup of cache update
    chrome.runtime.sendMessage({
      type: 'CACHE_UPDATED',
      cacheSize: scrollCacheInstance.getCacheSize()
    }).catch(() => {
      // Popup may not be open, ignore
    });
    
    console.log(`[Web Weaver] Cache updated: ${result.itemCount} items, ${result.totalKB} KB`);
  } catch (error) {
    console.error('[Web Weaver] Cache capture failed', error);
  }
}

/**
 * Handle messages from background
 * @param {Object} message - Message object
 * @param {Object} sender - Sender information
 * @param {Function} sendResponse - Response callback
 * @returns {boolean} True to indicate async response
 */
function handleMessage(message, sender, sendResponse) {
  const { type, data } = message;
  
  switch (type) {
    case 'GET_PAGE_HTML':
      sendResponse({
        success: true,
        html: getPageHTML()
      });
      break;
      
    case 'GET_PAGE_TEXT':
      sendResponse({
        success: true,
        text: getPageText()
      });
      break;
      
    case 'GET_PAGE_METADATA':
      sendResponse({
        success: true,
        metadata: getPageMetadata()
      });
      break;

    // 🔥 NEW: Get scroll cache (Gemini Cloud only)
    case 'GET_SCROLL_CACHE':
      if (isGeminiCloudProvider && scrollCacheInstance) {
        sendResponse({
          success: true,
          cache: scrollCacheInstance.getAllItems(),
          cacheSize: scrollCacheInstance.getCacheSize()
        });
      } else {
        sendResponse({
          success: false,
          message: 'Scroll cache not available (Chrome AI mode or cache disabled)'
        });
      }
      break;

    // 🔥 NEW: Clear scroll cache
    case 'CLEAR_SCROLL_CACHE':
      if (scrollCacheInstance) {
        scrollCacheInstance.clearCache();
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false });
      }
      break;
      
    case 'HIGHLIGHT_ELEMENTS':
      highlightElements(data.selector);
      sendResponse({ success: true });
      break;
      
    case 'CLEAR_HIGHLIGHTS':
      clearHighlights();
      sendResponse({ success: true });
      break;
      
    case 'SCROLL_TO_ELEMENT':
      scrollToElement(data.selector);
      sendResponse({ success: true });
      break;
      
    default:
      sendResponse({
        success: false,
        error: 'Unknown message type'
      });
  }
  
  return true; // Indicate async response
}

/**
 * Get full page HTML
 * @returns {string} Page HTML
 */
function getPageHTML() {
  return document.documentElement.outerHTML;
}

/**
 * Get page text content (visible text only)
 * @returns {string} Page text
 */
function getPageText() {
  return document.body.innerText || document.body.textContent;
}

/**
 * Get page metadata
 * @returns {Object} Metadata object
 */
function getPageMetadata() {
  const metadata = {
    title: document.title,
    url: window.location.href,
    domain: window.location.hostname,
    language: document.documentElement.lang || 'unknown',
    charset: document.characterSet,
    description: null,
    keywords: null,
    author: null,
    canonical: null,
    ogTitle: null,
    ogDescription: null,
    ogImage: null
  };
  
  // Extract meta tags
  const metaTags = document.getElementsByTagName('meta');
  
  for (const meta of metaTags) {
    const name = meta.getAttribute('name') || meta.getAttribute('property');
    const content = meta.getAttribute('content');
    
    if (name && content) {
      switch (name.toLowerCase()) {
        case 'description':
          metadata.description = content;
          break;
        case 'keywords':
          metadata.keywords = content;
          break;
        case 'author':
          metadata.author = content;
          break;
        case 'og:title':
          metadata.ogTitle = content;
          break;
        case 'og:description':
          metadata.ogDescription = content;
          break;
        case 'og:image':
          metadata.ogImage = content;
          break;
      }
    }
  }
  
  // Extract canonical URL
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) {
    metadata.canonical = canonical.getAttribute('href');
  }
  
  return metadata;
}

/**
 * Highlight elements matching selector
 * @param {string} selector - CSS selector
 */
function highlightElements(selector) {
  try {
    const elements = document.querySelectorAll(selector);
    
    elements.forEach(element => {
      element.style.outline = '3px solid #3b82f6';
      element.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
      element.classList.add('web-weaver-highlight');
    });
    
    console.log(`[Web Weaver] Highlighted ${elements.length} elements`);
  } catch (error) {
    console.error('[Web Weaver] Highlight failed', error);
  }
}

/**
 * Clear all highlights
 */
function clearHighlights() {
  try {
    const elements = document.querySelectorAll('.web-weaver-highlight');
    
    elements.forEach(element => {
      element.style.outline = '';
      element.style.backgroundColor = '';
      element.classList.remove('web-weaver-highlight');
    });
    
    console.log(`[Web Weaver] Cleared ${elements.length} highlights`);
  } catch (error) {
    console.error('[Web Weaver] Clear highlights failed', error);
  }
}

/**
 * Scroll to element matching selector
 * @param {string} selector - CSS selector
 */
function scrollToElement(selector) {
  try {
    const element = document.querySelector(selector);
    
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
      
      // Highlight scrolled element
      highlightElements(selector);
      
      // Clear highlight after 3 seconds
      setTimeout(() => {
        clearHighlights();
      }, 3000);
    }
  } catch (error) {
    console.error('[Web Weaver] Scroll to element failed', error);
  }
}

/**
 * Get structured data from page (JSON-LD)
 * @returns {Array<Object>} Array of structured data objects
 */
function getStructuredData() {
  const structuredData = [];
  
  try {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    
    scripts.forEach(script => {
      try {
        const data = JSON.parse(script.textContent);
        structuredData.push(data);
      } catch (e) {
        // Invalid JSON, skip
      }
    });
  } catch (error) {
    console.error('[Web Weaver] Get structured data failed', error);
  }
  
  return structuredData;
}

/**
 * Count elements matching selector
 * @param {string} selector - CSS selector
 * @returns {number} Element count
 */
function countElements(selector) {
  try {
    return document.querySelectorAll(selector).length;
  } catch (error) {
    return 0;
  }
}

/**
 * Check if page is dynamic (SPA detection)
 * @returns {boolean} True if page appears to be SPA
 */
function isDynamicPage() {
  // Check for common SPA frameworks
  const frameworks = [
    'react',
    'vue',
    'angular',
    'next',
    'nuxt',
    'gatsby'
  ];
  
  const html = document.documentElement.outerHTML.toLowerCase();
  
  return frameworks.some(framework => html.includes(framework));
}

/**
 * Wait for page to be fully loaded
 * @param {number} timeout - Timeout in ms
 * @returns {Promise<void>}
 */
function waitForPageLoad(timeout = 10000) {
  return new Promise((resolve) => {
    if (document.readyState === 'complete') {
      resolve();
      return;
    }
    
    const timeoutId = setTimeout(() => {
      resolve();
    }, timeout);
    
    window.addEventListener('load', () => {
      clearTimeout(timeoutId);
      resolve();
    }, { once: true });
  });
}

// Initialize when script loads
initialize();

// Wait for full page load
waitForPageLoad().then(() => {
  console.log('[Web Weaver] Page fully loaded');
  
  // Notify background
  chrome.runtime.sendMessage({
    type: 'PAGE_LOADED',
    url: window.location.href,
    isDynamic: isDynamicPage(),
    structuredData: getStructuredData()
  }).catch(() => {
    // Background may not be listening, ignore
  });
});

// Export functions for testing (if in test environment)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getPageHTML,
    getPageText,
    getPageMetadata,
    highlightElements,
    clearHighlights,
    scrollToElement,
    getStructuredData,
    countElements,
    isDynamicPage,
    waitForPageLoad
  };
}

// TEST SCENARIOS:
// 1. Content script loads and initializes
// 2. GET_PAGE_HTML returns full HTML
// 3. GET_PAGE_TEXT returns visible text only
// 4. GET_PAGE_METADATA extracts meta tags (description, keywords, author)
// 5. GET_PAGE_METADATA extracts Open Graph tags (og:title, og:description, og:image)
// 6. GET_PAGE_METADATA extracts canonical URL
// 7. HIGHLIGHT_ELEMENTS highlights matching elements
// 8. CLEAR_HIGHLIGHTS removes all highlights
// 9. SCROLL_TO_ELEMENT scrolls and highlights element
// 10. getStructuredData extracts JSON-LD structured data
// 11. countElements returns count of matching elements
// 12. isDynamicPage detects SPA frameworks
// 13. waitForPageLoad waits until page fully loaded
// 14. Message passing between content script and background
// 15. CONTENT_SCRIPT_READY notification sent on load
// 16. PAGE_LOADED notification sent after full load
// 🔥 NEW: 17. Scroll cache captures HTML on scroll (Gemini Cloud only)
// 🔥 NEW: 18. GET_SCROLL_CACHE returns cached items
// 🔥 NEW: 19. CLEAR_SCROLL_CACHE clears cache
// 🔥 NEW: 20. CACHE_UPDATED notifications sent to popup
// 🔥 NEW: 21. Chrome AI mode bypasses scroll cache completely

// VERSION: v1.0.0 | LAST UPDATED: 2025-10-26 | FEATURE: Popup UI Logic

/**
 * Popup UI Controller
 * Manages popup interface, user interactions, and communication with background
 */

// State management
const state = {
  currentProvider: null,
  currentModel: null,
  extractionMode: 'extract_all',
  contentType: 'auto',
  isExtracting: false,
  lastResult: null,
  rateLimits: {
    rpm: { current: 0, limit: 0 },
    rpd: { current: 0, limit: 0 }
  }
};

// DOM Elements
const elements = {
  // Provider
  providerChromeAI: null,
  providerGeminiCloud: null,
  providerStatus: null,
  modelSelector: null,
  modelSelect: null,
  apiKeyWarning: null,
  addApiKeyLink: null,
  
  // Extraction
  modeExtractAll: null,
  modeExtractMain: null,
  contentTypeSelect: null,
  extractBtn: null,
  
  // Rate Limits
  rateLimitSection: null,
  rpmProgress: null,
  rpmText: null,
  rpdProgress: null,
  rpdText: null,
  countdownTimer: null,
  countdownText: null,
  
  // Progress
  progressSection: null,
  progressText: null,
  
  // Results
  resultsSection: null,
  closeResultsBtn: null,
  itemCount: null,
  duration: null,
  qualityScore: null,
  resultsJson: null,
  exportJsonBtn: null,
  exportCsvBtn: null,
  copyJsonBtn: null,
  
  // Theme & Settings
  themeToggle: null,
  settingsBtn: null,
  
  // Notifications
  notificationsContainer: null,
  
  // Footer
  historyLink: null,
  helpLink: null,
  feedbackLink: null
};

/**
 * Initialize popup
 */
async function initialize() {
  console.log('[Popup] Initializing...');
  
  // Cache DOM elements
  cacheElements();
  
  // Initialize theme
  initializeTheme();
  
  // Load current state
  await loadState();
  
  // Setup event listeners
  setupEventListeners();
  
  // Update UI
  updateUI();
  
  console.log('[Popup] Initialized');
}

/**
 * Cache DOM elements
 */
function cacheElements() {
  // Provider
  elements.providerChromeAI = document.getElementById('provider-chrome-ai');
  elements.providerGeminiCloud = document.getElementById('provider-gemini-cloud');
  elements.providerStatus = document.getElementById('provider-status');
  elements.modelSelector = document.getElementById('model-selector');
  elements.modelSelect = document.getElementById('model-select');
  elements.apiKeyWarning = document.getElementById('api-key-warning');
  elements.addApiKeyLink = document.getElementById('add-api-key-link');
  
  // Extraction
  elements.modeExtractAll = document.getElementById('mode-extract-all');
  elements.modeExtractMain = document.getElementById('mode-extract-main');
  elements.contentTypeSelect = document.getElementById('content-type-select');
  elements.extractBtn = document.getElementById('extract-btn');
  
  // Rate Limits
  elements.rateLimitSection = document.getElementById('rate-limit-section');
  elements.rpmProgress = document.getElementById('rpm-progress');
  elements.rpmText = document.getElementById('rpm-text');
  elements.rpdProgress = document.getElementById('rpd-progress');
  elements.rpdText = document.getElementById('rpd-text');
  elements.countdownTimer = document.getElementById('countdown-timer');
  elements.countdownText = document.getElementById('countdown-text');
  
  // Progress
  elements.progressSection = document.getElementById('progress-section');
  elements.progressText = document.getElementById('progress-text');
  
  // Results
  elements.resultsSection = document.getElementById('results-section');
  elements.closeResultsBtn = document.getElementById('close-results-btn');
  elements.itemCount = document.getElementById('item-count');
  elements.duration = document.getElementById('duration');
  elements.qualityScore = document.getElementById('quality-score');
  elements.resultsJson = document.getElementById('results-json');
  elements.exportJsonBtn = document.getElementById('export-json-btn');
  elements.exportCsvBtn = document.getElementById('export-csv-btn');
  elements.copyJsonBtn = document.getElementById('copy-json-btn');
  
  // Theme & Settings
  elements.themeToggle = document.getElementById('theme-toggle');
  elements.settingsBtn = document.getElementById('settings-btn');
  
  // Notifications
  elements.notificationsContainer = document.getElementById('notifications-container');
  
  // Footer
  elements.historyLink = document.getElementById('history-link');
  elements.helpLink = document.getElementById('help-link');
  elements.feedbackLink = document.getElementById('feedback-link');
}

/**
 * Initialize theme system
 */
function initializeTheme() {
  // Load saved theme
  const savedTheme = localStorage.getItem('theme') || 'auto';
  document.body.setAttribute('data-theme', savedTheme);
  
  console.log(`[Popup] Theme set to: ${savedTheme}`);
}

/**
 * Toggle theme
 */
function toggleTheme() {
  const currentTheme = document.body.getAttribute('data-theme');
  let newTheme;
  
  switch (currentTheme) {
    case 'light':
      newTheme = 'dark';
      break;
    case 'dark':
      newTheme = 'auto';
      break;
    default:
      newTheme = 'light';
  }
  
  document.body.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  
  showNotification('success', 'Theme Updated', `Switched to ${newTheme} theme`);
  
  console.log(`[Popup] Theme changed: ${currentTheme} → ${newTheme}`);
}

/**
 * Load current state from background
 */
async function loadState() {
  try {
    // Get settings
    const settingsResponse = await sendMessage({ type: 'GET_SETTINGS' });
    if (settingsResponse.success) {
      const settings = settingsResponse.settings;
      
      // Set provider
      state.currentProvider = settings.ai_provider?.selected_provider || 'chrome_ai';
      
      // Set model
      const modelMap = settings.ai_provider?.selected_model || {};
      state.currentModel = modelMap[state.currentProvider];
      
      // Set extraction mode
      state.extractionMode = settings.extraction?.mode || 'extract_all';
      
      // Set content type
      state.contentType = settings.extraction?.content_type || 'auto';
    }
    
    // Check provider status
    await checkProviderStatus(state.currentProvider);
    
    // Update rate limits if Gemini Cloud
    if (state.currentProvider === 'gemini_cloud' && state.currentModel) {
      await updateRateLimits();
    }
    
    console.log('[Popup] State loaded', state);
    
  } catch (error) {
    console.error('[Popup] Failed to load state', error);
    showNotification('error', 'Load Error', 'Failed to load extension state');
  }
}

/**
 * Check provider availability status
 */
async function checkProviderStatus(providerId) {
  try {
    const response = await sendMessage({
      type: 'GET_PROVIDER_STATUS',
      data: { providerId }
    });
    
    if (response.success) {
      const { available, reason } = response.status;
      
      // Update status badge
      updateProviderStatusBadge(available ? 'available' : 'unavailable');
      
      // Show warning if unavailable
      if (!available && reason) {
        console.warn(`[Popup] Provider ${providerId} unavailable:`, reason);
      }
    }
    
  } catch (error) {
    console.error('[Popup] Provider status check failed', error);
    updateProviderStatusBadge('unknown');
  }
}

/**
 * Update provider status badge
 */
function updateProviderStatusBadge(status) {
  elements.providerStatus.className = 'status-badge';
  
  switch (status) {
    case 'available':
      elements.providerStatus.classList.add('status-available');
      elements.providerStatus.textContent = 'Available';
      break;
    case 'unavailable':
      elements.providerStatus.classList.add('status-unavailable');
      elements.providerStatus.textContent = 'Unavailable';
      break;
    default:
      elements.providerStatus.classList.add('status-unknown');
      elements.providerStatus.textContent = 'Unknown';
  }
}

/**
 * Send message to background
 */
function sendMessage(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, response => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}
/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Provider selection
  elements.providerChromeAI.addEventListener('change', handleProviderChange);
  elements.providerGeminiCloud.addEventListener('change', handleProviderChange);
  
  // Model selection
  elements.modelSelect.addEventListener('change', handleModelChange);
  
  // Extraction mode
  elements.modeExtractAll.addEventListener('change', handleModeChange);
  elements.modeExtractMain.addEventListener('change', handleModeChange);
  
  // Content type
  elements.contentTypeSelect.addEventListener('change', handleContentTypeChange);
  
  // Extract button
  elements.extractBtn.addEventListener('click', handleExtractClick);
  
  // Results actions
  elements.closeResultsBtn.addEventListener('click', hideResults);
  elements.exportJsonBtn.addEventListener('click', handleExportJson);
  elements.exportCsvBtn.addEventListener('click', handleExportCsv);
  elements.copyJsonBtn.addEventListener('click', handleCopyJson);
  
  // Theme toggle
  elements.themeToggle.addEventListener('click', toggleTheme);
  
  // Settings
  elements.settingsBtn.addEventListener('click', openSettings);
  
  // API key link
  elements.addApiKeyLink.addEventListener('click', (e) => {
    e.preventDefault();
    openSettings();
  });
  
  // Footer links
  elements.historyLink.addEventListener('click', (e) => {
    e.preventDefault();
    openHistory();
  });
  
  elements.helpLink.addEventListener('click', (e) => {
    e.preventDefault();
    openHelp();
  });
  
  elements.feedbackLink.addEventListener('click', (e) => {
    e.preventDefault();
    openFeedback();
  });
  
  console.log('[Popup] Event listeners attached');
}

/**
 * Handle provider change
 */
async function handleProviderChange(e) {
  const providerId = e.target.value;
  
  if (providerId === state.currentProvider) {
    return;
  }
  
  try {
    // Switch provider
    const response = await sendMessage({
      type: 'SWITCH_PROVIDER',
      data: { providerId }
    });
    
    if (response.success) {
      state.currentProvider = providerId;
      
      // Check new provider status
      await checkProviderStatus(providerId);
      
      // Update UI
      updateUI();
      
      showNotification('success', 'Provider Switched', `Now using ${getProviderName(providerId)}`);
      
      // Update rate limits if Gemini Cloud
      if (providerId === 'gemini_cloud') {
        await updateRateLimits();
      }
    } else {
      // Revert selection
      updateProviderSelection();
      showNotification('error', 'Provider Switch Failed', response.error);
    }
    
  } catch (error) {
    console.error('[Popup] Provider switch failed', error);
    updateProviderSelection();
    showNotification('error', 'Provider Switch Failed', error.message);
  }
}

/**
 * Handle model change
 */
async function handleModelChange(e) {
  const modelId = e.target.value;
  
  if (modelId === state.currentModel) {
    return;
  }
  
  try {
    const response = await sendMessage({
      type: 'SWITCH_MODEL',
      data: {
        providerId: state.currentProvider,
        modelId
      }
    });
    
    if (response.success) {
      state.currentModel = modelId;
      
      showNotification('success', 'Model Switched', `Now using ${modelId}`);
      
      // Update rate limits
      await updateRateLimits();
    } else {
      // Revert selection
      elements.modelSelect.value = state.currentModel;
      showNotification('error', 'Model Switch Failed', response.error);
    }
    
  } catch (error) {
    console.error('[Popup] Model switch failed', error);
    elements.modelSelect.value = state.currentModel;
    showNotification('error', 'Model Switch Failed', error.message);
  }
}

/**
 * Handle extraction mode change
 */
function handleModeChange(e) {
  state.extractionMode = e.target.value;
  console.log(`[Popup] Extraction mode: ${state.extractionMode}`);
}

/**
 * Handle content type change
 */
function handleContentTypeChange(e) {
  state.contentType = e.target.value;
  console.log(`[Popup] Content type: ${state.contentType}`);
}

/**
 * Handle extract button click
 */
async function handleExtractClick() {
  if (state.isExtracting) {
    return;
  }
  
  state.isExtracting = true;
  
  try {
    // Show progress
    showProgress('Extracting data from page...');
    hideResults();
    
    // Start extraction
    const response = await sendMessage({
      type: 'EXTRACT',
      data: {
        options: {
          mode: state.extractionMode,
          content_type: state.contentType
        }
      }
    });
    
    hideProgress();
    
    if (response.success) {
      state.lastResult = response.result;
      displayResults(response.result);
      
      // Update rate limits
      if (state.currentProvider === 'gemini_cloud') {
        await updateRateLimits();
      }
      
      showNotification('success', 'Extraction Complete', 
        `Extracted ${response.result.metadata.itemCount || 0} items in ${Math.round(response.result.metadata.duration / 1000)}s`);
    } else {
      showNotification('error', 'Extraction Failed', response.error);
    }
    
  } catch (error) {
    hideProgress();
    console.error('[Popup] Extraction failed', error);
    showNotification('error', 'Extraction Failed', error.message);
    
  } finally {
    state.isExtracting = false;
    updateExtractButton();
  }
}

/**
 * Show progress indicator
 */
function showProgress(message) {
  elements.progressText.textContent = message;
  elements.progressSection.classList.remove('hidden');
  elements.extractBtn.disabled = true;
}

/**
 * Hide progress indicator
 */
function hideProgress() {
  elements.progressSection.classList.add('hidden');
  elements.extractBtn.disabled = false;
}

/**
 * Display extraction results
 */
function displayResults(result) {
  const { data, metadata, qualityScore } = result;
  
  // Update summary
  elements.itemCount.textContent = Array.isArray(data) ? data.length : 1;
  elements.duration.textContent = `${Math.round(metadata.duration / 1000)}s`;
  
  // Update quality score
  if (qualityScore !== null) {
    elements.qualityScore.textContent = qualityScore;
    elements.qualityScore.setAttribute('data-score', getQualityLevel(qualityScore));
  } else {
    elements.qualityScore.textContent = '-';
    elements.qualityScore.removeAttribute('data-score');
  }
  
  // Display JSON
  elements.resultsJson.textContent = JSON.stringify(data, null, 2);
  
  // Show results section
  elements.resultsSection.classList.remove('hidden');
  
  // Scroll to results
  elements.resultsSection.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Hide results
 */
function hideResults() {
  elements.resultsSection.classList.add('hidden');
}

/**
 * Get quality level based on score
 */
function getQualityLevel(score) {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 60) return 'fair';
  return 'poor';
}

/**
 * Get provider display name
 */
function getProviderName(providerId) {
  return providerId === 'chrome_ai' ? 'Chrome Built-in AI' : 'Gemini Cloud API';
}
/**
 * Update rate limits display
 */
async function updateRateLimits() {
  if (state.currentProvider !== 'gemini_cloud' || !state.currentModel) {
    elements.rateLimitSection.classList.add('hidden');
    return;
  }
  
  try {
    const response = await sendMessage({
      type: 'GET_RATE_LIMIT_STATUS',
      data: { modelId: state.currentModel }
    });
    
    if (response.success) {
      const { rpm, rpd } = response.status;
      
      state.rateLimits = { rpm, rpd };
      
      // Update RPM
      elements.rpmProgress.style.width = `${rpm.percentage}%`;
      elements.rpmProgress.setAttribute('data-percentage', 
        rpm.percentage >= 90 ? 'critical' : rpm.percentage >= 70 ? 'high' : 'normal'
      );
      elements.rpmText.textContent = `${rpm.current}/${rpm.limit} RPM`;
      
      // Update RPD
      elements.rpdProgress.style.width = `${rpd.percentage}%`;
      elements.rpdProgress.setAttribute('data-percentage',
        rpd.percentage >= 90 ? 'critical' : rpd.percentage >= 70 ? 'high' : 'normal'
      );
      elements.rpdText.textContent = `${rpd.current}/${rpd.limit} RPD`;
      
      // Show rate limit section
      elements.rateLimitSection.classList.remove('hidden');
    }
    
  } catch (error) {
    console.error('[Popup] Failed to update rate limits', error);
  }
}

/**
 * Handle export JSON
 */
function handleExportJson() {
  if (!state.lastResult) {
    return;
  }
  
  try {
    const jsonString = JSON.stringify(state.lastResult.data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `web-weaver-export-${timestamp}.json`;
    
    // Trigger download
    chrome.downloads.download({
      url: url,
      filename: filename,
      saveAs: true
    });
    
    showNotification('success', 'Export Complete', 'JSON file downloaded');
    
  } catch (error) {
    console.error('[Popup] Export JSON failed', error);
    showNotification('error', 'Export Failed', error.message);
  }
}

/**
 * Handle export CSV
 */
async function handleExportCsv() {
  if (!state.lastResult) {
    return;
  }
  
  try {
    showProgress('Converting to CSV...');
    
    const response = await sendMessage({
      type: 'EXPORT_CSV',
      data: {
        data: state.lastResult.data,
        mode: 'standard'
      }
    });
    
    hideProgress();
    
    if (response.success) {
      const blob = new Blob([response.csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `web-weaver-export-${timestamp}.csv`;
      
      // Trigger download
      chrome.downloads.download({
        url: url,
        filename: filename,
        saveAs: true
      });
      
      showNotification('success', 'Export Complete', 'CSV file downloaded');
    } else {
      showNotification('error', 'Export Failed', response.error);
    }
    
  } catch (error) {
    hideProgress();
    console.error('[Popup] Export CSV failed', error);
    showNotification('error', 'Export Failed', error.message);
  }
}

/**
 * Handle copy JSON to clipboard
 */
async function handleCopyJson() {
  if (!state.lastResult) {
    return;
  }
  
  try {
    const jsonString = JSON.stringify(state.lastResult.data, null, 2);
    
    await navigator.clipboard.writeText(jsonString);
    
    showNotification('success', 'Copied', 'JSON copied to clipboard');
    
  } catch (error) {
    console.error('[Popup] Copy failed', error);
    showNotification('error', 'Copy Failed', error.message);
  }
}

/**
 * Show notification
 */
function showNotification(type, title, message) {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  
  notification.innerHTML = `
    <div class="notification-icon">
      ${getNotificationIcon(type)}
    </div>
    <div class="notification-content">
      <div class="notification-title">${title}</div>
      <div class="notification-message">${message}</div>
    </div>
    <button class="notification-close">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M18 6L6 18M6 6l12 12" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>
  `;
  
  // Add to container
  elements.notificationsContainer.appendChild(notification);
  
  // Close button
  const closeBtn = notification.querySelector('.notification-close');
  closeBtn.addEventListener('click', () => {
    dismissNotification(notification);
  });
  
  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    dismissNotification(notification);
  }, 5000);
}

/**
 * Dismiss notification
 */
function dismissNotification(notification) {
  notification.classList.add('notification-exit');
  
  setTimeout(() => {
    notification.remove();
  }, 300);
}

/**
 * Get notification icon SVG
 */
function getNotificationIcon(type) {
  const icons = {
    success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>',
    error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>',
    warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>',
    info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/></svg>'
  };
  
  return icons[type] || icons.info;
}

/**
 * Update UI based on current state
 */
function updateUI() {
  // Update provider selection
  updateProviderSelection();
  
  // Update model selector visibility
  if (state.currentProvider === 'gemini_cloud') {
    elements.modelSelector.classList.remove('hidden');
    elements.modelSelect.value = state.currentModel || 'gemini-2.0-flash-lite';
  } else {
    elements.modelSelector.classList.add('hidden');
  }
  
  // Update API key warning
  if (state.currentProvider === 'gemini_cloud') {
    checkApiKeyStatus();
  } else {
    elements.apiKeyWarning.classList.add('hidden');
  }
  
  // Update extraction mode
  if (state.extractionMode === 'extract_all') {
    elements.modeExtractAll.checked = true;
  } else {
    elements.modeExtractMain.checked = true;
  }
  
  // Update content type
  elements.contentTypeSelect.value = state.contentType;
  
  // Update extract button
  updateExtractButton();
}

/**
 * Update provider selection radio buttons
 */
function updateProviderSelection() {
  if (state.currentProvider === 'chrome_ai') {
    elements.providerChromeAI.checked = true;
  } else {
    elements.providerGeminiCloud.checked = true;
  }
}

/**
 * Update extract button state
 */
function updateExtractButton() {
  elements.extractBtn.disabled = state.isExtracting;
  elements.extractBtn.innerHTML = state.isExtracting 
    ? '<span class="spinner"></span> Extracting...'
    : '<svg class="btn-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m14-7l-5-5-5 5m5-5v12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Extract Data';
}

/**
 * Check API key status
 */
async function checkApiKeyStatus() {
  try {
    const response = await sendMessage({ type: 'GET_API_KEY_STATUS' });
    
    if (response.success) {
      if (!response.exists) {
        elements.apiKeyWarning.classList.remove('hidden');
      } else {
        elements.apiKeyWarning.classList.add('hidden');
      }
    }
    
  } catch (error) {
    console.error('[Popup] API key check failed', error);
  }
}

/**
 * Open settings page
 */
function openSettings() {
  chrome.tabs.create({
    url: chrome.runtime.getURL('src/ui/settings/settings.html')
  });
}

/**
 * Open history page
 */
function openHistory() {
  chrome.tabs.create({
    url: chrome.runtime.getURL('src/ui/history/history.html')
  });
}

/**
 * Open help page
 */
function openHelp() {
  chrome.tabs.create({
    url: 'https://github.com/yourrepo/web-weaver/wiki'
  });
}

/**
 * Open feedback form
 */
function openFeedback() {
  chrome.tabs.create({
    url: 'https://github.com/yourrepo/web-weaver/issues/new'
  });
}
/**
 * Listen for messages from background
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { type, data } = message;
  
  switch (type) {
    case 'SHOW_NOTIFICATION':
      handleShowNotification(data);
      break;
      
    case 'DISMISS_NOTIFICATION':
      handleDismissNotification(data);
      break;
      
    case 'RATE_LIMIT_WAIT':
      handleRateLimitWait(data);
      break;
      
    case 'COUNTDOWN_UPDATE':
      handleCountdownUpdate(data);
      break;
      
    case 'COUNTDOWN_COMPLETE':
      handleCountdownComplete(data);
      break;
      
    case 'COUNTDOWN_CANCEL':
      handleCountdownCancel(data);
      break;
      
    case 'RATE_LIMIT_DISPLAY':
      handleRateLimitDisplay(data);
      break;
  }
  
  return true;
});

/**
 * Handle show notification message
 */
function handleShowNotification(data) {
  if (!data || !data.notification) {
    logger.warn('Invalid notification data');
    return;
  }
  const { notification } = data;
  showNotification(
    notification.type,
    notification.title,
    notification.message
  );
}

/**
 * Handle dismiss notification message
 */
function handleDismissNotification(data) {
  const { notificationId } = data;
  
  // Find and dismiss notification by ID
  const notification = document.querySelector(`[data-notification-id="${notificationId}"]`);
  if (notification) {
    dismissNotification(notification);
  }
}

/**
 * Handle rate limit wait message
 */
function handleRateLimitWait(data) {
  const { limitType, waitTime, message } = data;
  
  // Show countdown timer
  elements.countdownTimer.classList.remove('hidden');
  elements.countdownText.textContent = message;
  
  // Disable extract button
  elements.extractBtn.disabled = true;
  
  console.log(`[Popup] Rate limit wait: ${limitType}, ${waitTime}s`);
}

/**
 * Handle countdown update message
 */
function handleCountdownUpdate(data) {
  const { remaining, formatted } = data;
  
  elements.countdownText.textContent = `Next extraction in ${formatted}`;
}

/**
 * Handle countdown complete message
 */
function handleCountdownComplete(data) {
  // Hide countdown timer
  elements.countdownTimer.classList.add('hidden');
  
  // Enable extract button
  elements.extractBtn.disabled = false;
  
  showNotification('info', 'Ready', 'Rate limit reset, you can extract again');
}

/**
 * Handle countdown cancel message
 */
function handleCountdownCancel(data) {
  elements.countdownTimer.classList.add('hidden');
  elements.extractBtn.disabled = false;
}

/**
 * Handle rate limit display message
 */
function handleRateLimitDisplay(data) {
  const { rpm, rpd } = data;
  
  state.rateLimits = { rpm, rpd };
  
  // Update display
  elements.rpmProgress.style.width = `${rpm.percentage}%`;
  elements.rpmProgress.style.backgroundColor = rpm.progressColor;
  elements.rpmText.textContent = rpm.display;
  
  elements.rpdProgress.style.width = `${rpd.percentage}%`;
  elements.rpdProgress.style.backgroundColor = rpd.progressColor;
  elements.rpdText.textContent = rpd.display;
  
  // Show rate limit section
  elements.rateLimitSection.classList.remove('hidden');
}

/**
 * Handle keyboard shortcuts
 */
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + E: Extract
  if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
    e.preventDefault();
    if (!state.isExtracting) {
      handleExtractClick();
    }
  }
  
  // Ctrl/Cmd + ,: Settings
  if ((e.ctrlKey || e.metaKey) && e.key === ',') {
    e.preventDefault();
    openSettings();
  }
  
  // Escape: Close results
  if (e.key === 'Escape') {
    if (!elements.resultsSection.classList.contains('hidden')) {
      hideResults();
    }
  }
});

/**
 * Initialize when DOM is ready
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// TEST SCENARIOS:
// 1. Popup opens and loads current state from background
// 2. Theme toggle cycles through light → dark → auto
// 3. Provider switch (Chrome AI ↔ Gemini Cloud)
// 4. Model switch for Gemini Cloud
// 5. Extraction mode change (extract_all ↔ extract_main)
// 6. Content type change
// 7. Extract button triggers extraction
// 8. Progress shown during extraction
// 9. Results displayed after successful extraction
// 10. Results closed via close button
// 11. Export JSON downloads file
// 12. Export CSV converts and downloads file
// 13. Copy JSON to clipboard
// 14. Rate limits update after extraction
// 15. Rate limit progress bars change color based on usage
// 16. Countdown timer shown when rate limit hit
// 17. API key warning shown when missing
// 18. Notifications appear and auto-dismiss
// 19. Notification manual dismiss
// 20. Keyboard shortcuts (Ctrl+E, Ctrl+,, Escape)
// 21. Settings page opens in new tab
// 22. History page opens in new tab
// 23. Help/Feedback links open external URLs
// 24. Message listeners handle background notifications
// 25. Quality score badge color based on score level

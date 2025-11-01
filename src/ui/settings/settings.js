// VERSION: v1.0.0 | LAST UPDATED: 2025-10-26 | FEATURE: Settings Page Logic

/**
 * Settings Page Controller
 * Manages settings UI, form inputs, and persistence
 */

// State
const state = {
  settings: null,
  isDirty: false,
  pendingConfirmation: null
};

// DOM Elements
const elements = {
  // Header
  backBtn: null,
  themeToggle: null,
  
  // API Key
  apiKeyInput: null,
  toggleVisibilityBtn: null,
  rememberApiKey: null,
  apiKeyStatus: null,
  apiKeyStatusText: null,
  saveApiKeyBtn: null,
  validateApiKeyBtn: null,
  clearApiKeyBtn: null,
  
  // Provider
  providerChromeAI: null,
  providerGeminiCloud: null,
  chromeAIStatus: null,
  geminiCloudStatus: null,
  modelSelection: null,
  modelSelect: null,
  
  // Extraction
  extractionModeSelect: null,
  contentTypeSelect: null,
  timeoutInput: null,
  
  // Smart Features
  qualityScoreEnabled: null,
  deduplicationEnabled: null,
  comparisonsEnabled: null,
  recommendationsEnabled: null,
  trendsEnabled: null,
  
  // Preprocessing
  removeScripts: null,
  removeStyles: null,
  removeComments: null,
  removeNavigation: null,
  removeFooter: null,
  maxHtmlSize: null,
  
  // Advanced
  logLevelSelect: null,
  debugMode: null,
  audioFeedback: null,
  themeSelect: null,
  
  // Data Management
  exportSettingsBtn: null,
  importSettingsBtn: null,
  importSettingsInput: null,
  resetSettingsBtn: null,
  clearAllDataBtn: null,
  
  // Save
  saveSettingsBtn: null,
  
  // Modal
  modal: null,
  modalTitle: null,
  modalMessage: null,
  modalConfirmBtn: null,
  modalCancelBtn: null,
  
  // Notifications
  notificationsContainer: null
};

/**
 * Initialize settings page
 */
async function initialize() {
  console.log('[Settings] Initializing...');
  
  // Cache DOM elements
  cacheElements();
  
  // Initialize theme
  initializeTheme();
  
  // Load current settings
  await loadSettings();
  
  // Setup event listeners
  setupEventListeners();
  
  // Check provider status
  await checkProviderStatuses();
  
  console.log('[Settings] Initialized');
}

/**
 * Cache DOM elements
 */
function cacheElements() {
  // Header
  elements.backBtn = document.getElementById('back-btn');
  elements.themeToggle = document.getElementById('theme-toggle');
  
  // API Key
  elements.apiKeyInput = document.getElementById('api-key-input');
  elements.toggleVisibilityBtn = document.getElementById('toggle-visibility-btn');
  elements.rememberApiKey = document.getElementById('remember-api-key');
  elements.apiKeyStatus = document.getElementById('api-key-status');
  elements.apiKeyStatusText = document.getElementById('api-key-status-text');
  elements.saveApiKeyBtn = document.getElementById('save-api-key-btn');
  elements.validateApiKeyBtn = document.getElementById('validate-api-key-btn');
  elements.clearApiKeyBtn = document.getElementById('clear-api-key-btn');
  
  // Provider
  elements.providerChromeAI = document.getElementById('provider-chrome-ai');
  elements.providerGeminiCloud = document.getElementById('provider-gemini-cloud');
  elements.chromeAIStatus = document.getElementById('chrome-ai-status');
  elements.geminiCloudStatus = document.getElementById('gemini-cloud-status');
  elements.modelSelection = document.getElementById('model-selection');
  elements.modelSelect = document.getElementById('model-select');
  
  // Extraction
  elements.extractionModeSelect = document.getElementById('extraction-mode-select');
  elements.contentTypeSelect = document.getElementById('content-type-select');
  elements.timeoutInput = document.getElementById('timeout-input');
  
  // Smart Features
  elements.qualityScoreEnabled = document.getElementById('quality-score-enabled');
  elements.deduplicationEnabled = document.getElementById('deduplication-enabled');
  elements.comparisonsEnabled = document.getElementById('comparisons-enabled');
  elements.recommendationsEnabled = document.getElementById('recommendations-enabled');
  elements.trendsEnabled = document.getElementById('trends-enabled');
  
  // Preprocessing
  elements.removeScripts = document.getElementById('remove-scripts');
  elements.removeStyles = document.getElementById('remove-styles');
  elements.removeComments = document.getElementById('remove-comments');
  elements.removeNavigation = document.getElementById('remove-navigation');
  elements.removeFooter = document.getElementById('remove-footer');
  elements.maxHtmlSize = document.getElementById('max-html-size');
  
  // Advanced
  elements.logLevelSelect = document.getElementById('log-level-select');
  elements.debugMode = document.getElementById('debug-mode');
  elements.audioFeedback = document.getElementById('audio-feedback');
  elements.themeSelect = document.getElementById('theme-select');
  
  // Data Management
  elements.exportSettingsBtn = document.getElementById('export-settings-btn');
  elements.importSettingsBtn = document.getElementById('import-settings-btn');
  elements.importSettingsInput = document.getElementById('import-settings-input');
  elements.resetSettingsBtn = document.getElementById('reset-settings-btn');
  elements.clearAllDataBtn = document.getElementById('clear-all-data-btn');
  
  // Save
  elements.saveSettingsBtn = document.getElementById('save-settings-btn');
  
  // Modal
  elements.modal = document.getElementById('confirmation-modal');
  elements.modalTitle = document.getElementById('modal-title');
  elements.modalMessage = document.getElementById('modal-message');
  elements.modalConfirmBtn = document.getElementById('modal-confirm-btn');
  elements.modalCancelBtn = document.getElementById('modal-cancel-btn');
  
  // Notifications
  elements.notificationsContainer = document.getElementById('notifications-container');
}

/**
 * Initialize theme
 */
function initializeTheme() {
  const savedTheme = localStorage.getItem('theme') || 'auto';
  document.body.setAttribute('data-theme', savedTheme);
  
  if (elements.themeSelect) {
    elements.themeSelect.value = savedTheme;
  }
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
  
  if (elements.themeSelect) {
    elements.themeSelect.value = newTheme;
  }
  
  showNotification('success', 'Theme Updated', `Switched to ${newTheme} theme`);
}

/**
 * Load current settings
 */
async function loadSettings() {
  try {
    const response = await sendMessage({ type: 'GET_SETTINGS' });
    
    if (response.success) {
      state.settings = response.settings;
      populateForm(state.settings);
      state.isDirty = false;
    } else {
      showNotification('error', 'Load Failed', 'Could not load settings');
    }
    
  } catch (error) {
    console.error('[Settings] Load failed', error);
    showNotification('error', 'Load Failed', error.message);
  }
}

/**
 * Populate form with settings
 */
function populateForm(settings) {
  // Provider
  if (settings.ai_provider?.selected_provider === 'chrome_ai') {
    elements.providerChromeAI.checked = true;
  } else {
    elements.providerGeminiCloud.checked = true;
  }
  
  updateProviderUI();
  
  // Model
  const modelMap = settings.ai_provider?.selected_model || {};
  const geminiModel = modelMap.gemini_cloud || 'gemini-2.0-flash-lite';
  elements.modelSelect.value = geminiModel;
  
  // Extraction
  elements.extractionModeSelect.value = settings.extraction?.mode || 'extract_all';
  elements.contentTypeSelect.value = settings.extraction?.content_type || 'auto';
  elements.timeoutInput.value = settings.extraction?.timeout_seconds || 60;
  
  // Smart Features
  elements.qualityScoreEnabled.checked = settings.smart_features?.quality_score?.enabled || false;
  elements.deduplicationEnabled.checked = settings.smart_features?.deduplication?.enabled || false;
  elements.comparisonsEnabled.checked = settings.smart_features?.comparisons?.enabled || false;
  elements.recommendationsEnabled.checked = settings.smart_features?.recommendations?.enabled || false;
  elements.trendsEnabled.checked = settings.smart_features?.trends?.enabled || false;
  
  // Preprocessing
  elements.removeScripts.checked = settings.preprocessing?.remove_scripts !== false;
  elements.removeStyles.checked = settings.preprocessing?.remove_styles !== false;
  elements.removeComments.checked = settings.preprocessing?.remove_comments !== false;
  elements.removeNavigation.checked = settings.preprocessing?.remove_navigation !== false;
  elements.removeFooter.checked = settings.preprocessing?.remove_footer !== false;
  elements.maxHtmlSize.value = settings.preprocessing?.max_html_size_kb || 500;
  
  // Advanced
  elements.logLevelSelect.value = settings.advanced?.log_level || 'info';
  elements.debugMode.checked = settings.advanced?.debug_mode || false;
  elements.audioFeedback.checked = settings.advanced?.audio_feedback || false;
  
  console.log('[Settings] Form populated');
}

/**
 * Toggle API key visibility
 */
function toggleApiKeyVisibility() {
  const input = elements.apiKeyInput;
  
  if (input.type === 'password') {
    input.type = 'text';
  } else {
    input.type = 'password';
  }
}

/**
 * Save API key
 */
async function saveApiKey() {
  const apiKey = elements.apiKeyInput.value.trim();
  const rememberMe = elements.rememberApiKey.checked;
  
  if (!apiKey) {
    showNotification('warning', 'Empty API Key', 'Please enter an API key');
    return;
  }
  
  try {
    const response = await sendMessage({
      type: 'SAVE_API_KEY',
      data: { apiKey, rememberMe }
    });
    
    if (response.success) {
      showApiKeyStatus('success', 'API key saved successfully');
      showNotification('success', 'Saved', 'API key saved and encrypted');
    } else {
      showApiKeyStatus('error', response.error);
      showNotification('error', 'Save Failed', response.error);
    }
    
  } catch (error) {
    console.error('[Settings] Save API key failed', error);
    showApiKeyStatus('error', error.message);
    showNotification('error', 'Save Failed', error.message);
  }
}

/**
 * Validate API key
 */
async function validateApiKey() {
  try {
    showNotification('info', 'Testing...', 'Validating API key connection');
    
    // TODO: Add actual API validation endpoint
    // For now, just check if key exists and has correct format
    const apiKey = elements.apiKeyInput.value.trim();
    
    if (!apiKey) {
      showNotification('warning', 'Empty API Key', 'Please enter an API key first');
      return;
    }
    
    if (!apiKey.startsWith('AIza')) {
      showNotification('error', 'Invalid Format', 'API key should start with "AIza"');
      return;
    }
    
    showNotification('success', 'Valid', 'API key format is valid');
    
  } catch (error) {
    console.error('[Settings] Validate API key failed', error);
    showNotification('error', 'Validation Failed', error.message);
  }
}

/**
 * Clear API key
 */
async function clearApiKey() {
  const confirmed = await showConfirmation(
    'Clear API Key',
    'Are you sure you want to remove your saved API key? This cannot be undone.'
  );
  
  if (!confirmed) return;
  
  try {
    elements.apiKeyInput.value = '';
    
    const response = await sendMessage({
      type: 'SAVE_API_KEY',
      data: { apiKey: '', rememberMe: false }
    });
    
    if (response.success) {
      showApiKeyStatus('info', 'API key cleared');
      showNotification('success', 'Cleared', 'API key removed');
    }
    
  } catch (error) {
    console.error('[Settings] Clear API key failed', error);
    showNotification('error', 'Clear Failed', error.message);
  }
}

/**
 * Show API key status
 */
function showApiKeyStatus(type, message) {
  elements.apiKeyStatus.className = `alert alert-${type}`;
  elements.apiKeyStatus.classList.remove('hidden');
  elements.apiKeyStatusText.textContent = message;
}
/**
 * Check provider statuses
 */
async function checkProviderStatuses() {
  // Check Chrome AI
  try {
    const response = await sendMessage({
      type: 'GET_PROVIDER_STATUS',
      data: { providerId: 'chrome_ai' }
    });
    
    if (response.success) {
      updateStatusBadge(elements.chromeAIStatus, response.status.available);
    }
  } catch (error) {
    console.error('[Settings] Chrome AI status check failed', error);
    updateStatusBadge(elements.chromeAIStatus, false);
  }
  
  // Gemini Cloud always available (if API key configured)
  updateStatusBadge(elements.geminiCloudStatus, true);
}

/**
 * Update status badge
 */
function updateStatusBadge(element, available) {
  element.className = 'status-badge';
  
  if (available) {
    element.classList.add('status-available');
    element.textContent = 'Available';
  } else {
    element.classList.add('status-unavailable');
    element.textContent = 'Unavailable';
  }
}

/**
 * Update provider UI
 */
function updateProviderUI() {
  const isGeminiCloud = elements.providerGeminiCloud.checked;
  
  if (isGeminiCloud) {
    elements.modelSelection.classList.remove('hidden');
  } else {
    elements.modelSelection.classList.add('hidden');
  }
}

/**
 * Collect settings from form
 */
function collectSettings() {
  return {
    ai_provider: {
      selected_provider: elements.providerGeminiCloud.checked ? 'gemini_cloud' : 'chrome_ai',
      selected_model: {
        chrome_ai: 'gemini_nano',
        gemini_cloud: elements.modelSelect.value
      }
    },
    smart_features: {
      quality_score: {
        enabled: elements.qualityScoreEnabled.checked
      },
      deduplication: {
        enabled: elements.deduplicationEnabled.checked
      },
      comparisons: {
        enabled: elements.comparisonsEnabled.checked
      },
      recommendations: {
        enabled: elements.recommendationsEnabled.checked
      },
      trends: {
        enabled: elements.trendsEnabled.checked
      }
    },
    preprocessing: {
      remove_scripts: elements.removeScripts.checked,
      remove_styles: elements.removeStyles.checked,
      remove_comments: elements.removeComments.checked,
      remove_navigation: elements.removeNavigation.checked,
      remove_footer: elements.removeFooter.checked,
      max_html_size_kb: parseInt(elements.maxHtmlSize.value)
    },
    advanced: {
      log_level: elements.logLevelSelect.value,
      debug_mode: elements.debugMode.checked,
      audio_feedback: elements.audioFeedback.checked
    }
  };
}

/**
 * Save all settings
 */
async function saveSettings() {
  try {
    const settings = collectSettings();
    
    const response = await sendMessage({
      type: 'UPDATE_SETTINGS',
      data: { settings }
    });
    
    if (response.success) {
      state.settings = settings;
      state.isDirty = false;
      
      // Update theme if changed
      const theme = elements.themeSelect.value;
      document.body.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
      
      showNotification('success', 'Settings Saved', 'All settings have been saved successfully');
    } else {
      showNotification('error', 'Save Failed', response.error);
    }
    
  } catch (error) {
    console.error('[Settings] Save failed', error);
    showNotification('error', 'Save Failed', error.message);
  }
}

/**
 * Export settings
 */
function exportSettings() {
  try {
    const settings = state.settings || collectSettings();
    const jsonString = JSON.stringify(settings, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `web-weaver-settings-${timestamp}.json`;
    
    // Trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    URL.revokeObjectURL(url);
    
    showNotification('success', 'Export Complete', 'Settings exported successfully');
    
  } catch (error) {
    console.error('[Settings] Export failed', error);
    showNotification('error', 'Export Failed', error.message);
  }
}

/**
 * Import settings
 */
function importSettings() {
  elements.importSettingsInput.click();
}

/**
 * Handle imported file
 */
async function handleImportedFile(event) {
  const file = event.target.files[0];
  
  if (!file) return;
  
  try {
    const text = await file.text();
    const settings = JSON.parse(text);
    
    // Validate settings structure (basic check)
    if (!settings.ai_provider || !settings.extraction) {
      throw new Error('Invalid settings file format');
    }
    
    const confirmed = await showConfirmation(
      'Import Settings',
      'This will replace all your current settings. Are you sure?'
    );
    
    if (!confirmed) return;
    
    // Apply imported settings
    state.settings = settings;
    populateForm(settings);
    
    showNotification('success', 'Import Complete', 'Settings imported successfully. Click Save to apply.');
    state.isDirty = true;
    
  } catch (error) {
    console.error('[Settings] Import failed', error);
    showNotification('error', 'Import Failed', 'Invalid settings file');
  } finally {
    // Reset file input
    elements.importSettingsInput.value = '';
  }
}

/**
 * Reset settings to defaults
 */
async function resetSettings() {
  const confirmed = await showConfirmation(
    'Reset Settings',
    'This will restore all settings to factory defaults. Your API key will not be affected. Are you sure?'
  );
  
  if (!confirmed) return;
  
  try {
    // Reload defaults (will trigger from background)
    await loadSettings();
    
    showNotification('success', 'Reset Complete', 'Settings restored to defaults');
    
  } catch (error) {
    console.error('[Settings] Reset failed', error);
    showNotification('error', 'Reset Failed', error.message);
  }
}

/**
 * Clear all data
 */
async function clearAllData() {
  const confirmed = await showConfirmation(
    'Clear All Data',
    'This will delete ALL stored data including API keys, settings, and history. This action cannot be undone. Are you sure?'
  );
  
  if (!confirmed) return;
  
  try {
    // Clear chrome storage
    await chrome.storage.local.clear();
    await chrome.storage.sync.clear();
    
    showNotification('success', 'Data Cleared', 'All data has been deleted. Page will reload.');
    
    // Reload page after 2 seconds
    setTimeout(() => {
      window.location.reload();
    }, 2000);
    
  } catch (error) {
    console.error('[Settings] Clear all data failed', error);
    showNotification('error', 'Clear Failed', error.message);
  }
}

/**
 * Show confirmation modal
 */
function showConfirmation(title, message) {
  return new Promise((resolve) => {
    elements.modalTitle.textContent = title;
    elements.modalMessage.textContent = message;
    elements.modal.classList.remove('hidden');
    
    state.pendingConfirmation = { resolve };
    
    // Focus confirm button
    elements.modalConfirmBtn.focus();
  });
}

/**
 * Handle confirmation
 */
function handleModalConfirm() {
  if (state.pendingConfirmation) {
    state.pendingConfirmation.resolve(true);
    state.pendingConfirmation = null;
  }
  
  closeModal();
}

/**
 * Handle cancel
 */
function handleModalCancel() {
  if (state.pendingConfirmation) {
    state.pendingConfirmation.resolve(false);
    state.pendingConfirmation = null;
  }
  
  closeModal();
}

/**
 * Close modal
 */
function closeModal() {
  elements.modal.classList.add('hidden');
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
  
  elements.notificationsContainer.appendChild(notification);
  
  const closeBtn = notification.querySelector('.notification-close');
  closeBtn.addEventListener('click', () => {
    dismissNotification(notification);
  });
  
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
 * Get notification icon
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
 * Go back to previous page
 */
function goBack() {
  window.close();
}
/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Header
  elements.backBtn.addEventListener('click', goBack);
  elements.themeToggle.addEventListener('click', toggleTheme);
  
  // API Key
  elements.toggleVisibilityBtn.addEventListener('click', toggleApiKeyVisibility);
  elements.saveApiKeyBtn.addEventListener('click', saveApiKey);
  elements.validateApiKeyBtn.addEventListener('click', validateApiKey);
  elements.clearApiKeyBtn.addEventListener('click', clearApiKey);
  
  // Provider
  elements.providerChromeAI.addEventListener('change', () => {
    updateProviderUI();
    markDirty();
  });
  
  elements.providerGeminiCloud.addEventListener('change', () => {
    updateProviderUI();
    markDirty();
  });
  
  elements.modelSelect.addEventListener('change', markDirty);
  
  // Extraction
  elements.extractionModeSelect.addEventListener('change', markDirty);
  elements.contentTypeSelect.addEventListener('change', markDirty);
  elements.timeoutInput.addEventListener('change', markDirty);
  
  // Smart Features
  elements.qualityScoreEnabled.addEventListener('change', markDirty);
  elements.deduplicationEnabled.addEventListener('change', markDirty);
  elements.comparisonsEnabled.addEventListener('change', markDirty);
  elements.recommendationsEnabled.addEventListener('change', markDirty);
  elements.trendsEnabled.addEventListener('change', markDirty);
  
  // Preprocessing
  elements.removeScripts.addEventListener('change', markDirty);
  elements.removeStyles.addEventListener('change', markDirty);
  elements.removeComments.addEventListener('change', markDirty);
  elements.removeNavigation.addEventListener('change', markDirty);
  elements.removeFooter.addEventListener('change', markDirty);
  elements.maxHtmlSize.addEventListener('change', markDirty);
  
  // Advanced
  elements.logLevelSelect.addEventListener('change', markDirty);
  elements.debugMode.addEventListener('change', markDirty);
  elements.audioFeedback.addEventListener('change', markDirty);
  elements.themeSelect.addEventListener('change', (e) => {
    const theme = e.target.value;
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  });
  
  // Data Management
  elements.exportSettingsBtn.addEventListener('click', exportSettings);
  elements.importSettingsBtn.addEventListener('click', importSettings);
  elements.importSettingsInput.addEventListener('change', handleImportedFile);
  elements.resetSettingsBtn.addEventListener('click', resetSettings);
  elements.clearAllDataBtn.addEventListener('click', clearAllData);
  
  // Save
  elements.saveSettingsBtn.addEventListener('click', saveSettings);
  
  // Modal
  elements.modalConfirmBtn.addEventListener('click', handleModalConfirm);
  elements.modalCancelBtn.addEventListener('click', handleModalCancel);
  
  // Close modal on overlay click
  elements.modal.addEventListener('click', (e) => {
    if (e.target === elements.modal) {
      handleModalCancel();
    }
  });
  
  // Keyboard shortcuts
  document.addEventListener('keydown', handleKeydown);
  
  // Warn on unsaved changes
  window.addEventListener('beforeunload', (e) => {
    if (state.isDirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
  
  console.log('[Settings] Event listeners attached');
}

/**
 * Mark settings as dirty (unsaved changes)
 */
function markDirty() {
  state.isDirty = true;
}

/**
 * Handle keyboard shortcuts
 */
function handleKeydown(e) {
  // Ctrl/Cmd + S: Save
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    saveSettings();
  }
  
  // Escape: Close modal
  if (e.key === 'Escape') {
    if (!elements.modal.classList.contains('hidden')) {
      handleModalCancel();
    }
  }
  
  // Enter: Confirm modal
  if (e.key === 'Enter') {
    if (!elements.modal.classList.contains('hidden')) {
      handleModalConfirm();
    }
  }
}

/**
 * Initialize when DOM is ready
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// TEST SCENARIOS:
// 1. Settings page loads and populates form with current settings
// 2. Theme toggle cycles through light → dark → auto
// 3. API key input toggles between password/text visibility
// 4. Save API key encrypts and stores key
// 5. Validate API key checks format
// 6. Clear API key removes stored key (with confirmation)
// 7. Provider switch shows/hides model selector
// 8. Model selector changes Gemini model
// 9. All form inputs mark settings as dirty
// 10. Save settings updates backend and clears dirty flag
// 11. Export settings downloads JSON file
// 12. Import settings reads JSON file and populates form
// 13. Reset settings restores defaults (with confirmation)
// 14. Clear all data deletes everything (with confirmation)
// 15. Confirmation modal shows for destructive actions
// 16. Modal can be confirmed or canceled
// 17. Notifications appear and auto-dismiss
// 18. Keyboard shortcuts (Ctrl+S save, Escape close modal, Enter confirm)
// 19. Unsaved changes warning on page leave
// 20. Provider status badges update based on availability
// 21. Back button closes settings page
// 22. Theme changes immediately reflect in UI

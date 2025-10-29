// VERSION: v1.0.0 | LAST UPDATED: 2025-10-26 | FEATURE: Onboarding Page Logic

/**
 * Onboarding Page Controller
 * Guides new users through initial setup
 */

// State
const state = {
  currentStep: 1,
  selectedProvider: 'chrome_ai',
  chromeAIAvailable: false
};

// Elements
const elements = {
  progressSteps: [],
  stepContents: [],
  actionButtons: [],
  
  providerRadios: [],
  chromeAIStatus: null,
  
  chromeAISetup: null,
  geminiCloudSetup: null,
  apiKeyInput: null,
  toggleVisibilityBtn: null,
  rememberKeyCheckbox: null
};

/**
 * Initialize onboarding
 */
async function initialize() {
  console.log('[Onboarding] Initializing...');
  
  // Cache elements
  cacheElements();
  
  // Setup event listeners
  setupEventListeners();
  
  // Check Chrome AI availability
  await checkChromeAIAvailability();
  
  // Show first step
  showStep(1);
  
  console.log('[Onboarding] Initialized');
}

/**
 * Cache DOM elements
 */
function cacheElements() {
  elements.progressSteps = Array.from(document.querySelectorAll('.progress-step'));
  elements.stepContents = Array.from(document.querySelectorAll('.step-content'));
  elements.actionButtons = Array.from(document.querySelectorAll('[data-action]'));
  
  elements.providerRadios = Array.from(document.querySelectorAll('input[name="onboarding-provider"]'));
  elements.chromeAIStatus = document.getElementById('chrome-ai-status');
  
  elements.chromeAISetup = document.getElementById('chrome-ai-setup');
  elements.geminiCloudSetup = document.getElementById('gemini-cloud-setup');
  elements.apiKeyInput = document.getElementById('onboarding-api-key');
  elements.toggleVisibilityBtn = document.getElementById('onboarding-toggle-visibility');
  elements.rememberKeyCheckbox = document.getElementById('onboarding-remember-key');
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Action buttons
  elements.actionButtons.forEach(btn => {
    btn.addEventListener('click', handleActionClick);
  });
  
  // Provider selection
  elements.providerRadios.forEach(radio => {
    radio.addEventListener('change', handleProviderChange);
  });
  
  // API key visibility toggle
  if (elements.toggleVisibilityBtn) {
    elements.toggleVisibilityBtn.addEventListener('click', toggleApiKeyVisibility);
  }
  
  console.log('[Onboarding] Event listeners attached');
}

/**
 * Handle action button clicks
 */
function handleActionClick(e) {
  const action = e.currentTarget.getAttribute('data-action');
  
  switch (action) {
    case 'next':
      handleNext();
      break;
    case 'prev':
      handlePrev();
      break;
    case 'finish':
      handleFinish();
      break;
  }
}

/**
 * Handle next button
 */
async function handleNext() {
  // Validate current step
  const isValid = await validateStep(state.currentStep);
  
  if (!isValid) {
    return;
  }
  
  // Move to next step
  const nextStep = state.currentStep + 1;
  
  if (nextStep <= 4) {
    showStep(nextStep);
  }
}

/**
 * Handle previous button
 */
function handlePrev() {
  const prevStep = state.currentStep - 1;
  
  if (prevStep >= 1) {
    showStep(prevStep);
  }
}

/**
 * Handle finish button
 */
async function handleFinish() {
  try {
    // Mark onboarding as complete
    await sendMessage({
      type: 'UPDATE_SETTINGS',
      data: {
        settings: {
          onboarding_completed: true
        }
      }
    });
    
    // Close onboarding page
    window.close();
    
  } catch (error) {
    console.error('[Onboarding] Finish failed', error);
    alert('Failed to complete onboarding. Please try again.');
  }
}

/**
 * Show specific step
 */
function showStep(step) {
  state.currentStep = step;
  
  // Update progress indicator
  elements.progressSteps.forEach((el, index) => {
    const stepNum = index + 1;
    
    if (stepNum < step) {
      el.classList.add('completed');
      el.classList.remove('active');
    } else if (stepNum === step) {
      el.classList.add('active');
      el.classList.remove('completed');
    } else {
      el.classList.remove('active', 'completed');
    }
  });
  
  // Update step content
  elements.stepContents.forEach((el, index) => {
    const stepNum = index + 1;
    
    if (stepNum === step) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });
  
  // Update setup section based on provider (step 3)
  if (step === 3) {
    updateSetupSection();
  }
  
  console.log(`[Onboarding] Showing step ${step}`);
}

/**
 * Validate current step before proceeding
 */
async function validateStep(step) {
  switch (step) {
    case 1:
      return true;
      
    case 2:
      // Provider selected
      return true;
      
    case 3:
      // Validate setup
      if (state.selectedProvider === 'gemini_cloud') {
        const apiKey = elements.apiKeyInput.value.trim();
        
        if (!apiKey) {
          alert('Please enter your API key to continue.');
          return false;
        }
        
        if (!apiKey.startsWith('AIza')) {
          alert('Invalid API key format. Keys should start with "AIza".');
          return false;
        }
        
        // Save API key
        const rememberMe = elements.rememberKeyCheckbox.checked;
        
        try {
          const response = await sendMessage({
            type: 'SAVE_API_KEY',
            data: { apiKey, rememberMe }
          });
          
          if (!response.success) {
            alert(`Failed to save API key: ${response.error}`);
            return false;
          }
        } catch (error) {
          console.error('[Onboarding] API key save failed', error);
          alert('Failed to save API key. Please try again.');
          return false;
        }
      }
      
      // Save selected provider
      try {
        const response = await sendMessage({
          type: 'SWITCH_PROVIDER',
          data: { providerId: state.selectedProvider }
        });
        
        if (!response.success) {
          alert(`Failed to set provider: ${response.error}`);
          return false;
        }
      } catch (error) {
        console.error('[Onboarding] Provider switch failed', error);
        alert('Failed to set provider. Please try again.');
        return false;
      }
      
      return true;
      
    case 4:
      return true;
      
    default:
      return true;
  }
}

/**
 * Handle provider change
 */
function handleProviderChange(e) {
  state.selectedProvider = e.target.value;
  console.log(`[Onboarding] Provider selected: ${state.selectedProvider}`);
}

/**
 * Update setup section based on selected provider
 */
function updateSetupSection() {
  if (state.selectedProvider === 'chrome_ai') {
    elements.chromeAISetup.classList.remove('hidden');
    elements.geminiCloudSetup.classList.add('hidden');
  } else {
    elements.chromeAISetup.classList.add('hidden');
    elements.geminiCloudSetup.classList.remove('hidden');
  }
}

/**
 * Check Chrome AI availability
 */
async function checkChromeAIAvailability() {
  try {
    const response = await sendMessage({
      type: 'GET_PROVIDER_STATUS',
      data: { providerId: 'chrome_ai' }
    });
    
    if (response.success) {
      state.chromeAIAvailable = response.status.available;
      
      if (elements.chromeAIStatus) {
        const statusText = elements.chromeAIStatus.querySelector('.status-text');
        
        if (state.chromeAIAvailable) {
          statusText.textContent = '✓ Available and ready to use';
          statusText.style.color = 'var(--color-success)';
        } else {
          statusText.textContent = '✗ Not available (requires Chrome 128+)';
          statusText.style.color = 'var(--color-error)';
          
          // Auto-select Gemini Cloud if Chrome AI unavailable
          const geminiRadio = elements.providerRadios.find(r => r.value === 'gemini_cloud');
          if (geminiRadio) {
            geminiRadio.checked = true;
            state.selectedProvider = 'gemini_cloud';
          }
        }
      }
    }
    
  } catch (error) {
    console.error('[Onboarding] Chrome AI check failed', error);
  }
}

/**
 * Toggle API key visibility
 */
function toggleApiKeyVisibility() {
  if (elements.apiKeyInput.type === 'password') {
    elements.apiKeyInput.type = 'text';
  } else {
    elements.apiKeyInput.type = 'password';
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
 * Initialize when DOM ready
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// TEST SCENARIOS:
// 1. Onboarding loads and shows step 1 (welcome)
// 2. Next button advances to step 2 (provider selection)
// 3. Back button returns to previous step
// 4. Progress indicator updates with active/completed states
// 5. Chrome AI availability checked and status displayed
// 6. Provider selection updates state
// 7. Step 3 shows Chrome AI setup (no additional setup)
// 8. Step 3 shows Gemini Cloud setup (API key input)
// 9. API key visibility toggles
// 10. API key validation (empty, invalid format)
// 11. API key saved to backend before proceeding
// 12. Provider switched to selected option before proceeding
// 13. Step 4 shows completion screen
// 14. Finish button marks onboarding complete and closes page
// 15. If Chrome AI unavailable, auto-select Gemini Cloud

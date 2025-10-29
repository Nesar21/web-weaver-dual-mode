// VERSION: v1.0.0 | LAST UPDATED: 2025-10-26 | FEATURE: Storage Tests

/**
 * Storage Tests
 * Unit tests for storage functionality
 */

import { loadSettings, saveSettings } from '../src/core/storage/settings-storage.js';
import { saveAPIKey, getAPIKey, clearAPIKey } from '../src/core/storage/api-key-storage.js';

describe('Settings Storage', () => {
  
  beforeEach(async () => {
    await chrome.storage.local.clear();
  });
  
  describe('loadSettings()', () => {
    
    test('should load default settings', async () => {
      const settings = await loadSettings();
      
      expect(settings).toBeDefined();
      expect(settings.ai_provider).toBeDefined();
      expect(settings.extraction).toBeDefined();
    });
    
    test('should merge with defaults', async () => {
      await chrome.storage.local.set({
        settings: { custom_key: 'value' }
      });
      
      const settings = await loadSettings();
      
      expect(settings.custom_key).toBe('value');
      expect(settings.ai_provider).toBeDefined(); // Default
    });
    
  });
  
  describe('saveSettings()', () => {
    
    test('should save settings', async () => {
      const newSettings = {
        ai_provider: {
          selected_provider: 'gemini_cloud'
        }
      };
      
      await saveSettings(newSettings);
      
      const loaded = await loadSettings();
      
      expect(loaded.ai_provider.selected_provider).toBe('gemini_cloud');
    });
    
  });
  
});

describe('API Key Storage', () => {
  
  beforeEach(async () => {
    await chrome.storage.sync.clear();
  });
  
  describe('saveAPIKey()', () => {
    
    test('should save encrypted API key', async () => {
      const apiKey = 'AIzaTest123456789';
      
      const result = await saveAPIKey(apiKey, true);
      
      expect(result.success).toBe(true);
    });
    
    test('should not save empty key', async () => {
      const result = await saveAPIKey('', true);
      
      expect(result.success).toBe(false);
    });
    
  });
  
  describe('getAPIKey()', () => {
    
    test('should retrieve decrypted API key', async () => {
      const apiKey = 'AIzaTest123456789';
      
      await saveAPIKey(apiKey, true);
      const retrieved = await getAPIKey();
      
      expect(retrieved).toBe(apiKey);
    });
    
    test('should return null if no key', async () => {
      const retrieved = await getAPIKey();
      
      expect(retrieved).toBeNull();
    });
    
  });
  
  describe('clearAPIKey()', () => {
    
    test('should remove API key', async () => {
      await saveAPIKey('AIzaTest123456789', true);
      await clearAPIKey();
      
      const retrieved = await getAPIKey();
      
      expect(retrieved).toBeNull();
    });
    
  });
  
});

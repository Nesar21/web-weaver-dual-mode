// VERSION: v1.0.0 | LAST UPDATED: 2025-10-26 | FEATURE: Validator Tests

/**
 * Validator Tests
 * Unit tests for validation functions
 */

import { validateAPIKey, validateURL, validateSettings } from '../src/utils/validators.js';

describe('Validators', () => {
  
  describe('validateAPIKey()', () => {
    
    test('should validate correct API key format', () => {
      const result = validateAPIKey('AIzaSyDaGmRaXmhIjPqT3U6iZN7W8YQ');
      
      expect(result.valid).toBe(true);
    });
    
    test('should reject empty key', () => {
      const result = validateAPIKey('');
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('empty');
    });
    
    test('should reject key without AIza prefix', () => {
      const result = validateAPIKey('InvalidKey123');
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('AIza');
    });
    
    test('should reject short key', () => {
      const result = validateAPIKey('AIza123');
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('length');
    });
    
  });
  
  describe('validateURL()', () => {
    
    test('should validate correct URL', () => {
      const result = validateURL('https://example.com');
      
      expect(result.valid).toBe(true);
    });
    
    test('should reject invalid URL', () => {
      const result = validateURL('not-a-url');
      
      expect(result.valid).toBe(false);
    });
    
    test('should accept http and https', () => {
      expect(validateURL('http://example.com').valid).toBe(true);
      expect(validateURL('https://example.com').valid).toBe(true);
    });
    
  });
  
  describe('validateSettings()', () => {
    
    test('should validate correct settings', () => {
      const settings = {
        ai_provider: {
          selected_provider: 'chrome_ai'
        },
        extraction: {
          mode: 'extract_all'
        }
      };
      
      const result = validateSettings(settings);
      
      expect(result.valid).toBe(true);
    });
    
    test('should reject invalid provider', () => {
      const settings = {
        ai_provider: {
          selected_provider: 'invalid_provider'
        }
      };
      
      const result = validateSettings(settings);
      
      expect(result.valid).toBe(false);
    });
    
  });
  
});

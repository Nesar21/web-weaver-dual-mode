// VERSION: v1.0.0 | LAST UPDATED: 2025-10-26 | FEATURE: Error Handler Tests

/**
 * Error Handler Tests
 * Unit tests for error handling functionality
 */

import { handleError, categorizeError } from '../src/core/error-handling/error-handler.js';
import { ErrorCategory } from '../src/core/error-handling/error-categorizer.js';

describe('Error Handler', () => {
  
  describe('categorizeError()', () => {
    
    test('should categorize network error', () => {
      const error = new Error('Network connection failed');
      const result = categorizeError(error);
      
      expect(result.category).toBe(ErrorCategory.NETWORK);
      expect(result.recoverable).toBe(true);
    });
    
    test('should categorize rate limit error', () => {
      const error = { status: 429, message: 'Too many requests' };
      const result = categorizeError(error);
      
      expect(result.category).toBe(ErrorCategory.RATE_LIMIT);
      expect(result.retryable).toBe(true);
    });
    
    test('should categorize authentication error', () => {
      const error = { status: 401, message: 'Unauthorized' };
      const result = categorizeError(error);
      
      expect(result.category).toBe(ErrorCategory.AUTHENTICATION);
      expect(result.severity).toBe('high');
    });
    
    test('should categorize parsing error', () => {
      const error = new SyntaxError('Unexpected token');
      const result = categorizeError(error);
      
      expect(result.category).toBe(ErrorCategory.PARSING);
    });
    
  });
  
  describe('handleError()', () => {
    
    test('should return error response', async () => {
      const error = new Error('Test error');
      const result = await handleError(error);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
    
    test('should include user message', async () => {
      const error = new Error('Network failed');
      const result = await handleError(error);
      
      expect(result.userMessage).toBeDefined();
    });
    
  });
  
});

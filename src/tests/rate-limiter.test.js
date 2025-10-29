// VERSION: v1.0.0 | LAST UPDATED: 2025-10-26 | FEATURE: Rate Limiter Tests

/**
 * Rate Limiter Tests
 * Unit tests for rate limiting functionality
 */

import { checkRateLimit, recordRequest, getRateLimitStatus } from '../src/core/rate-limiting/rate-limiter.js';

describe('Rate Limiter', () => {
  
  beforeEach(async () => {
    // Clear rate limit data before each test
    await chrome.storage.local.clear();
  });
  
  describe('checkRateLimit()', () => {
    
    test('should allow request when under limit', async () => {
      const result = await checkRateLimit('gemini-2.0-flash-lite');
      
      expect(result.allowed).toBe(true);
      expect(result.waitTime).toBe(0);
    });
    
    test('should block request when over RPM limit', async () => {
      const modelId = 'gemini-2.0-flash-lite';
      
      // Record 30 requests (RPM limit = 30)
      for (let i = 0; i < 30; i++) {
        await recordRequest(modelId);
      }
      
      const result = await checkRateLimit(modelId);
      
      expect(result.allowed).toBe(false);
      expect(result.waitTime).toBeGreaterThan(0);
    });
    
    test('should block request when over RPD limit', async () => {
      const modelId = 'gemini-1.5-pro';
      
      // Record 50 requests (RPD limit = 50)
      for (let i = 0; i < 50; i++) {
        await recordRequest(modelId);
      }
      
      const result = await checkRateLimit(modelId);
      
      expect(result.allowed).toBe(false);
    });
    
  });
  
  describe('recordRequest()', () => {
    
    test('should record request timestamp', async () => {
      const modelId = 'gemini-2.0-flash-lite';
      
      await recordRequest(modelId);
      
      const status = await getRateLimitStatus(modelId);
      
      expect(status.rpm.current).toBe(1);
      expect(status.rpd.current).toBe(1);
    });
    
    test('should increment counters correctly', async () => {
      const modelId = 'gemini-2.0-flash-lite';
      
      await recordRequest(modelId);
      await recordRequest(modelId);
      await recordRequest(modelId);
      
      const status = await getRateLimitStatus(modelId);
      
      expect(status.rpm.current).toBe(3);
      expect(status.rpd.current).toBe(3);
    });
    
  });
  
  describe('getRateLimitStatus()', () => {
    
    test('should return correct status', async () => {
      const modelId = 'gemini-2.0-flash-lite';
      
      await recordRequest(modelId);
      
      const status = await getRateLimitStatus(modelId);
      
      expect(status.rpm).toBeDefined();
      expect(status.rpd).toBeDefined();
      expect(status.rpm.current).toBeGreaterThanOrEqual(0);
      expect(status.rpm.limit).toBeGreaterThan(0);
    });
    
    test('should calculate percentage correctly', async () => {
      const modelId = 'gemini-2.0-flash-lite';
      
      // Record 15 requests (50% of 30 RPM)
      for (let i = 0; i < 15; i++) {
        await recordRequest(modelId);
      }
      
      const status = await getRateLimitStatus(modelId);
      
      expect(status.rpm.percentage).toBeCloseTo(50, 0);
    });
    
  });
  
  describe('Time Window', () => {
    
    test('should reset RPM after 1 minute', async () => {
      const modelId = 'gemini-2.0-flash-lite';
      
      await recordRequest(modelId);
      
      // Mock time passing (1 minute)
      jest.advanceTimersByTime(61000);
      
      const status = await getRateLimitStatus(modelId);
      
      expect(status.rpm.current).toBe(0);
    });
    
  });
  
});

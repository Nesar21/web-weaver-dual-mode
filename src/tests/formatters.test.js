// VERSION: v1.0.0 | LAST UPDATED: 2025-10-26 | FEATURE: Formatter Tests

/**
 * Formatter Tests
 * Unit tests for data formatting functions
 */

import { formatJSON, formatCSV, formatDuration } from '../src/utils/formatters.js';

describe('Formatters', () => {
  
  describe('formatJSON()', () => {
    
    test('should format object as JSON string', () => {
      const data = { name: 'Test', value: 123 };
      const result = formatJSON(data);
      
      expect(result).toContain('"name"');
      expect(result).toContain('Test');
    });
    
    test('should handle arrays', () => {
      const data = [1, 2, 3];
      const result = formatJSON(data);
      
      expect(result).toContain('[');
      expect(result).toContain(']');
    });
    
    test('should prettify with indent', () => {
      const data = { a: 1, b: 2 };
      const result = formatJSON(data, 2);
      
      expect(result).toContain('\n');
      expect(result).toContain('  ');
    });
    
  });
  
  describe('formatCSV()', () => {
    
    test('should convert array to CSV', () => {
      const data = [
        { name: 'Item 1', price: 10 },
        { name: 'Item 2', price: 20 }
      ];
      
      const result = formatCSV(data);
      
      expect(result).toContain('name,price');
      expect(result).toContain('Item 1,10');
    });
    
    test('should handle empty array', () => {
      const result = formatCSV([]);
      
      expect(result).toBe('');
    });
    
    test('should escape commas in values', () => {
      const data = [{ name: 'Item, with comma' }];
      const result = formatCSV(data);
      
      expect(result).toContain('"Item, with comma"');
    });
    
  });
  
  describe('formatDuration()', () => {
    
    test('should format milliseconds', () => {
      expect(formatDuration(1000)).toBe('1s');
      expect(formatDuration(60000)).toBe('1m 0s');
      expect(formatDuration(3600000)).toBe('1h 0m');
    });
    
    test('should handle zero', () => {
      expect(formatDuration(0)).toBe('0s');
    });
    
  });
  
});

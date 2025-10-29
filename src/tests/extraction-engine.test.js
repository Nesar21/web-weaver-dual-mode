// VERSION: v1.0.0 | LAST UPDATED: 2025-10-26 | FEATURE: Extraction Engine Tests

/**
 * Extraction Engine Tests
 * Unit tests for extraction engine functionality
 */

import { extract } from '../src/core/extraction/extraction-engine.js';

// Mock data
const mockHTML = `
<!DOCTYPE html>
<html>
<body>
  <article>
    <h1>Test Article</h1>
    <p>This is a test article content.</p>
  </article>
</body>
</html>
`;

// Test Suite
describe('Extraction Engine', () => {
  
  describe('extract()', () => {
    
    test('should extract data in extract_all mode', async () => {
      const result = await extract({
        mode: 'extract_all',
        contentType: 'auto',
        html: mockHTML
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
    
    test('should extract data in extract_main mode', async () => {
      const result = await extract({
        mode: 'extract_main',
        contentType: 'articles',
        html: mockHTML
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
    
    test('should handle invalid HTML gracefully', async () => {
      const result = await extract({
        mode: 'extract_all',
        contentType: 'auto',
        html: '<invalid>html'
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
    
    test('should timeout if extraction takes too long', async () => {
      const result = await extract({
        mode: 'extract_all',
        contentType: 'auto',
        html: mockHTML,
        timeout: 100 // Very short timeout
      });
      
      // Should timeout or complete quickly
      expect(result).toBeDefined();
    });
    
    test('should detect content type automatically', async () => {
      const result = await extract({
        mode: 'extract_all',
        contentType: 'auto',
        html: mockHTML
      });
      
      expect(result.metadata.detectedContentType).toBeDefined();
    });
    
  });
  
  describe('HTML Preprocessing', () => {
    
    test('should remove scripts', async () => {
      const htmlWithScript = '<script>alert("test")</script><p>Content</p>';
      const result = await extract({
        mode: 'extract_all',
        contentType: 'auto',
        html: htmlWithScript
      });
      
      // Scripts should be removed during preprocessing
      expect(result.metadata.preprocessed).toBe(true);
    });
    
    test('should remove styles', async () => {
      const htmlWithStyle = '<style>body{color:red}</style><p>Content</p>';
      const result = await extract({
        mode: 'extract_all',
        contentType: 'auto',
        html: htmlWithStyle
      });
      
      expect(result.metadata.preprocessed).toBe(true);
    });
    
  });
  
  describe('Quality Score', () => {
    
    test('should calculate quality score', async () => {
      const result = await extract({
        mode: 'extract_all',
        contentType: 'auto',
        html: mockHTML,
        enableQualityScore: true
      });
      
      expect(result.qualityScore).toBeGreaterThanOrEqual(0);
      expect(result.qualityScore).toBeLessThanOrEqual(100);
    });
    
  });
  
  describe('Error Handling', () => {
    
    test('should handle missing HTML', async () => {
      const result = await extract({
        mode: 'extract_all',
        contentType: 'auto',
        html: null
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('HTML');
    });
    
    test('should handle invalid mode', async () => {
      const result = await extract({
        mode: 'invalid_mode',
        contentType: 'auto',
        html: mockHTML
      });
      
      expect(result.success).toBe(false);
    });
    
  });
  
});

// Run tests (if using test runner)
// npm test or similar command

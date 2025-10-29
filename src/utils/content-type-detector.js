/* VERSION: v1.0.0 | FEATURE: Content Type Detection */

/**
 * Detect content type using AI
 */
export class ContentTypeDetector {
  constructor(aiProvider) {
    this.ai = aiProvider;
  }
  
  /**
   * Detect content type from sample HTML
   */
  async detect(sampleElements, suggestedType = 'unknown') {
    const sampleHTML = sampleElements
      .slice(0, 3)
      .map(el => el.outerHTML.substring(0, 2000))
      .join('\n\n');
    
    const prompt = `Analyze these HTML elements and identify the content type.

Suggested type from selector: ${suggestedType}

Possible types:
- job_listings: Job postings, positions, careers, vacancies
- products: Physical or digital products for sale
- articles: News articles, blog posts, stories, content
- social_posts: Social media posts, tweets, updates, status
- search_results: Generic search results
- generic: Other structured content

Rules:
1. Return ONLY the type name (lowercase with underscore)
2. Do NOT add quotes or extra text
3. Choose the type that best matches the HTML structure
4. If unsure between two types, prefer the suggested type

HTML samples:
${sampleHTML}

Type:`;

    try {
      const response = await this.ai.generateText(prompt);
      const contentType = response.trim().toLowerCase().replace(/['"]/g, '');
      
      // Validate response
      const validTypes = [
        'job_listings',
        'products', 
        'articles',
        'social_posts',
        'search_results',
        'generic'
      ];
      
      return validTypes.includes(contentType) ? contentType : suggestedType;
      
    } catch (error) {
      console.warn('Content type detection failed, using suggested type', error);
      return suggestedType;
    }
  }
  
  /**
   * Get expected fields for content type
   */
  static getExpectedFields(contentType) {
    const fieldMappings = {
      job_listings: [
        'title', 'company', 'location', 'job_type', 
        'salary', 'posted_date', 'description', 'requirements', 'url'
      ],
      products: [
        'title', 'price', 'currency', 'rating', 'reviews_count',
        'availability', 'description', 'image_url', 'brand', 'category', 'sku', 'url'
      ],
      articles: [
        'title', 'author', 'published_date', 'summary', 'content',
        'category', 'tags', 'read_time', 'url'
      ],
      social_posts: [
        'author', 'author_username', 'content', 'timestamp',
        'likes', 'comments', 'shares', 'url'
      ],
      search_results: [
        'title', 'description', 'url', 'snippet', 'domain'
      ],
      generic: [
        'title', 'description', 'url', 'metadata'
      ]
    };
    
    return fieldMappings[contentType] || fieldMappings.generic;
  }
}

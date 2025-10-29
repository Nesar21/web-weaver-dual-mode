# API Documentation

## Core Modules

### Extraction Engine

#### `extract(options)`
Extracts structured data from webpage.

**Parameters:**
- `options.mode` (string): 'extract_all' or 'extract_main'
- `options.contentType` (string): Content type to extract
- `options.timeout` (number): Timeout in seconds

**Returns:** Promise<Object>

**Example:**
const result = await extract({
mode: 'extract_all',
contentType: 'products',
timeout: 60
});

text

### AI Providers

#### Chrome AI Provider

`generateText(prompt, options)`

#### Gemini Cloud Provider

`generateText(prompt, options)`

### Storage

#### Settings Storage

`loadSettings()` - Load settings  
`saveSettings(settings)` - Save settings

#### API Key Storage

`saveAPIKey(key, rememberMe)` - Save encrypted API key  
`getAPIKey()` - Get decrypted API key  
`clearAPIKey()` - Remove API key

### Rate Limiting

`checkRateLimit(modelId)` - Check if rate limit allows request  
`recordRequest(modelId)` - Record request for rate limiting  
`getRateLimitStatus(modelId)` - Get current rate limit status
# Developer Guide

## Architecture Overview

Web Weaver Lightning uses a modular architecture:

### Layers
1. **UI Layer**: Popup, settings, onboarding
2. **Core Layer**: Extraction, AI providers, storage
3. **Utility Layer**: Logging, validation, formatting

### Key Components

#### Extraction Engine
Orchestrates HTML preprocessing, AI extraction, and post-processing.

#### AI Providers
- **Chrome AI Provider**: Uses local Gemini Nano
- **Gemini Cloud Provider**: Uses cloud API
- **Provider Manager**: Switches between providers

#### Storage Manager
Handles encrypted storage for API keys and settings.

#### Rate Limiter
Tracks RPM/RPD limits and enforces rate limits.

## Development Setup

### Prerequisites
- Chrome 128+
- Node.js 16+ (optional)
- Git

### Clone and Load
git clone https://github.com/yourusername/web-weaver.git
cd web-weaver

Load in chrome://extensions/
text

### Project Structure
src/
├── background/ # Service worker
├── content/ # Content scripts
├── core/ # Core modules
│ ├── ai-providers/
│ ├── extraction/
│ ├── storage/
│ └── rate-limiting/
└── utils/ # Utilities

text

## Adding Features

### New Content Type
1. Add to `config/prompts.json`
2. Update extraction engine
3. Test on sample pages

### New AI Provider
1. Create provider class
2. Implement `generateText()` method
3. Register in provider manager

### New Smart Feature
1. Add to extraction engine
2. Update settings page
3. Add configuration options

## Testing

### Manual Testing
1. Load extension
2. Test on various websites
3. Check console for errors
4. Verify data accuracy

### Debugging
- Enable debug mode in settings
- Check service worker logs
- Use Chrome DevTools

## Release Process

1. Update version in manifest.json
2. Update CHANGELOG.md
3. Test thoroughly
4. Create git tag
5. Build package
6. Submit to Chrome Web Store
# Changelog

All notable changes to Web Weaver Lightning will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-26

### Added
- Initial release of Web Weaver Lightning
- Chrome Built-in AI support (Gemini Nano)
- Gemini Cloud API support (multiple models)
- Dual extraction modes (Extract All, Extract Main Article)
- Auto-detection for content types (products, articles, jobs, posts, generic)
- HTML preprocessing with configurable options
- Smart features:
  - Quality score analysis
  - AI-powered deduplication
  - Item comparisons
  - Personalized recommendations
  - Trend detection
- Export functionality:
  - JSON format
  - CSV format (standard, data scientist, custom modes)
  - Copy to clipboard
- Rate limiting system:
  - RPM (Requests Per Minute) tracking
  - RPD (Requests Per Day) tracking
  - Countdown timers
- Encrypted API key storage (AES-256-GCM)
- Settings page with full customization
- Onboarding wizard for first-time setup
- Audio feedback system (Web Audio API)
- Theme support (light, dark, auto)
- Keyboard shortcuts:
  - Ctrl+Shift+E: Open popup
  - Ctrl+Shift+A: Extract all items
- Comprehensive error handling and recovery
- Detailed logging system with configurable levels

### Technical
- Manifest V3 architecture
- Service worker for background processing
- Content script for page interaction
- Modular ES6 code structure
- Type-safe with JSDoc annotations
- Extensive configuration system
- Chrome storage with encryption
- JSON parsing with error recovery

### Security
- Encrypted API key storage
- No third-party data sharing
- Local processing option (Chrome AI)
- Content Security Policy enforcement
- Secure communication with Gemini API

## [Unreleased]

### Planned
- History page for viewing past extractions
- Batch extraction for multiple pages
- Custom extraction rules/templates
- Export to additional formats (Excel, XML)
- Browser sync for settings
- Data visualization dashboard
- API for external integrations
- Support for additional AI providers

---

## Version History Format

### [Version] - YYYY-MM-DD

#### Added
- New features

#### Changed
- Changes to existing functionality

#### Deprecated
- Soon-to-be removed features

#### Removed
- Removed features

#### Fixed
- Bug fixes

#### Security
- Security updates

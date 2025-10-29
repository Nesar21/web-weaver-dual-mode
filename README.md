# 🚀 Web Weaver Lightning

**Intelligent web data extraction powered by AI**

Extract structured data from any webpage in seconds using advanced AI technology. No coding required.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Chrome](https://img.shields.io/badge/chrome-128%2B-red)

---

## ✨ Features

### 🤖 **Dual AI Provider Support**
- **Chrome Built-in AI** (Gemini Nano) - Free, local, privacy-focused
- **Gemini Cloud API** - Powerful cloud models with advanced features

### ⚡ **Smart Extraction**
- Auto-detect content types (products, articles, jobs, posts, generic)
- Extract all items or focus on main content
- HTML preprocessing for optimal results
- Screenshot support for visual content

### 🎯 **Advanced Capabilities**
- Quality score analysis
- AI-powered deduplication
- Generate comparisons
- Personalized recommendations
- Trend detection (10+ items)

### 📊 **Export Options**
- JSON format (structured data)
- CSV format (spreadsheet-ready)
- Multiple CSV modes (standard, data scientist, custom)
- Copy to clipboard

### 🛡️ **Privacy & Security**
- Encrypted API key storage
- Local processing option (Chrome AI)
- No data sent to third parties
- Open source and transparent

---

## 📦 Installation

### From Chrome Web Store
1. Visit [Chrome Web Store](#) (link coming soon)
2. Click "Add to Chrome"
3. Complete onboarding setup

### From Source (Developer Mode)
Clone repository
git clone https://github.com/yourusername/web-weaver.git
cd web-weaver

Load in Chrome
1. Open chrome://extensions/
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the web-weaver directory
text

---

## 🎯 Quick Start

### 1. Choose AI Provider

**Option A: Chrome Built-in AI** (Recommended)
- No setup required
- Free and private
- Works offline
- Requires Chrome 128+

**Option B: Gemini Cloud API**
- Get free API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- More powerful and accurate
- Advanced features available

### 2. Extract Data

1. Navigate to any webpage
2. Click the Web Weaver icon in toolbar
3. Select extraction mode:
   - **Extract All Items**: Get all structured data
   - **Extract Main Article**: Focus on primary content
4. Choose content type (or use auto-detect)
5. Click "Extract Data"

### 3. Export Results

- **JSON**: Download structured data
- **CSV**: Export to spreadsheet
- **Copy**: Paste into other applications

---

## 🔧 Configuration

### Extraction Settings
- **Mode**: Extract All / Extract Main
- **Content Type**: Auto-detect, Products, Articles, Jobs, Posts, Generic
- **Timeout**: 10-120 seconds (default: 60s)
- **Screenshot**: Enable for visual content (Extract Main only)

### Smart Features (Gemini Cloud only)
- **Quality Score**: Assess extraction completeness
- **Deduplication**: Remove duplicate items
- **Comparisons**: Side-by-side item comparisons
- **Recommendations**: Personalized suggestions
- **Trends**: Pattern detection (10+ items)

### HTML Preprocessing
- Remove scripts, styles, comments
- Remove navigation and footer elements
- Set max HTML size limit (default: 500KB)

### Advanced Options
- **Log Level**: Error / Warning / Info / Debug
- **Debug Mode**: Detailed console output
- **Audio Feedback**: Sound effects for events
- **Theme**: Light / Dark / Auto (system)

---

## 📖 Usage Examples

### Extract Product Listings
Visit e-commerce site (Amazon, eBay, etc.)

Select "Extract All Items"

Content type: "Products" or "Auto-detect"

Export as CSV for spreadsheet analysis

text

### Extract Job Posts
Visit job board (LinkedIn, Indeed, etc.)

Select "Extract All Items"

Content type: "Jobs"

Enable deduplication for unique results

text

### Extract Article Content
Visit blog or news site

Select "Extract Main Article"

Enable screenshot for images

Export as JSON for archival

text

---

## 🏗️ Architecture

### Project Structure
web-weaver/
├── config/ # Configuration files
│ ├── models.json # AI model definitions
│ ├── rate-limits.json # Rate limit configs
│ ├── endpoints.json # API endpoints
│ ├── prompts.json # Extraction prompts
│ └── defaults.json # Default settings
├── src/
│ ├── background/ # Service worker
│ ├── content/ # Content scripts
│ ├── core/ # Core functionality
│ │ ├── ai-providers/ # AI provider integrations
│ │ ├── error-handling/
│ │ ├── extraction/ # Extraction engine
│ │ ├── rate-limiting/
│ │ └── storage/ # Data persistence
│ └── utils/ # Utilities
├── ui/ # User interface
│ ├── popup/ # Extension popup
│ ├── settings/ # Settings page
│ └── onboarding/ # First-run experience
├── assets/ # Icons and resources
└── manifest.json # Chrome extension manifest

text

### Key Components

**Extraction Engine** (`src/core/extraction/extraction-engine.js`)
- Orchestrates HTML preprocessing, AI extraction, post-processing
- Content type detection
- Quality scoring
- Smart features coordination

**AI Providers** (`src/core/ai-providers/`)
- Chrome AI provider (local Gemini Nano)
- Gemini Cloud provider (cloud API)
- Provider manager for switching

**Rate Limiting** (`src/core/rate-limiting/`)
- RPM (Requests Per Minute) tracking
- RPD (Requests Per Day) tracking
- Countdown timers for rate limit waits

**Storage** (`src/core/storage/`)
- Encrypted API key storage
- Settings persistence
- Cache management

---

## 🔐 Privacy & Security

### Data Handling
- **Chrome Built-in AI**: All processing happens locally on your device
- **Gemini Cloud API**: Data sent to Google AI for processing only
- **No third-party tracking**: We don't collect or share your data
- **Open source**: Full transparency in codebase

### API Key Security
- Stored encrypted using AES-256-GCM
- Never transmitted except to official Gemini API
- Optional session-only storage (not persisted)
- Clear key option in settings

---

## 🤝 Contributing

We welcome contributions! Here's how:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Setup
Install dependencies (if any)
npm install

Make changes
Test in Chrome developer mode
Run tests (when available)
npm test

text

---

## 📝 Changelog

### v1.0.0 (2025-10-26)
- Initial release
- Chrome Built-in AI support
- Gemini Cloud API support
- Multiple content types
- Smart features
- Export to JSON/CSV
- Audio feedback
- Dark mode support

---

## 🐛 Known Issues

- Chrome Built-in AI requires Chrome 128+ and may not be available in all regions
- Screenshot capture requires `activeTab` permission
- Rate limits vary by Gemini model (see rate-limits.json)

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 🙏 Acknowledgments

- Google Chrome AI team for Gemini Nano integration
- Google AI Studio for Gemini Cloud API
- Chrome Extensions community

---

## 📧 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/web-weaver/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/web-weaver/discussions)
- **Email**: support@example.com

---

## 🌟 Star History

If you find Web Weaver useful, please ⭐ star the repository!

---

**Made with ❤️ by [Your Name]**

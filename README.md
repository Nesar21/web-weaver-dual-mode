# 🚀 Web Weaver Lightning

**Intelligent web data extraction powered by AI**

Extract structured data from any webpage in seconds using advanced AI technology. No coding required.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-Free%20for%20All-green)
![Chrome](https://img.shields.io/badge/chrome-128%2B-red)

---

## ✨ Features

### 🤖 **Dual AI Provider Support**
- **Chrome Built-in AI (Gemini Nano)** — Free, local, and privacy-focused  
- **Gemini Cloud API** — Powerful cloud models with advanced features

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
- 100% open and transparent

---

## 📦 Installation

### From Chrome Web Store
1. Visit [Chrome Web Store](#) *(link coming soon)*
2. Click **Add to Chrome**
3. Complete onboarding setup

### From Source (Developer Mode)
```bash
git clone https://github.com/Nesar21/web-weaver-dual-mode.git
cd web-weaver-dual-mode
Load in Chrome

Open chrome://extensions/

Enable Developer mode

Click Load unpacked

Select the web-weaver-dual-mode directory

🎯 Quick Start
1. Choose AI Provider
🧠 Option A: Chrome Built-in AI (Recommended)
No setup required

Free and private

Works offline

Requires Chrome 128+

☁️ Option B: Gemini Cloud API
Get a free API key from Google AI Studio

More powerful and accurate

Advanced AI features enabled

2. Extract Data
Navigate to any webpage

Click the Web Weaver icon in your Chrome toolbar

Select extraction mode:

Extract All Items → All structured data

Extract Main Article → Focus on key content

Choose a content type or use auto-detect

Click Extract Data

3. Export Results
JSON → Download structured data

CSV → Export for spreadsheets

Copy → Paste into any app instantly

🔧 Configuration
Extraction Settings
Setting	Description
Mode	Extract All / Extract Main
Content Type	Auto, Products, Articles, Jobs, Posts, Generic
Timeout	10–120 seconds (default 60s)
Screenshot	Capture visual content (Extract Main only)

Smart Features (Gemini Cloud only)
Quality Score

Deduplication

Comparisons

Recommendations

Trends

HTML Preprocessing
Removes scripts, styles, comments

Removes navigation & footers

Limits max HTML to 500KB (default)

Advanced Options
Log Level: Error / Warning / Info / Debug

Debug Mode: Detailed console logs

Audio Feedback: Sound alerts for events

Theme: Light / Dark / Auto

📖 Usage Examples
🛍️ Extract Product Listings
Visit Amazon, eBay, etc.

Mode: Extract All Items

Content Type: Products / Auto

Export as CSV for analysis

💼 Extract Job Posts
Visit LinkedIn, Indeed, etc.

Mode: Extract All Items

Content Type: Jobs

Enable deduplication for clean data

📰 Extract Article Content
Visit any blog or news site

Mode: Extract Main Article

Enable Screenshot

Export as JSON for archival

🧩 Key Components
Component	Path	Description
Extraction Engine	src/core/extraction/extraction-engine.js	Orchestrates HTML processing, AI extraction, scoring
AI Providers	src/core/ai-providers/	Manages Chrome AI and Gemini Cloud APIs
Rate Limiting	src/core/rate-limiting/	Tracks RPM/RPD and cooldowns
Storage	src/core/storage/	Handles encrypted keys, cache, and settings

🔐 Privacy & Security
Data Handling
Mode	Where Processing Happens
Chrome Built-in AI	On your device (local only)
Gemini Cloud API	On Google’s servers (secure & limited)

No third-party tracking

Open-source for full transparency

API Key Protection
Encrypted with AES-256-GCM

Only used for Gemini API

Optional session-only storage

One-click key removal

🤝 Contributing
Fork this repo

Create a new branch

bash
Copy code
git checkout -b feature/amazing-feature
Commit changes

bash
Copy code
git commit -m "Add amazing feature"
Push and open a PR

Development Setup
bash
Copy code
npm install
npm test
Load into Chrome Developer Mode and test directly.

📝 Changelog
v1.0.0 — 2025-10-26
Initial release

Chrome Built-in AI + Gemini Cloud support

Multiple content types

Smart features (dedup, quality, trends)

JSON/CSV export

Dark mode, audio feedback

🐛 Known Issues
Chrome AI requires Chrome 128+ and may not be available everywhere

Screenshot capture needs activeTab permission

Rate limits depend on the Gemini model

🙏 Acknowledgments
Google Chrome AI team for Gemini Nano integration

Google AI Studio for Gemini Cloud API

Open-source Chrome Extensions community

📧 Support
Issues: GitHub Issues

Discussions: GitHub Discussions

Email: nesaramingad821@gmail.com

🌟 Star History
If you find Web Weaver Lightning useful, please ⭐ star the repository!

Made with ❤️ by Nesara Amingad
Free for all use — open and community-driven.
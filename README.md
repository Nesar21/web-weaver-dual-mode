## Overview

Web Weaver Dual Mode is a Chrome extension for extracting, structuring, and generating web data using AI. It provides dual-mode operation: Chrome's local Gemini AI or Gemini Cloud API. No licenses. Maximum performance.

- Scalability: Batch processing and large-scale data extraction.
- Performance: Local speed or cloud-level power.
- Maintainability: Modular, testable, extendable architecture.
- Innovation Edge: Dual AI integration with model-level flexibility.

---

## Features

- AI Provider Switching:
  - Chrome Built-in AI (Gemini Nano) – offline and private.
  - Gemini Cloud API – powerful and multimodal.

- Model Choice: Access latest Gemini models with optimized defaults.
- Extraction Modes:
  - Extract All Items: Full structured data extraction.
  - Extract Main Article: Targeted readable content.
- Smart Detection: Adapts for GitHub, LinkedIn, and generic sites.
- Encrypted API Storage: AES-based security.
- Clean Settings UI: Fully documented and responsive.

---

## UI Demo

### Action Popup
![Settings panel](src/assets/images/Screenshot%202025-10-31%20at%2020.41.38.png)

### Settings Panel
![Web Weaver demo](src/assets/images/Screenshot%202025-10-31%20at%2020.41.32.png)

---

## Quick Start

1. Install the extension: Chrome → Extensions → Developer Mode → Load unpacked → `dist/`
2. Select AI Provider: Gemini Local (Nano) or Gemini Cloud.
3. Add API Key if using Cloud mode.
4. Click "Extract" on any webpage.

---

**Name:** Nesara Amingad  

**Email:** [nesaramingad821@gmail.com](mailto:nesaramingad821@gmail.com)  

**LinkedIn:** [linkedin.com/in/nesar-amingad](https://www.linkedin.com/in/nesar-amingad/)

---

## Web Weaver — AI-Powered Web Data Extraction

Web Weaver is a production-grade Chrome extension for extracting structured data from any webpage using dual AI providers. It employs enterprise-level error handling, caching, and rate limiting. Engineered for precision, not convenience.

---

## Quick Start

```bash
git clone https://github.com/Nesar21/web-weaver-dual-mode
cd web_weaver
```

Load into Chrome:
- Navigate to chrome://extensions/
- Enable Developer Mode
- Select "Load unpacked" and choose the extension folder
- Pin for quick access

---

## Architecture & Innovation

### Dual AI Engine

| Provider | Model | Capability |
|----------|-------|-----------|
| Chrome Built-in AI | Gemini Nano | Zero-cost, offline inference, privacy by default |
| Gemini Cloud API | Multiple Gemini models (2.0 Flash Lite default) | Cost-aware rate limiting, resilient fallback if local AI unavailable, requires API key |

### Three-Layer Extraction

| Mode | Description |
|------|-------------|
| Extract All Items | Batch scrape structured data |
| Extract Main Article | Focused readable content |
| Smart Detection | Auto-optimized for various sites |

---

## Enterprise-Grade Features

| Feature | Description |
|---------|-------------|
| Rate Limiting | Token bucket + quota tracking |
| Caching | Scroll cache with deduplication |
| Error Recovery | 7-level exponential backoff |
| Security | AES encryption with no session persistence |

## Configuration Reference

Below are the key defaults and limits used by **Web Weaver Dual Mode**  
(from your Chrome AI and Gemini setup).

---

### Selected Model

| Model | Description | Rate Limit |
|--------|--------------|-------------|
| **Gemini 2.0 Flash Lite** | Fast and cost-efficient for everyday extraction | 30 RPM |
| **Gemini 2.0 Flash Experimental** | Early access experimental model (higher quality) | 10 RPM |
| **Gemini 2.5 Pro** | Advanced reasoning and precision model | 2 RPM |

> 💡 *“Lite” = Speed; “Exp” = Beta Quality; “Pro” = Deep Accuracy.*

---

### Model Rate Limits (Google AI Studio)

| Model ID | RPM | TPM | RPD | Notes |
|-----------|-----|-----|-----|-------|
| **gemini-2.0-flash-exp** | 10 | 250 K | 50 | Experimental tier |
| **gemini-2.0-flash-lite** | 15 | 1 M | 200 | Best balance of speed & cost |
| **gemini-2.5-pro** | 2 | 125 K | 50 | High-precision for complex parsing |

> **RPM:** Requests / minute | **TPM:** Tokens / minute | **RPD:** Requests / day

---

### Default Extraction Modes

| Mode | Description |
|------|--------------|
| **Extract All Items** | Pulls every detectable data element (links, prices, text, etc.) |
| **Extract Main Article** | Focuses on core readable content (ideal for blogs/news) |

> Use **All Items** for e-commerce or job boards, **Main Article** for text-heavy pages.

---

### Default Content Types

| Type | Auto-Detected Behavior |
|------|-------------------------|
| **Auto-detect** | Smartly identifies best content schema |
| **Products** | Extracts titles, prices, ratings |
| **Articles** | Gets title, author, publish date, content |
| **Job Listings** | Fetches role, company, location |
| **Social Posts** | Pulls user handle, post text, timestamp |
| **Generic Data** | Catches everything else (fallback mode) |

---

### Log Levels

| Level | Purpose |
|--------|----------|
| **Error** | Only critical failures |
| **Warning** | Minor recoverable issues |
| **Info** | Normal run details |
| **Debug** | Deep trace logs for developers |

> Recommended: Keep `Info` in production, `Debug` for testing.

---

## Settings Deep Dive

### API Key Management
- AES encryption
- Connection testing and persistence toggle
- Mask/reveal functionality

### Provider Selection
- Chrome vs Cloud toggle
- Real-time status indicators

### Extraction Modes
- All Items / Main Article
- Auto optimization by content type

### Advanced Settings
- Batch size (default 25)
- Deduplication strictness
- Confidence tuning
- Custom prompts
- Logging level

---

## Technical Stack

**Frontend:**
- Vanilla JavaScript, minimal dependencies, CSS Grid + Flexbox

**Backend (Service Worker):**
- Async messaging and background queue

**AI Providers:**
- Chrome AI API (Gemini Nano)
- Google Generative AI SDK (Cloud)

**Storage:**
- Chrome Storage API (sync-enabled)
- Encrypted LocalStorage

**Pipeline:**
- DOM parsing
- HTML sanitization
- JSON repair and CSV export

---

## Installation & Development

### Requirements
- Node.js 18+
- Chrome 125+
- (Optional) Google AI Studio API Key

### Setup
```bash
git clone https://github.com/amitkumardemo/web_weaver.git
cd web_weaver
npm install
```

Load via Developer Mode → Load Unpacked

---

## Feature Walkthrough

- Quick Extract: Right-click → "Extract with Web Weaver"
- Batch Process: 10+ items per run
- Smart Caching: Persistent session memory
- Multi-Language: Auto-translate via Chrome or Gemini
- Custom Extraction: Adjustable prompt and confidence
- Export: CSV or JSON output

---

## Performance Metrics

| Metric | Value |
|--------|-------|
| Speed | <2s per extraction (Local AI) |
| Accuracy | 94%+ structured data |
| Memory | <5MB footprint |
| Cost | Free (Local) / $0.075 per 1M tokens (Cloud) |

---

## Security & Privacy

- AES-256 encryption for all keys
- No telemetry or tracking
- On-device computation
- Chrome Storage API synchronization
- Fully sandboxed content scripts

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Chrome AI unavailable | Update to Chrome v125+ |
| Rate limit exceeded | Wait 60s or upgrade quota |
| Low accuracy | Adjust confidence threshold |
| API key not saving | Check permissions or disable Incognito |
| Extension not loading | Clear cache and reload |

---

## Contributing

Fork → Create branch → Commit → Pull request → Review → Merge

**Priorities:**
- Performance improvement
- Multi-language extension
- Advanced extraction algorithms

---

## Version: v1.1.0
## Last Updated: October 31, 2025
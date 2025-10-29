# Architecture

## Overview
Web Weaver Lightning follows a layered architecture with clear separation of concerns.

## Layers

### 1. UI Layer
- **Popup**: Main extraction interface
- **Settings**: Configuration page
- **Onboarding**: First-run wizard

### 2. Core Layer
- **Extraction Engine**: Orchestrates extraction
- **AI Providers**: Chrome AI & Gemini Cloud
- **Storage**: Encrypted data persistence
- **Rate Limiting**: Request throttling
- **Error Handling**: Error recovery

### 3. Utility Layer
- **Logger**: Structured logging
- **Validators**: Input validation
- **Formatters**: Data formatting
- **Config Loader**: Configuration management

## Data Flow

User Action → Popup → Background Service Worker
↓
Extraction Engine → HTML Preprocessing
↓
AI Provider (Chrome AI / Gemini)
↓
Post-processing → Smart Features
↓
Results → Export (JSON/CSV)

text

## Message Passing

Extension uses Chrome message passing:
- Popup ↔ Background: Settings, extraction
- Content Script ↔ Background: HTML extraction
- Background: Coordinates all operations

## Storage Architecture

### chrome.storage.local
- Settings (unencrypted)
- Cache (with TTL)
- Rate limit tracking

### chrome.storage.sync
- API keys (encrypted with AES-256-GCM)
- User preferences

## Security

- Content Security Policy enforced
- API keys encrypted at rest
- No third-party data sharing
- Sandboxed content scripts
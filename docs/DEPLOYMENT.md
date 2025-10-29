# Deployment Guide

## Chrome Web Store

### Prerequisites
- Chrome Developer account ($5 one-time fee)
- Extension package (.zip)
- Store listing assets

### Steps
1. Build extension: `./scripts/build.sh`
2. Package: `./scripts/package.sh`
3. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
4. Click "New Item"
5. Upload .zip file
6. Complete store listing
7. Submit for review

### Store Listing Requirements
- Name: Web Weaver Lightning
- Description: 132 chars min
- Screenshots: 1280x800 or 640x400 (5 max)
- Promo image: 440x280
- Icon: 128x128

## Manual Installation

### Developer Mode
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select project directory

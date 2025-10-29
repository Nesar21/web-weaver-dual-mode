#!/bin/bash
# Package extension for Chrome Web Store

VERSION=$(grep '"version"' manifest.json | sed 's/.*"version": "\(.*\)".*/\1/')

echo "Packaging Web Weaver Lightning v${VERSION}..."

# Build first
./scripts/build.sh

# Create zip
cd dist
zip -r ../web-weaver-v${VERSION}.zip .
cd ..

echo "Package created: web-weaver-v${VERSION}.zip"

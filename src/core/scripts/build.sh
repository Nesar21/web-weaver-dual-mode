#!/bin/bash
# Build script for Web Weaver Lightning

echo "Building Web Weaver Lightning..."

# Create dist directory
mkdir -p dist

# Copy all files except tests and docs
rsync -av --exclude='tests/' --exclude='docs/' --exclude='node_modules/' --exclude='.git/' . dist/

# Remove .jpg icons, keep .png only
rm -f dist/assets/icons/*.jpg

echo "Build complete! Package ready in dist/"

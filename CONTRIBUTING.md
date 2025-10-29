# Contributing to Web Weaver Lightning

Thank you for your interest in contributing to Web Weaver Lightning! This document provides guidelines for contributing to the project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)

---

## 🤝 Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow:

- Be respectful and inclusive
- Welcome newcomers and beginners
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards other community members

## 🚀 Getting Started

### Prerequisites

- Google Chrome 128+ (for Chrome Built-in AI testing)
- Basic understanding of JavaScript and Chrome Extensions
- Node.js (optional, for future build tools)
- Git for version control

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
git clone https://github.com/YOUR_USERNAME/web-weaver.git
cd web-weaver

text
3. Add upstream remote:
git remote add upstream https://github.com/ORIGINAL_OWNER/web-weaver.git

text

## 🛠️ Development Setup

### Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `web-weaver` directory
5. The extension should now appear in your toolbar

### Project Structure

web-weaver/
├── config/ # Configuration files
├── src/
│ ├── background/ # Service worker
│ ├── content/ # Content scripts
│ ├── core/ # Core functionality
│ └── utils/ # Utility functions
├── ui/ # User interface
└── assets/ # Icons and resources

text

### Key Technologies

- **Manifest V3**: Chrome Extension API
- **ES6 Modules**: Modern JavaScript
- **Web Audio API**: Audio feedback
- **Chrome Storage API**: Data persistence
- **Gemini API**: Cloud AI provider

## 💡 How to Contribute

### Types of Contributions

We welcome:

- 🐛 **Bug fixes**
- ✨ **New features**
- 📝 **Documentation improvements**
- 🎨 **UI/UX enhancements**
- 🧪 **Test coverage**
- 🌍 **Translations** (future)
- 🔧 **Performance optimizations**

### Finding Issues

- Check [GitHub Issues](https://github.com/ORIGINAL_OWNER/web-weaver/issues)
- Look for `good first issue` label for beginners
- Look for `help wanted` label for priority items
- Ask questions in [Discussions](https://github.com/ORIGINAL_OWNER/web-weaver/discussions)

### Reporting Bugs

When reporting bugs, include:

1. **Description**: Clear description of the issue
2. **Steps to Reproduce**: Detailed steps to reproduce
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Environment**:
   - Chrome version
   - Extension version
   - OS (Windows, Mac, Linux)
6. **Screenshots/Logs**: If applicable
7. **Console Errors**: Any error messages

### Suggesting Features

When suggesting features, include:

1. **Use Case**: Why is this feature needed?
2. **Proposed Solution**: How would it work?
3. **Alternatives**: Other approaches considered
4. **Additional Context**: Mockups, examples, references

## 📏 Coding Standards

### JavaScript Style

- **ES6+**: Use modern JavaScript features
- **Modules**: Use ES6 import/export
- **Async/Await**: Prefer over callbacks/promises
- **Arrow Functions**: Use where appropriate
- **Const/Let**: No `var`
- **Semicolons**: Required

### Naming Conventions

// Constants (SCREAMING_SNAKE_CASE)
const MAX_RETRIES = 3;

// Variables (camelCase)
const extractionMode = 'extract_all';

// Functions (camelCase, verb-first)
function extractData() {}
async function loadSettings() {}

// Classes (PascalCase)
class ExtractionEngine {}

// Private (underscore prefix)
function _privateHelper() {}

// File names (kebab-case)
// extraction-engine.js, rate-limiter.js

text

### Code Organization

// 1. Imports
import { logger } from '../utils/logger.js';

// 2. Constants
const DEFAULT_TIMEOUT = 60000;

// 3. State/Variables
let currentState = null;

// 4. Main Functions (public API)
export async function extract() {}

// 5. Helper Functions (private)
function _parseHTML() {}

// 6. Exports (if not inline)
export { extract, parseData };

text

### JSDoc Comments

All functions should have JSDoc comments:

/**

Extract structured data from webpage

@param {Object} options - Extraction options

@param {string} options.mode - Extraction mode (extract_all/extract_main)

@param {string} options.contentType - Content type to extract

@returns {Promise<Object>} Extraction result

@throws {Error} If extraction fails
*/
export async function extract(options) {
// Implementation
}

text

### Error Handling

// Always use try-catch for async operations
try {
const result = await extract();
return { success: true, data: result };
} catch (error) {
logger.error('Extraction failed', error);
return { success: false, error: error.message };
}

text

### Logging

// Use logger, not console
import { createLogger } from './logger.js';

const logger = createLogger('ModuleName');

logger.debug('Detailed debug info');
logger.info('General information');
logger.warn('Warning message');
logger.error('Error occurred', error);

text

## 📝 Commit Guidelines

### Commit Message Format

<type>(<scope>): <subject>

<body> <footer> ```
Types
feat: New feature

fix: Bug fix

docs: Documentation changes

style: Code style changes (formatting, no logic change)

refactor: Code refactoring (no feature change)

perf: Performance improvements

test: Adding/updating tests

chore: Maintenance tasks (dependencies, build)

Examples
text
# Feature
feat(extraction): add screenshot support for extract main mode

# Bug fix
fix(rate-limiter): correct RPM calculation for Gemini models

# Documentation
docs(readme): update installation instructions

# Refactor
refactor(storage): simplify encryption key derivation
Commit Best Practices
One logical change per commit

Write meaningful commit messages

Reference issue numbers (#123)

Keep commits atomic and focused

🔄 Pull Request Process
Before Submitting
Update from upstream:

text
git fetch upstream
git rebase upstream/main
Test your changes:

Load extension in Chrome

Test affected functionality

Check console for errors

Update documentation:

Update README if needed

Update JSDoc comments

Update CHANGELOG.md

PR Checklist
 Code follows project style guidelines

 All functions have JSDoc comments

 Changes are tested in Chrome

 Documentation is updated

 No console errors or warnings

 Commit messages follow guidelines

 PR description is clear and complete

PR Description Template
text
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Fixes #123

## Testing
How did you test these changes?

## Screenshots (if applicable)
Add screenshots to demonstrate changes

## Checklist
- [ ] My code follows the project style
- [ ] I have tested my changes
- [ ] I have updated documentation
- [ ] I have added JSDoc comments
Review Process
Maintainers will review your PR

Address any requested changes

Once approved, PR will be merged

Your contribution will be credited in CHANGELOG

🧪 Testing
Manual Testing
Load extension in Chrome

Test affected features thoroughly

Test edge cases and error scenarios

Verify UI updates correctly

Check console for errors

Browser Compatibility
Test on Chrome 128+ (primary target)

Test on Chromium-based browsers (Edge, Brave) if possible

Test Scenarios
Extraction on various websites

Different content types

Rate limiting behavior

Error handling and recovery

Settings persistence

Theme switching

📖 Documentation
What to Document
New features (README, user guide)

Configuration changes (config files)

API changes (JSDoc, developer guide)

Breaking changes (CHANGELOG, migration guide)

Documentation Style
Clear and concise

Use examples

Include code snippets

Add screenshots for UI changes

Keep it up-to-date

🎉 Recognition
Contributors will be:

Listed in CHANGELOG.md

Credited in release notes

Mentioned in README contributors section

Appreciated in the community!

📧 Questions?
Open a Discussion

Ask in Issues

Email: support@example.com

🙏 Thank You!
Your contributions make Web Weaver Lightning better for everyone. We appreciate your time and effort!

Happy Contributing! 🚀
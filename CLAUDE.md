# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands
- Run tests: `npm test`
- Run single test: `npm run test:only`
- Lint code: `npm run lint`
- Fix linting issues: `npm run lint:fix`

## Code Style
- Use 'neostandard' ESLint configuration
- Strict mode: Include `'use strict'` at the top of each file
- Imports: Use CommonJS `require()` syntax
- Indentation: 2 spaces
- Quotes: Single quotes for strings
- Error handling: Use Node.js style callback patterns or async/await
- Logging: Use `console.log` for debugging (remove in production)
- Classes: Use ES6 class syntax
- Object destructuring preferred when accessing properties
- Testing: Uses Node.js built-in test module

## TLS Configuration
This module extends Undici to support domain-specific TLS configurations for HTTPS requests.
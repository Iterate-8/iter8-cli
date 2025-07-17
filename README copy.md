# TypeScript CLI App Foundation

A clean, extensible CLI app foundation using TypeScript, Commander.js, chalk, ora, axios, and fs-extra.

## Features
- Commander.js CLI structure
- TypeScript compilation
- Colored output (chalk)
- Spinner/loading indicators (ora)
- File operations with error handling (fs-extra)
- HTTP requests (axios)
- Basic config management
- Simple logging utility

## Scripts
- `npm run build` – Compile TypeScript
- `npm run dev` – Run with ts-node for development
- `npm start` – Run compiled JavaScript

## Getting Started
1. Install dependencies: `npm install`
2. Build: `npm run build`
3. Run (dev): `npm run dev`
4. Run (prod): `npm start`

## Structure
- `src/` – Source TypeScript files
- `dist/` – Compiled JavaScript output

## Extending
Add new commands in `src/cli.ts` and utilities in `src/utils/`.

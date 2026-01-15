# Guess Number (Tauri + React + Vite)

A modern, cross-platform Number Guessing Game (Bulls and Cows) built with Tauri v2, React, and Tailwind CSS.

## Features
- **Configurable Difficulty**: Set any number of digits (3-10).
- **Flexible Rules**: Choose between Unique Digits or Allow Duplicates.
- **Modern UI**: Dark mode interface with Tailwind CSS styling.
- **History Tracking**: Visual history of your guesses and results (A/B).

## Development

### Prerequisites
- Node.js & pnpm
- Rust (for Tauri)

### Setup

```bash
cd guess-number
pnpm install
```

### Run in Development Mode

```bash
pnpm tauri dev
```

### Build for Production

```bash
pnpm tauri build
```

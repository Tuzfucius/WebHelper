# Utilities Module

This directory contains helper functions and shared logic.

## Files

- **context.ts**
  - `contextEngine`: Manages the LRU cache of visited page summaries (`page_memory`).
  - Provides methods to `addPage` and `getRelevantContext` for cross-page analysis.

- **i18n.ts**
  - Contains the translation dictionary (`en` and `zh`).
  - Exports the `useTranslation` hook for localized text.

- **messaging.ts**
  - Typed wrappers around `chrome.runtime.sendMessage` and `chrome.runtime.onMessage`.
  - Ensures type safety for cross-component communication (Content Script <-> SidePanel <-> Background).

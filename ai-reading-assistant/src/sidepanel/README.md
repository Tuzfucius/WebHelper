# SidePanel Module

This directory contains the main UI components for the Chrome Extension side panel.

## Key Components

- **SidebarPanel.tsx**
  - The main container for the side panel application.
  - Manages view switching (Chat, Dashboard, Settings).
  - Handles chat logic, message history, and API communication.
  - Integrates `useTranslation` for internationalization.

- **SettingsPage.tsx**
  - (Legacy) Standalone settings page, now largely integrated into the `SidebarPanel`'s settings view.

## Components Directory (`/components`)

- **APIConfiguration.tsx**: Form for configuring LLM providers (OpenAI, Anthropic, Custom), API keys, and model parameters.
- **PromptManager.tsx**: UI for creating, editing, and selecting system prompts (personas).
- **ReadingDashboard.tsx**: Visualizes reading statistics using `recharts`.
- **UrlManager.tsx**: Manages the list of selected URLs (mock implementation for now).
- **ScreenshotCropper.tsx**: Tool for capturing regions of the visible tab.
- **ElementPicker.tsx**: (If present) Tool for selecting DOM elements for context.

## State Management
The SidePanel relies on `AppContext` (from `../stores`) for global state like settings, messages, and reading stats.

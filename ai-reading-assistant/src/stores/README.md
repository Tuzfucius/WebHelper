# Stores Module

This directory manages the global state of the application using React Context and `useReducer`.

## Files

- **AppContext.tsx**
  - Defines the `AppState` interface and initial state.
  - Provides the `AppProvider` component to wrap the application.
  - Exports custom hooks for accessing specific parts of the state:
    - `useSettings()`: Access and update application settings (API, Theme, Language).
    - `useMessages()`: Manage chat history.
    - `useReadingStats()`: Track and update reading time and article counts.
    - `useConnection()`: Track API connection status.
  - Handles persistence to `chrome.storage.local`.

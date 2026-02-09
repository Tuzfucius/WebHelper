/// <reference types="chrome" />

// Chrome extension types
interface Storage {
  local: {
    get: (keys: string[], callback: (items: { [key: string]: any }) => void
    set: (items: { [key: string]: any }) => void
    remove: (keys: string[], callback: () => void
    clear: (callback: () => void
  }
}

interface Tabs {
  query: {
    query: (info: { active: true, currentWindow: true, url: string | URLFilter }, callback: (tabs: chrome.tabs.Tab[] | undefined) => void
    remove: (tabId: number, callback: () => void
  }
}

interface Sidebar {
  open: (options?: { windowId?: number }, callback?: () => void) => void
  }
}

interface Runtime {
  getManifest: () => chrome.runtime.Manifest
}

declare const chrome: {
  storage: Storage
  tabs: Tabs
  sidebar: Sidebar
  runtime: Runtime
}

export {}
import { onMessage } from '../utils/messaging'

// Service Worker for handling background tasks
console.log('AI Reading Assistant Service Worker loaded')

chrome.runtime.onInstalled.addListener((details: any) => {
  console.log('AI Reading Assistant installed:', details)

  // Initialize default settings
  chrome.storage.local.set({
    settings: {
      provider: 'openai',
      apiKey: '',
      baseUrl: '',
      selectedUrls: [],
      apiConfigs: [],
      activeConfigId: '',
      incognitoMode: false
    }
  })
})

// Use strict message typing
chrome.runtime.onMessage.addListener((message: any, sender: any, sendResponse: any) => {
  if (message.type === 'OPEN_SIDEPANEL') {
    // Open the side panel for the current window
    if (sender.tab?.windowId) {
      chrome.sidePanel.open({ windowId: sender.tab.windowId })
        .then(() => {
          // Forward the message to the sidepanel after it opens
          setTimeout(() => {
            chrome.runtime.sendMessage({
              type: 'OPEN_SIDEPANEL',
              payload: message.payload
            }).catch(() => {
              // Ignore errors if sidepanel is not yet ready/listening
            })
          }, 500)
        })
        .catch(console.error)
    }
    sendResponse({ success: true })
  }
  return true
})

// Keep service worker alive
self.addEventListener('activate', () => {
  console.log('Service Worker activated')
})
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

// Web Search handler (for future MCP integration)
chrome.runtime.onMessage.addListener((message: any, sender: any, sendResponse: any) => {
  // Handle OPEN_SIDEPANEL
  if (message.type === 'OPEN_SIDEPANEL') {
    if (sender.tab?.windowId) {
      chrome.sidePanel.open({ windowId: sender.tab.windowId })
        .then(() => {
          setTimeout(() => {
            chrome.runtime.sendMessage({
              type: 'OPEN_SIDEPANEL',
              payload: message.payload
            }).catch(() => {})
          }, 500)
        })
        .catch(console.error)
    }
    sendResponse({ success: true })
    return true
  }
  
  // Handle WEB_SEARCH (placeholder for future MCP integration)
  if (message.type === 'WEB_SEARCH') {
    // TODO: Integrate with exa-web-search-free MCP
    // For now, return a placeholder response
    sendResponse({
      success: false,
      error: 'Web search requires MCP integration. Please configure exa-web-search-free.',
      results: []
    })
    return true
  }
  
  return false
})

// Keep service worker alive
self.addEventListener('activate', () => {
  console.log('Service Worker activated')
})

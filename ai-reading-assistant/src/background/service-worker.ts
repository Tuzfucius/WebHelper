// Service Worker for handling background tasks
// @ts-ignore - chrome API exists in extension context
console.log('AI Reading Assistant Service Worker loaded')

// @ts-ignore - chrome API exists in extension context
chrome.runtime.onInstalled.addListener((details: any) => {
  console.log('AI Reading Assistant installed:', details)
  
  // Initialize default settings
  // @ts-ignore - chrome.storage exists
  chrome.storage.local.set({
    settings: {
      provider: 'openai',
      apiKey: '',
      baseUrl: '',
      selectedUrls: []
    }
  })
})

// @ts-ignore - chrome API exists in extension context
chrome.runtime.onMessage.addListener((message: any, sender: any, sendResponse: any) => {
  console.log('Message received in service worker:', message)
  
  switch (message.type) {
    case 'open-sidepanel':
      // @ts-ignore - chrome.sidePanel exists
      chrome.sidePanel.open({ windowId: sender.tab?.windowId })
      sendResponse({ success: true })
      break
      
    case 'get-tab-info':
      sendResponse({
        url: sender.tab?.url || '',
        title: sender.tab?.title || ''
      })
      break
      
    default:
      sendResponse({ success: false, error: 'Unknown message type' })
  }
  
  return true // Indicates async response
})

// Keep service worker alive
self.addEventListener('activate', () => {
  console.log('Service Worker activated')
})
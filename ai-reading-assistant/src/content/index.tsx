import React from 'react'
import { createRoot } from 'react-dom/client'
import { FloatingButton } from './FloatingButton'
import { SelectionPopover } from './SelectionPopover'
import { ElementPicker } from './ElementPicker' // Import ElementPicker
import { AppProvider } from '../stores/AppContext'
import { sendMessage } from '../utils/messaging'
import { extractPageContent } from './extractor'
import '../index.css'

// Listen for requests to get page content
// This must be top-level or inside a function that runs once. 
// Since this is a content script, it runs once per page load.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_PAGE_CONTENT') {
        const data = extractPageContent()
        sendResponse(data)
    }
    return undefined // Sync response (or async if we returned true)
})

// Create a container for our extension
const container = document.createElement('div')
container.id = 'ai-reading-assistant-root'
document.body.appendChild(container)

// Use Shadow DOM to isolate styles
const shadowRoot = container.attachShadow({ mode: 'open' })

// Function to mount the app
function mount() {
    const rootContainer = document.createElement('div')
    rootContainer.className = 'ai-assistant-content-wrapper'
    shadowRoot.appendChild(rootContainer)

    const root = createRoot(rootContainer)

    // Create a wrapper component to handle state
    const ContentApp = () => {
        const [selectionText, setSelectionText] = React.useState('')

        return (
            <AppProvider>
                <div className="font-sans antialiased text-slate-900">
                    <style>{`
             :host { all: initial; }
             .ai-assistant-content-wrapper { font-family: system-ui, -apple-system, sans-serif; }
           `}</style>

                    <FloatingButton
                        onClick={() => {
                            sendMessage('OPEN_SIDEPANEL', { context: '' })
                        }}
                    />

                    <SelectionPopover
                        text={selectionText}
                        onSelect={(text) => {
                            setSelectionText(text)
                            sendMessage('OPEN_SIDEPANEL', { context: text })
                        }}
                    />

                    <ElementPicker />
                </div>
            </AppProvider>
        )
    }

    root.render(<ContentApp />)
}

mount()

import React from 'react'
import ReactDOM from 'react-dom/client'
import { SidePanel } from './SidebarPanel' // Ensure filename case matches
import { SettingsPage } from './SettingsPage'
import { AppProvider } from '../stores/AppContext'
import '../index.css'

function SidePanelApp() {
    const [currentView, setCurrentView] = React.useState<'chat' | 'settings'>('chat')
    const [initialContext, setInitialContext] = React.useState('')

    React.useEffect(() => {
        // Listen for messages from content script or background
        const handleMessage = (message: any, sender: any, sendResponse: any) => {
            if (message.type === 'open-sidepanel') {
                if (message.payload?.context) {
                    setInitialContext(message.payload.context)
                }
            }
        }

        chrome.runtime.onMessage.addListener(handleMessage)
        return () => chrome.runtime.onMessage.removeListener(handleMessage)
    }, [])

    return (
        <AppProvider>
            <div className="h-screen w-full overflow-hidden bg-[#FEF7FF]">
                {currentView === 'chat' ? (
                    <SidePanel
                        initialContext={initialContext}
                        onClose={() => window.close()} // Or minimalize
                    />
                ) : (
                    <SettingsPage />
                )}
            </div>
        </AppProvider>
    )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <SidePanelApp />
    </React.StrictMode>,
)

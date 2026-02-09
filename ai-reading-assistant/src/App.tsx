import React, { useState, useEffect } from 'react'
import { FloatingButton } from './content/FloatingButton'
import { SelectionPopover } from './content/SelectionPopover'
import { SidePanel } from './sidepanel/SidePanel'
import { AppProvider } from './stores/AppContext'
import { SettingsPage } from './sidepanel/SettingsPage'

function AppContent() {
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false)
  const [currentView, setCurrentView] = useState<'chat' | 'settings'>('chat')
  const [selectionText, setSelectionText] = useState('')

  useEffect(() => {
    // Listen for side panel open/close events
    const handleMessage = (event: any) => {
      if (event.type === 'side-panel-toggle') {
        setIsSidePanelOpen(event.detail.open)
        setCurrentView('chat')
      }
      if (event.type === 'selection-text') {
        setSelectionText(event.detail.text)
      }
    }

    // Listen for show-settings event
    const handleShowSettings = () => {
      if (isSidePanelOpen) {
        setCurrentView('settings')
      }
    }

    window.addEventListener('message', handleMessage)
    window.addEventListener('show-settings', handleShowSettings)
    
    return () => {
      window.removeEventListener('message', handleMessage)
      window.removeEventListener('show-settings', handleShowSettings)
    }
  }, [isSidePanelOpen])

  const handleCloseSidePanel = () => {
    setIsSidePanelOpen(false)
    setCurrentView('chat')
  }

  return (
    <>
      <FloatingButton 
        onClick={() => {
          setIsSidePanelOpen(true)
          setCurrentView('chat')
        }} 
      />
      <SelectionPopover 
        text={selectionText} 
        onSelect={(text) => {
          setSelectionText(text)
          setIsSidePanelOpen(true)
          setCurrentView('chat')
        }} 
      />
      
      {isSidePanelOpen && (
        <div className="fixed right-0 top-0 h-full w-[320px] shadow-2xl z-50 animate-slide-up">
          {currentView === 'settings' ? (
            <SettingsPage />
          ) : (
            <SidePanel 
              initialContext={selectionText}
              onClose={handleCloseSidePanel}
            />
          )}
        </div>
      )}
    </>
  )
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}

export default App
import React, { useState, useEffect } from 'react'
import { useSettings, useMessages } from '../stores/AppContext'
import { ScreenshotCropper } from '../components/ScreenshotCropper'
import type { EnhancedContextData } from '../types'

interface SidePanelProps {
  initialContext: string
  onClose: () => void
}

export const SidePanel: React.FC<SidePanelProps> = ({ initialContext, onClose }) => {
  const { settings } = useSettings()
  const { addMessage } = useMessages()
  const [currentView, setCurrentView] = useState<'chat' | 'settings'>('chat')
  const [userInput, setUserInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isScreenshotMode, setIsScreenshotMode] = useState(false)
  const [contextScreenshot, setContextScreenshot] = useState<type.ScreenshotData | undefined>(undefined)

  useEffect(() => {
    const handleSelectionText = (event: any) => {
      if (event.type === 'selection-text') {
        setUserInput(event.detail.text || '')
      }
    }

    const handleScreenshotCaptured = (event: any) => {
      if (event.type === 'screenshot-captured') {
        setContextScreenshot(event.detail.screenshot)
      }
    }

    const handleShowSettings = () => {
      if (isSidebarOpen) {
        setCurrentView('settings')
      }
    }

    window.addEventListener('message', handleSelectionText)
    window.addEventListener('message', handleScreenshotCaptured)
    window.addEventListener('show-settings', handleShowSettings as EventListener)
    
    return () => {
      window.removeEventListener('message', handleSelectionText)
      window.removeEventListener('message', handleScreenshotCaptured)
      window.removeEventListener('show-settings', handleShowSettings as EventListener)
    }
  }, [isSidebarOpen])

  useEffect(() => {
    const handleMessage = (event: any) => {
      if (event.type === 'side-panel-toggle') {
        setIsSidebarOpen(event.detail.open)
        if (!event.detail.open) {
          setIsScreenshotMode(false)
          setCurrentView('chat')
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const handleSendMessage = async () => {
    if (!userInput.trim() || !settings.apiKey || isTyping) return

    let contextData: EnhancedContextData = {
      url: window.location.href,
      query: userInput
    }

    if (initialContext) {
      contextData.selectedText = initialContext
    }

    if (contextScreenshot) {
      contextData.screenshot = contextScreenshot
    }

    const userMessage = {
      id: (Date.now() + 1).toString(),
      role: 'user' as const,
      content: userInput,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setUserInput('')
    setIsTyping(true)

    try {
      const systemPrompt = `You are an AI reading assistant for academic content. 
      Current page: ${window.location.href}
      ${initialContext ? `Selected text: ${initialContext}` : ''}
      ${contextScreenshot ? `[Screenshot included: ${contextScreenshot.imageData.length} chars]` : ''}
      
      Please help to user understand or analyze this content.`
      
      let response: any = null
      
      if (settings.provider === 'openai') {
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${settings.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              { role: 'system' as const, content: systemPrompt },
              { role: 'user' as const, content: userInput }
            ],
            max_tokens: 1000,
            temperature: 0.7
          })
        })
      } else if (settings.provider === 'anthropic') {
        response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': settings.apiKey,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1000,
            messages: [
              { role: 'user' as const, content: systemPrompt + '\n\n' + userInput }
            ]
          })
        })
      }

      if (response && response.ok) {
        const data = await response.json()
        
        let assistantContent = ''
        if (settings.provider === 'openai') {
          assistantContent = data.choices[0]?.message?.content || 'No response from AI'
        } else if (settings.provider === 'anthropic') {
          assistantContent = data.content[0]?.text || 'No response from AI'
        }

        const assistantMessage = {
          id: (Date.now() + 2).toString(),
          role: 'assistant' as const,
          content: assistantContent,
          timestamp: new Date().toISOString()
        }

        setMessages(prev => [...prev, assistantMessage])
        addMessage({ role: 'assistant' as const, content: assistantContent })
      } else {
        throw new Error('Failed to get response from AI service')
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage = {
        id: (Date.now() + 3).toString(),
        role: 'assistant' as const,
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleToggleScreenshot = () => {
    if (isScreenshotMode) {
      setIsScreenshotMode(false)
    } else {
      const message = new CustomEvent('start-screenshot-mode', {
        detail: { start: true }
      })
      window.dispatchEvent(message)
    }
  }

  const handleClose = () => {
    setIsSidebarOpen(false)
    setCurrentView('chat')
    setIsScreenshotMode(false)
    onClose()
  }

  const handleSettingsClick = () => {
    setCurrentView('settings')
    setIsScreenshotMode(false)
  }

  if (currentView === 'settings') {
    return <div className="h-full flex items-center justify-center">Settings Page would go here</div>
  }

  return (
    <div className="h-full flex flex-col bg-[#FEF7FF]">
      {!isScreenshotMode && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#79747E]/20 bg-[#F3EDF7]">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-[#6750A4] rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.316 3.051a1 1 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100 2v-3a1 1 0 011.1.414l-4 12a1 1 0 010 1.414 0zm0 13.5A6.5 6.5 0 0013 0 6.5 6.5 0 0013 0zm0 9A6.5 6.5 0 0013 0zm0 9A6.5 6.5 0 011.3 0 6.5 6.5 0 0013 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#1D1B20]">AI Assistant</h2>
                <p className="text-xs text-[#49454F]">
                  {settings.provider === 'openai' ? 'OpenAI' : 
                   settings.provider === 'anthropic' ? 'Anthropic' : 'Custom'} AI
                </p>
              </div>
            </div>
          
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSettingsClick}
                className="p-2 rounded-full hover:bg-[#EADDFF] transition-colors"
                title="Settings"
              >
                <svg className="w-5 h-5 text-[#6750A4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756-2.024-1.756 2.924 0 5.348 1.756 2.924zM9.5 3A6.5 6.5 0 0013 0 6.5 6.5 0 0013 0zm0 13.5A6.5 6.5 0 0013 0zm0 9A6.5 6.5 0 011.3 0 6.5 6.5 0 0013 0z" />
                </svg>
              </button>
              
              <button
                onClick={handleToggleScreenshot}
                className="p-2 rounded-full hover:bg-[#6750A4]/10 transition-colors"
                title="Screenshot"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 00-2v6a1 1 0 11.3 0l2 6a1 1 0 010 1.414l-4 12a1 1 0 010 1.414 0zm0 13.5A6.5 6.5 0 0013 0zm0 9A6.5 6.5 0 0013 0zm0 13.5A6.5 6.5 0 011.3 0 6.5 6.5 0 0013 0z" />
                </svg>
              </button>
              
              <button
                onClick={handleClose}
                className="p-2 rounded-full hover:bg-[#6750A4]/10 transition-colors"
                title="Close"
              >
                <svg className="w-4 h-4 text-[#1D1B20]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Initial context message */}
        {initialContext && (
          <div className="p-3 bg-[#EADDFF] rounded-lg border-l-4 border-[#6750A4]">
            <div className="flex items-center space-x-2 mb-2">
              <svg className="w-4 h-4 text-[#6750A4]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.316 3.051a1 1 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100 2v-3a1 1 0 011.1.414l-4 12a1 1 0 010 1.414 0zm0 13.5A6.5 6.5 0 0013 0zm0 9A6.5 6.5 0 011.3 0 6.5 6.5 0 0013 0z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-[#6750A4]">Selected Context</span>
            </div>
            <p className="text-sm text-[#1D1B20] line-clamp-3">
              {initialContext.substring(0, 200)}
              {initialContext.length > 200 && '...'}
            </p>
          </div>
        )}
        
        {/* Screenshot context */}
        {contextScreenshot && (
          <div className="p-3 bg-[#EADDFF] rounded-lg border-l-4 border-[#6750A4]">
            <div className="flex items-center space-x-2 mb-2">
              <svg className="w-4 h-4 text-[#6750A4]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.316 3.051a1 1 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100 2v-3a1 1 0 011.1.414l-4 12a1 1 0 010 1.414 0zm0 13.5A6.5 6.5 0 0013 0zm0 9A6.5 6.5 0 011.3 0 6.5 6.5 0 0013 0z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-[#6750A4]">Screenshot Captured</span>
            </div>
            <p className="text-sm text-[#1D1B20]">
              Size: {Math.round(contextScreenshot.rect.width)} × {Math.round(contextScreenshot.rect.height)}
            </p>
          </div>
        )}
        
        {/* Chat Messages */}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-[#6750A4] text-white rounded-br-none'
                  : 'bg-[#F3EDF7] text-[#1D1B20] rounded-bl-none'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p className="text-xs opacity-70 mt-1">
                {message.timestamp}
              </p>
            </div>
          </div>
        ))}
        
        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-[#F3EDF7] text-[#1D1B20] rounded-lg rounded-bl-none p-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-[#6750A4] rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-[#6750A4] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-[#6750A4] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Input Area */}
      <div className="p-4 border-t border-[#79747E]/20 bg-[#F3EDF7]">
        <div className="flex space-x-2">
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask something about the selected text..."
            className="flex-1 px-3 py-2 border border-[#79747E]/30 rounded-lg 
                       bg-white text-[#1D1B20] placeholder-[#79747E]/50
                       focus:outline-none focus:ring-2 focus:ring-[#6750A4]
                       resize-none h-16 text-sm"
            disabled={isTyping || !settings.apiKey}
          />
          <button
            onClick={handleSendMessage}
            disabled={!userInput.trim() || isTyping || !settings.apiKey}
            className="px-4 py-2 bg-[#6750A4] text-white rounded-lg
                       hover:bg-[#5235a0] disabled:bg-[#79747E]/30
                       disabled:text-[#49454F] disabled:cursor-not-allowed
                       transition-colors disabled:transform-none transform hover:scale-105"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9 18 9 2zm0 0v-8" />
            </svg>
          </button>
        </div>
        
        {!settings.apiKey && (
          <p className="text-xs text-[#E74C3C] mt-1 text-center">
            Please configure your API key in settings
          </p>
        )}
      </div>
    </>
  )
    
    {isScreenshotMode && (
      <ScreenshotCropper
        onCapture={(imageData, rect) => {
          const screenshotData = {
            imageData: imageData,
            rect: rect
          }
          setContextScreenshot(screenshotData)
        }}
        onCancel={() => setIsScreenshotMode(false)}
      />
    )}
  </div>
  )
}
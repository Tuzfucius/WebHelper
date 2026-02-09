import React, { useState, useEffect, useRef } from 'react'
import { useSettings, useMessages, useReadingStats } from '../stores/AppContext'
import { ScreenshotCropper } from '../components/ScreenshotCropper'
import { ReadingDashboard } from './components/ReadingDashboard'
import { PromptManager } from './components/PromptManager'
import { APIConfiguration } from './components/APIConfiguration'
import { UrlManager } from './components/UrlManager'
import { onMessage } from '../utils/messaging'
import { contextEngine } from '../utils/context'
import { useTranslation } from '../utils/i18n'
import type { EnhancedContextData, ScreenshotData, PromptTemplate, Message } from '../types'
import { AnimatePresence, motion } from 'framer-motion'
import {
  MessageSquare,
  LayoutDashboard,
  Settings as SettingsIcon,
  X,
  Send,
  Image as ImageIcon,
  Bot,
  User,
  Sparkles,
  Maximize2,
  Moon,
  Sun,
  ChevronDown
} from 'lucide-react'

interface SidePanelProps {
  initialContext: string
  onClose: () => void
}

type ViewMode = 'chat' | 'dashboard' | 'settings'

export const SidePanel: React.FC<SidePanelProps> = ({ initialContext, onClose }) => {
  const { settings, updateSettings } = useSettings()
  const { addMessage } = useMessages()
  const { updateStats } = useReadingStats()
  const t = useTranslation(settings.language)

  const [currentView, setCurrentView] = useState<ViewMode>('chat')
  const [userInput, setUserInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [isScreenshotMode, setIsScreenshotMode] = useState(false)
  const [contextScreenshot, setContextScreenshot] = useState<ScreenshotData | undefined>(undefined)
  const [showPromptSelector, setShowPromptSelector] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'connected' | 'error'>('idle')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Track reading time
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        updateStats(1, 0)
      }
    }, 60000) // Every minute
    return () => clearInterval(interval)
  }, [])

  const handleTestConnection = async () => {
    setIsTestingConnection(true)
    setConnectionStatus('testing')
    try {
      if (settings.provider === 'openai') {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${settings.apiKey}` }
        })
        if (!response.ok) throw new Error('Failed to connect to OpenAI')
      } else if (settings.provider === 'anthropic') {
        const response = await fetch('https://api.anthropic.com/v1/models', {
          headers: {
            'x-api-key': settings.apiKey,
            'anthropic-version': '2023-06-01'
          }
        })
        if (!response.ok) throw new Error('Failed to connect to Anthropic')
      } else if (settings.provider === 'custom') {
        const baseUrl = settings.baseUrl.replace(/\/+$/, '')
        const response = await fetch(`${baseUrl}/models`, {
          headers: {
            'Authorization': `Bearer ${settings.apiKey}`,
            ...(settings.customHeaders || {})
          }
        }).catch(() => null)

        if (!response || !response.ok) {
          throw new Error('Failed to connect to Custom Provider')
        }
      }
      setConnectionStatus('connected')
    } catch (e) {
      console.error('Connection test failed:', e)
      setConnectionStatus('error')
    } finally {
      setIsTestingConnection(false)
    }
  }

  const toggleTheme = () => {
    const newTheme = settings.theme === 'dark' ? 'light' : 'dark'
    updateSettings({ theme: newTheme })
  }

  const toggleLanguage = () => {
    const newLang = settings.language === 'en' ? 'zh' : 'en'
    updateSettings({ language: newLang })
  }

  const handlePromptSelect = (promptId: string) => {
    updateSettings({ activePromptId: promptId })
    setShowPromptSelector(false)
  }

  const activePromptName = (settings.prompts || []).find(p => p.id === settings.activePromptId)?.name || 'Default Assistant'

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  // Apply Theme
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark')
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
      document.documentElement.classList.remove('dark')
    }
  }, [settings.theme])

  // Load chat history
  useEffect(() => {
    chrome.storage.local.get(['chatHistory'], (result) => {
      if (result.chatHistory) {
        setMessages((result.chatHistory as any[]) || [])
      }
    })
  }, [])

  // Save chat history
  useEffect(() => {
    if (messages.length > 0) {
      chrome.storage.local.set({ chatHistory: messages })
    }
  }, [messages])

  useEffect(() => {
    const removeListener = onMessage('SELECTION_TEXT', (payload) => {
      setUserInput(payload.text)
    })

    const removeOpenListener = onMessage('OPEN_SIDEPANEL', (payload) => {
      if (payload?.context) {
        setUserInput(payload.context)
      }
    })

    const removeScreenshotListener = onMessage('SCREENSHOT_CAPTURED', (payload) => {
      setContextScreenshot(payload)
    })

    return () => {
      removeListener()
      removeOpenListener()
      removeScreenshotListener()
    }
  }, [])

  const handleSendMessage = async () => {
    if (!userInput.trim() || isTyping) return

    if (!settings.apiKey) {
      alert('Please configure your API Key in the Settings tab first.')
      setCurrentView('settings')
      return
    }

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

    // Log article read if context is significantly long
    if (initialContext.length > 50) {
      try {
        chrome.storage.local.get(['lastArticleRead'], (res) => {
          const now = Date.now();
          const lastRead = Number(res.lastArticleRead || 0);
          if (!res.lastArticleRead || (now - lastRead > 300000)) { // 5 mins
            updateStats(0, 1);
            chrome.storage.local.set({ lastArticleRead: now });
          }
        });
      } catch (e) { }
    }

    try {
      const currentPrompts = settings.prompts || []
      const activePrompt = currentPrompts.find(p => p.id === settings.activePromptId)
      let systemContent = activePrompt?.content || 'You are a helpful AI reading assistant.'

      // Retrieve context memory
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
        if (tabs[0]?.id) {
          const pageContent = await chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_PAGE_CONTENT' }).catch(() => null)

          if (pageContent) {
            const pageCtx = {
              url: tabs[0].url || '',
              title: pageContent.title,
              content: pageContent.excerpt || pageContent.content.substring(0, 500),
              timestamp: Date.now()
            }
            await contextEngine.addPage(pageCtx, settings.contextLength)
            const previousContext = await contextEngine.getRelevantContext(pageCtx.url, settings.contextLength)

            if (previousContext) {
              systemContent += `\n\nRelevant Context from previous pages:\n${previousContext}`
            }
          }
        }
      } catch (e) {
        console.warn('Failed to fetch page content or memory:', e)
      }

      // Construct fullContent
      let fullContent = userInput;
      if (initialContext) {
        fullContent = `Selected text: ${initialContext}\n\n${fullContent}`;
      }
      if (contextScreenshot) {
        fullContent = `[Screenshot included: ${contextScreenshot.imageData.length} chars]\n\n${fullContent}`;
      }

      const apiMessages = [
        ...messages.map(m => ({
          role: m.role,
          content: m.content
        })),
        { role: 'user' as const, content: fullContent }
      ]

      let response: any = null
      let responseContent = ''

      // API Logic
      if (settings.provider === 'openai') {
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${settings.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: settings.modelName || 'gpt-3.5-turbo',
            messages: apiMessages,
            max_tokens: 1000,
            temperature: 0.7
          })
        })
        const data = await response.json()
        responseContent = data.choices[0]?.message?.content || 'No response from AI'
      } else if (settings.provider === 'anthropic') {
        response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': settings.apiKey,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: settings.modelName || 'claude-3-haiku-20240307',
            max_tokens: 1000,
            system: systemContent,
            messages: [
              ...messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content })),
              { role: 'user' as const, content: fullContent }
            ]
          })
        })
        const data = await response.json()
        responseContent = data.content[0]?.text || 'No response from AI'
      } else if (settings.provider === 'custom') {
        const protocol = settings.protocol || 'openai'
        if (protocol === 'openai') {
          const baseUrl = settings.baseUrl.replace(/\/+$/, '')
          response = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${settings.apiKey}`,
              'Content-Type': 'application/json',
              ...(settings.customHeaders || {})
            },
            body: JSON.stringify({
              model: settings.modelName,
              messages: apiMessages,
              max_tokens: 1000,
              temperature: 0.7
            })
          })
          const data = await response.json()
          responseContent = data.choices[0]?.message?.content || 'No response from AI'
        } else {
          const baseUrl = settings.baseUrl.replace(/\/+$/, '')
          response = await fetch(`${baseUrl}/messages`, {
            method: 'POST',
            headers: {
              'x-api-key': settings.apiKey,
              'Content-Type': 'application/json',
              'anthropic-version': '2023-06-01',
              ...(settings.customHeaders || {})
            },
            body: JSON.stringify({
              model: settings.modelName,
              max_tokens: 1000,
              system: systemContent,
              messages: [
                ...messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content })),
                { role: 'user' as const, content: fullContent }
              ]
            })
          })
          const data = await response.json()
          responseContent = data.content[0]?.text || 'No response from AI'
        }
      }

      if (response && response.ok) {
        const assistantContent = responseContent || 'No response from AI'
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

  return (
    <div className={`h-full flex flex-col font-sans transition-colors duration-200 ${settings.theme === 'dark' ? 'bg-[#141218] text-[#E6E1E5]' : 'bg-[#FDFCFE] text-[#1D1B20]'
      }`}>
      {!isScreenshotMode && (
        <>
          {/* Header */}
          <header className="flex-none px-4 py-3 bg-white/80 dark:bg-[#141218]/80 backdrop-blur-md border-b border-[#E7E0EC] dark:border-[#49454F] sticky top-0 z-10 flex items-center justify-between transition-colors">
            <div className="flex items-center gap-2 relative">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#D0BCFF] to-[#EADDFF] flex items-center justify-center text-[#21005D]">
                <Sparkles size={18} />
              </div>
              <div
                className="cursor-pointer group"
                onClick={() => setShowPromptSelector(!showPromptSelector)}
              >
                <h1 className="text-sm font-semibold leading-tight flex items-center gap-1 dark:text-[#E6E1E5]">
                  {activePromptName}
                  <ChevronDown size={14} className={`transition-transform duration-200 ${showPromptSelector ? 'rotate-180' : ''}`} />
                </h1>
                <p className="text-[10px] text-[#49454F] dark:text-[#CAC4D0] font-medium leading-none opacity-80 group-hover:opacity-100 transition-opacity">
                  {settings.provider === 'openai' ? 'GPT-3.5' : settings.provider === 'anthropic' ? 'Claude 3' : 'Custom'}
                </p>
              </div>

              {/* Prompt Selector Dropdown */}
              <AnimatePresence>
                {showPromptSelector && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-[#2B2930] rounded-xl shadow-lg border border-[#E7E0EC] dark:border-[#49454F] overflow-hidden z-50 origin-top-left"
                  >
                    <div className="py-1">
                      {(settings.prompts || []).map(p => (
                        <button
                          key={p.id}
                          onClick={() => handlePromptSelect(p.id)}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between
                            ${settings.activePromptId === p.id
                              ? 'bg-[#EADDFF] text-[#21005D] dark:bg-[#4A4458] dark:text-[#E8DEF8]'
                              : 'text-[#1D1B20] dark:text-[#E6E1E5] hover:bg-[#F3EDF7] dark:hover:bg-[#36343B]'
                            }`}
                        >
                          {p.name}
                          {settings.activePromptId === p.id && <Sparkles size={12} />}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={toggleLanguage}
                className={`p-2 rounded-full transition-colors ${settings.theme === 'dark' ? 'hover:bg-[#49454F] text-[#CAC4D0]' : 'hover:bg-[#F3EDF7] text-[#49454F]'
                  }`}
                title={t.language}
              >
                <div className="flex items-center justify-center w-[18px] h-[18px] text-[10px] font-bold border border-current rounded">
                  {settings.language === 'en' ? 'EN' : '中'}
                </div>
              </button>
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-full transition-colors ${settings.theme === 'dark' ? 'hover:bg-[#49454F] text-[#CAC4D0]' : 'hover:bg-[#F3EDF7] text-[#49454F]'
                  }`}
                title={t.theme}
              >
                {settings.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button
                onClick={() => {
                  if (confirm(t.clearChat + '?')) {
                    setMessages([])
                    chrome.storage.local.remove(['chatHistory'])
                  }
                }}
                className={`p-2 rounded-full transition-colors ${settings.theme === 'dark' ? 'hover:bg-[#49454F] text-[#CAC4D0]' : 'hover:bg-[#F3EDF7] text-[#49454F]'
                  }`}
                title={t.clearChat}
              >
                <div className="relative">
                  <MessageSquare size={18} />
                  <X size={10} className="absolute -top-1 -right-1" />
                </div>
              </button>
              <button
                onClick={onClose}
                className={`p-2 rounded-full transition-colors ${settings.theme === 'dark' ? 'hover:bg-[#49454F] text-[#CAC4D0]' : 'hover:bg-[#F3EDF7] text-[#49454F]'
                  }`}
                title="Close Panel"
              >
                <X size={18} />
              </button>
            </div>
          </header>

          {/* Navigation Tabs */}
          <div className="flex p-1 mx-4 mt-2 bg-[#F3EDF7] dark:bg-[#2B2930] rounded-full transition-colors">
            {(['chat', 'dashboard', 'settings'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setCurrentView(mode)}
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${currentView === mode
                  ? 'bg-white text-[#21005D] shadow-sm dark:bg-[#4A4458] dark:text-[#E8DEF8]'
                  : 'text-[#49454F] hover:text-[#1D1B20] dark:text-[#CAC4D0] dark:hover:text-[#E6E1E5]'
                  }`}
              >
                {mode === 'chat' && <MessageSquare size={14} />}
                {mode === 'dashboard' && <LayoutDashboard size={14} />}
                {mode === 'settings' && <SettingsIcon size={14} />}
                <span className="capitalize">{t[mode]}</span>
              </button>
            ))}
          </div>

          {/* Render Content */}
          <div className="flex-1 overflow-hidden relative">
            <AnimatePresence mode='wait'>
              {currentView === 'chat' && (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="absolute inset-0 flex flex-col"
                >
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Initial Context Bubble */}
                    {initialContext && (
                      <div className="bg-[#EADDFF]/50 border border-[#D0BCFF] rounded-2xl rounded-tl-none p-3 text-sm dark:bg-[#4A4458]/50 dark:border-[#49454F] dark:text-[#E6E1E5]">
                        <div className="flex items-center gap-2 text-[#21005D] mb-1 font-medium text-xs uppercase tracking-wider dark:text-[#E8DEF8]">
                          <Maximize2 size={12} />
                          <span>{t.contextSelected}</span>
                        </div>
                        <p className="text-[#1D1B20] line-clamp-3 opacity-90 dark:text-[#E6E1E5]">{initialContext}</p>
                      </div>
                    )}

                    {contextScreenshot && (
                      <div className="bg-[#EADDFF]/50 border border-[#D0BCFF] rounded-2xl rounded-tl-none p-3 text-sm dark:bg-[#4A4458]/50 dark:border-[#49454F] dark:text-[#E6E1E5]">
                        <div className="flex items-center gap-2 text-[#21005D] mb-1 font-medium text-xs uppercase tracking-wider dark:text-[#E8DEF8]">
                          <ImageIcon size={12} />
                          <span>{t.screenshot}</span>
                        </div>
                        <p className="text-[#1D1B20] opacity-90 dark:text-[#E6E1E5]">Captured Region: {Math.round(contextScreenshot.rect.width)}x{Math.round(contextScreenshot.rect.height)}</p>
                      </div>
                    )}

                    {/* Welcome Message */}
                    {messages.length === 0 && !initialContext && (
                      <div className="flex flex-col items-center justify-center h-full text-center p-6 opacity-60 dark:opacity-40">
                        <div className="w-16 h-16 bg-[#EADDFF] rounded-full flex items-center justify-center mb-4 text-[#21005D] dark:bg-[#4A4458] dark:text-[#E8DEF8]">
                          <Bot size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-[#1D1B20] dark:text-[#E6E1E5]">{t.howCanIHelp}</h3>
                        <p className="text-sm text-[#49454F] mt-2 dark:text-[#CAC4D0]">{t.selectTextHint}</p>
                      </div>
                    )}

                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse text-right' : 'flex-row'}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex-none flex items-center justify-center ${msg.role === 'user' ? 'bg-[#6750A4] text-white' : 'bg-[#EADDFF] text-[#21005D] dark:bg-[#4A4458] dark:text-[#E8DEF8]'
                          }`}>
                          {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                        </div>
                        <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm text-left ${msg.role === 'user'
                          ? 'bg-[#6750A4] text-white rounded-tr-none'
                          : 'bg-white border border-[#E7E0EC] text-[#1D1B20] rounded-tl-none dark:bg-[#2B2930] dark:border-[#49454F] dark:text-[#E6E1E5]'
                          }`}>
                          <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#EADDFF] flex-none flex items-center justify-center text-[#21005D] dark:bg-[#4A4458] dark:text-[#E8DEF8]">
                          <Bot size={16} />
                        </div>
                        <div className="bg-white border border-[#E7E0EC] rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex gap-1 dark:bg-[#2B2930] dark:border-[#49454F]">
                          <span className="w-1.5 h-1.5 bg-[#6750A4] rounded-full animate-bounce dark:bg-[#D0BCFF]" />
                          <span className="w-1.5 h-1.5 bg-[#6750A4] rounded-full animate-bounce [animation-delay:0.2s] dark:bg-[#D0BCFF]" />
                          <span className="w-1.5 h-1.5 bg-[#6750A4] rounded-full animate-bounce [animation-delay:0.4s] dark:bg-[#D0BCFF]" />
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Area */}
                  <div className="p-4 bg-white border-t border-[#E7E0EC] dark:bg-[#141218] dark:border-[#49454F]">
                    <div className="relative flex gap-2">
                      <textarea
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder={t.askAnything}
                        className="w-full pl-4 pr-12 py-3 bg-[#F3EDF7] rounded-3xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6750A4]/50 focus:bg-white transition-all resize-none h-[52px] dark:bg-[#2B2930] dark:text-[#E6E1E5] dark:focus:ring-[#D0BCFF]/50 dark:focus:bg-[#141218]"
                        style={{ scrollbarWidth: 'none' }}
                      />
                      <div className="absolute right-2 top-1.5 flex gap-1">
                        <button
                          onClick={handleToggleScreenshot}
                          className={`p-2 rounded-full transition-colors ${isScreenshotMode ? 'bg-[#EADDFF] text-[#21005D] dark:bg-[#4A4458] dark:text-[#E8DEF8]' : 'hover:bg-[#E7E0EC] text-[#49454F] dark:hover:bg-[#49454F] dark:text-[#CAC4D0]'}`}
                          title={t.screenshot}
                        >
                          <ImageIcon size={18} />
                        </button>
                        <button
                          onClick={handleSendMessage}
                          disabled={!userInput.trim() || isTyping}
                          className="p-2 bg-[#6750A4] text-white rounded-full hover:bg-[#5235a0] disabled:opacity-50 disabled:cursor-not-allowed transition-all dark:bg-[#D0BCFF] dark:text-[#381E72] dark:hover:bg-[#E8DEF8]"
                        >
                          <Send size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentView === 'dashboard' && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="absolute inset-0 overflow-y-auto"
                >
                  <ReadingDashboard />
                </motion.div>
              )}

              {currentView === 'settings' && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="absolute inset-0 overflow-y-auto p-4 space-y-6"
                >
                  <APIConfiguration
                    settings={settings}
                    onUpdate={updateSettings}
                    connectionStatus={connectionStatus}
                    onTestConnection={handleTestConnection}
                    isTesting={isTestingConnection}
                  />
                  <PromptManager
                    settings={settings}
                    onUpdate={updateSettings}
                  />
                  <div className="pt-4 border-t border-[#E7E0EC]">
                    <UrlManager
                      selectedUrls={settings.selectedUrls}
                      onUrlsChange={(urls) => updateSettings({ selectedUrls: urls })}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}

      {isScreenshotMode && (
        <ScreenshotCropper
          onCapture={(imageData, rect) => {
            setContextScreenshot({ imageData, rect })
            setIsScreenshotMode(false)
          }}
          onCancel={() => setIsScreenshotMode(false)}
        />
      )}
    </div>
  )
}
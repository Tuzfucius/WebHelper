import React, { useState, useEffect, useRef } from 'react'
import { useSettings, useMessages, useReadingStats, useApp, useHistory } from '../stores/AppContext'
import { ScreenshotCropper } from '../components/ScreenshotCropper'
import { ReadingDashboard } from './components/ReadingDashboard'
import { PromptManager } from './components/PromptManager'
import { APIConfiguration } from './components/APIConfiguration'
import { UrlManager } from './components/UrlManager'
import { onMessage, sendToActiveTab } from '../utils/messaging'
import { contextEngine } from '../utils/context'
import { useTranslation } from '../utils/i18n'
import type { EnhancedContextData, ScreenshotData, PromptTemplate, Message } from '../types'
import { skillManager } from '../core/skills'
import { AnimatePresence, motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useToast } from '../components/Toast'
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
  ChevronDown,
  Trash2,
  Edit2,
  RotateCcw
} from 'lucide-react'

interface SidePanelProps {
  initialContext: string
  onClose: () => void
}

type ViewMode = 'chat' | 'dashboard' | 'settings' | 'history'

export const SidePanel: React.FC<SidePanelProps> = ({ initialContext, onClose }) => {
  const { settings, updateSettings } = useSettings()
  const { messages, addMessage, updateMessage, deleteMessage } = useMessages()
  const { dispatch } = useApp()
  const { updateStats } = useReadingStats()
  const { history, addHistoryItem, clearHistory } = useHistory()
  const t = useTranslation(settings.language)
  const { showToast } = useToast()

  const [currentView, setCurrentView] = useState<ViewMode>('chat')
  const [userInput, setUserInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isScreenshotMode, setIsScreenshotMode] = useState(false)
  const [contextScreenshot, setContextScreenshot] = useState<ScreenshotData | undefined>(undefined)
  const [showPromptSelector, setShowPromptSelector] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'connected' | 'error'>('idle')
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Image Upload State
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [pageContent, setPageContent] = useState<string>('')

  // Track reading time
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        updateStats(1, 0)
      }
    }, 60000)

    const fetchContent = async () => {
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
        const activeTab = tabs[0]

        const data = await sendToActiveTab('GET_PAGE_CONTENT', undefined)
        if (data && data.content) {
          setPageContent(data.content)

          if (activeTab && activeTab.url && activeTab.title && !settings.incognitoMode) {
            addHistoryItem({
              url: activeTab.url,
              title: activeTab.title
            })
          }
        }
      } catch (e) { }
    }

    const tabUpdateListener = (tabId: number, changeInfo: any, tab: any) => {
      if (changeInfo.status === 'complete' && tab.active && tab.url && tab.title && !settings.incognitoMode) {
        addHistoryItem({
          url: tab.url,
          title: tab.title
        })
      }
    }
    chrome.tabs.onUpdated.addListener(tabUpdateListener)

    fetchContent()

    return () => {
      clearInterval(interval)
      chrome.tabs.onUpdated.removeListener(tabUpdateListener)
    }
  }, [settings.incognitoMode])

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

  const renderMessageContent = (content: string | any[]) => {
    if (typeof content === 'string') {
      return (
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content}
        </ReactMarkdown>
      )
    }

    if (Array.isArray(content)) {
      return content.map((part, index) => {
        if (part.type === 'text') {
          return (
            <div key={index}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {part.text}
              </ReactMarkdown>
            </div>
          )
        }
        if (part.type === 'image_url') {
          return (
            <img
              key={index}
              src={part.image_url.url}
              alt="Uploaded content"
              className="max-w-full rounded-lg my-2"
              style={{ maxHeight: '200px' }}
            />
          )
        }
        if (part.type === 'image') {
          return (
            <img
              key={index}
              src={`data:${part.source.media_type};base64,${part.source.data}`}
              alt="Uploaded content"
              className="max-w-full rounded-lg my-2"
              style={{ maxHeight: '200px' }}
            />
          )
        }
        return null
      })
    }
    return null
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark')
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
      document.documentElement.classList.remove('dark')
    }
  }, [settings.theme])

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

  const handleCopy = (content: string | any[]) => {
    const text = typeof content === 'string' ? content : JSON.stringify(content)
    navigator.clipboard.writeText(text).then(() => {
      // Optional: Add a toast notification here if available
    })
  }

  const handleRegenerate = async (msgId: string) => {
    // Find the message index
    const idx = messages.findIndex(m => m.id === msgId)
    if (idx === -1) return

    // If it's an assistant message, we typically want to remove it and rewrite
    // If it's a user message, we might want to re-trigger from there
    const msg = messages[idx]

    if (msg.role === 'assistant') {
      deleteMessage(msg.id)
      // Trigger send again using the previous user message
      const prevUserMsg = messages[idx - 1]
      if (prevUserMsg && prevUserMsg.role === 'user') {
        const content = typeof prevUserMsg.content === 'string' ? prevUserMsg.content : ''
        setUserInput(content)
        // We'll call sendMessage in a bit, but we need to handle the state properly
        // For simplicity in this UI, we just set the input and let user click send or we trigger it.
        // Actually, let's just trigger its logic.
        handleSendMessage(true, content)
      }
    }
  }

  const handleSendMessage = async (isRegenerate = false, overrideInput?: string) => {
    const textToSend = overrideInput ?? userInput
    if ((!textToSend.trim() && !uploadedImage && !contextScreenshot) || isTyping) return

    if (!settings.apiKey) {
      showToast('Please configure your API Key in the Settings tab first.', 'warning')
      setCurrentView('settings')
      return
    }

    if (!isRegenerate) {
      const userMessageContent = textToSend + (uploadedImage ? ' [Image Attached]' : '') + (contextScreenshot ? ' [Screenshot Attached]' : '')
      addMessage({
        role: 'user',
        content: userMessageContent
      })
      setUserInput('')
    }

    setUploadedImage(null)
    setContextScreenshot(undefined)
    setIsTyping(true)

    // ... rest of the send logic remains similar but uses textToSend

    // Log stats
    if (initialContext.length > 50) {
      try {
        chrome.storage.local.get(['lastArticleRead'], (res) => {
          const now = Date.now();
          const lastRead = Number(res.lastArticleRead || 0);
          if (!res.lastArticleRead || (now - lastRead > 300000)) {
            updateStats(0, 1);
            chrome.storage.local.set({ lastArticleRead: now });
          }
        });
      } catch (e) { }
    }

    let assistantMsgId: string | undefined = undefined

    try {
      const activePrompt = settings.prompts?.find(p => p.id === settings.activePromptId)
      let systemContent = activePrompt?.content || 'You are a helpful AI reading assistant.'

      // Context extraction
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
        if (tabs[0]?.id) {
          const content = await chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_PAGE_CONTENT' }).catch(() => null)
          if (content) {
            const pageCtx = {
              url: tabs[0].url || '',
              title: content.title,
              content: content.content, // Use full content
              timestamp: Date.now()
            }
            await contextEngine.addPage(pageCtx, settings.contextLength)

            // Add CURRENT PAGE context with structured tags
            systemContent += `\n\n[CURRENT_PAGE_CONTEXT]\nURL: ${pageCtx.url}\nTitle: ${pageCtx.title}\nFull Content:\n${pageCtx.content}\n[/CURRENT_PAGE_CONTEXT]`

            const memory = await contextEngine.getRelevantContext(pageCtx.url, settings.contextLength)
            if (memory) systemContent += `\n\n[RELEVANT_HISTORY_CONTEXT]\n${memory}\n[/RELEVANT_HISTORY_CONTEXT]`
          }
        }
      } catch (e) { }

      let fullContent = userInput
      if (initialContext) fullContent = `Selected: ${initialContext}\n\n${fullContent}`

      let apiUserContent: any = fullContent
      if (uploadedImage) {
        const isOpenAI = settings.provider === 'openai' || (settings.provider === 'custom' && settings.protocol === 'openai')
        if (isOpenAI) {
          apiUserContent = [
            { type: 'text', text: fullContent },
            { type: 'image_url', image_url: { url: uploadedImage } }
          ]
        } else {
          const matches = uploadedImage.match(/^data:(.+);base64,(.+)$/)
          if (matches) {
            apiUserContent = [
              { type: 'text', text: fullContent },
              { type: 'image', source: { type: 'base64', media_type: matches[1], data: matches[2] } }
            ]
          }
        }
      }

      const apiHistory = messages.map(m => ({ role: m.role, content: m.content }))
      const curAssistantMsg = addMessage({ role: 'assistant', content: '' })
      assistantMsgId = curAssistantMsg.id
      let accumulated = ''

      const isAnthropic = settings.provider === 'anthropic' || (settings.provider === 'custom' && settings.protocol === 'anthropic')
      const baseUrl = settings.provider === 'openai' ? 'https://api.openai.com/v1' :
        settings.provider === 'anthropic' ? 'https://api.anthropic.com/v1' :
          settings.baseUrl.replace(/\/+$/, '')
      const endpoint = isAnthropic ? '/messages' : '/chat/completions'

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(settings.customHeaders || {})
      }
      if (isAnthropic) {
        headers['x-api-key'] = settings.apiKey
        headers['anthropic-version'] = '2023-06-01'
      } else {
        headers['Authorization'] = `Bearer ${settings.apiKey}`
      }

      // Prepare tools
      const tools = skillManager.getSkillsDefinitions();

      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: settings.modelName,
          messages: isAnthropic ? [...apiHistory, { role: 'user', content: apiUserContent }] :
            [{ role: 'system', content: systemContent }, ...apiHistory, { role: 'user', content: apiUserContent }],
          system: isAnthropic ? systemContent : undefined,
          temperature: settings.temperature ?? 0.7,
          max_tokens: settings.maxTokens ?? 4096,
          stream: true,
          tools: tools.length > 0 ? tools.map(t => ({ type: 'function', function: t })) : undefined
        })
      })

      if (!response.ok) throw new Error(`API Error: ${response.statusText}`)
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(l => l.trim() !== '')

        for (const line of lines) {
          if (line.includes('[DONE]')) continue
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.replace('data: ', ''))
              let delta = ''
              if (!isAnthropic) {
                // Handle tool_calls if any (simplified for now)
                if (data.choices[0]?.delta?.tool_calls) {
                  const tc = data.choices[0].delta.tool_calls[0];
                  if (tc.function) {
                    // Logic to collect tool call arguments and execute
                    console.log('Tool call detected:', tc.function.name);
                  }
                }
                delta = data.choices[0]?.delta?.content || ''
              } else {
                delta = data.type === 'content_block_delta' ? data.delta?.text : ''
              }
              if (delta) {
                accumulated += delta
                updateMessage(curAssistantMsg.id, accumulated)
              }
            } catch (e) { }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errText = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      if (assistantMsgId) {
        updateMessage(assistantMsgId, errText)
      } else {
        addMessage({ role: 'assistant', content: errText })
      }
    } finally {
      setIsTyping(false)
    }
  }

  const handleToggleScreenshot = () => {
    if (isScreenshotMode) {
      setIsScreenshotMode(false)
    } else {
      const message = new CustomEvent('start-screenshot-mode', { detail: { start: true } })
      window.dispatchEvent(message)
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setUploadedImage(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handlePaste = (event: React.ClipboardEvent) => {
    const items = event.clipboardData.items
    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile()
        if (file) {
          const reader = new FileReader()
          reader.onloadend = () => setUploadedImage(reader.result as string)
          reader.readAsDataURL(file)
          event.preventDefault()
        }
      }
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    const isCtrlEnter = (event.ctrlKey || event.metaKey) && event.key === 'Enter'
    const isEnterOnly = event.key === 'Enter' && !event.ctrlKey && !event.metaKey && !event.shiftKey

    if (settings.shortcuts.sendMessage === 'Ctrl+Enter') {
      if (isCtrlEnter) {
        event.preventDefault()
        handleSendMessage()
      }
    } else if (settings.shortcuts.sendMessage === 'Enter') {
      if (isEnterOnly) {
        event.preventDefault()
        handleSendMessage()
      }
    }
  }

  return (
    <div className={`h-full flex flex-col font-sans transition-colors duration-300 ${settings.theme === 'dark' ? 'bg-[#141218]' : 'bg-[#FEF7FF]'}`}>
      {!isScreenshotMode && (
        <>
          <header className="flex-none px-4 py-3 bg-white/70 dark:bg-[#141218]/70 backdrop-blur-xl border-b border-[#E7E0EC] dark:border-[#49454F] sticky top-0 z-20 flex items-center justify-between">
            <div className="flex items-center gap-3 relative">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#D0BCFF] to-[#6750A4] flex items-center justify-center text-white shadow-sm">
                <Sparkles size={18} />
              </div>
              <div className="cursor-pointer group" onClick={() => setShowPromptSelector(!showPromptSelector)}>
                <h1 className="text-sm font-bold leading-tight flex items-center gap-1.5 text-[#1D1B20] dark:text-[#E6E1E5]">
                  {activePromptName}
                  <ChevronDown size={14} className={`transition-transform duration-300 ${showPromptSelector ? 'rotate-180' : ''} text-[#49454F] dark:text-[#CAC4D0]`} />
                </h1>
                <p className="text-[10px] text-[#49454F] dark:text-[#CAC4D0] font-bold tracking-wider uppercase opacity-70">
                  {settings.provider}
                </p>
              </div>

              <AnimatePresence>
                {showPromptSelector && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-[#2B2930] rounded-xl shadow-lg border border-[#E7E0EC] dark:border-[#49454F] overflow-hidden z-50"
                  >
                    {(settings.prompts || []).map(p => (
                      <button
                        key={p.id}
                        onClick={() => handlePromptSelect(p.id)}
                        className={`w-full text-left px-4 py-2 text-sm ${settings.activePromptId === p.id ? 'bg-[#EADDFF] dark:bg-[#4A4458]' : 'hover:bg-[#F3EDF7] dark:hover:bg-[#36343B]'}`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={toggleLanguage} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                <span className="text-xs font-bold border px-1 rounded">{settings.language.toUpperCase()}</span>
              </button>
              <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                {settings.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button onClick={() => { if (confirm(t.clearChat + '?')) { dispatch({ type: 'LOAD_MESSAGES', payload: [] }); chrome.storage.local.remove(['chatHistory']); } }} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800" title={t.clearChat}>
                <Trash2 size={18} />
              </button>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                <X size={18} />
              </button>
            </div>
          </header>

          <div className="flex p-1 mx-4 mt-2 bg-[#F3EDF7] dark:bg-[#2B2930] rounded-full overflow-x-auto no-scrollbar">
            {(['chat', 'dashboard', 'history', 'settings'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setCurrentView(mode)}
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 text-xs font-medium rounded-full whitespace-nowrap ${currentView === mode ? 'bg-white shadow-sm dark:bg-[#4A4458]' : 'text-[#49454F] dark:text-[#CAC4D0]'}`}
              >
                <span className="capitalize">{t[mode]}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-hidden relative">
            <AnimatePresence mode='wait'>
              {currentView === 'chat' && (
                <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col">
                  {/* (existing chat content) */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, idx) => (
                      <div key={msg.id} className={`flex gap-3 relative group ${msg.role === 'user' ? 'flex-row-reverse text-right' : 'flex-row'}`}>
                        <div className={`w-8 h-8 rounded-full flex-none flex items-center justify-center ${msg.role === 'user' ? 'bg-[#6750A4] text-white' : 'bg-[#EADDFF] dark:bg-[#4A4458]'}`}>
                          {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                        </div>
                        <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm shadow-sm relative transition-all duration-200 ${msg.role === 'user' ? 'bg-[#6750A4] text-white' : 'bg-white dark:bg-[#2B2930] dark:border-[#49454F] border border-[#E7E0EC]'}`}>
                          {editingMessageId === msg.id ? (
                            <div className="space-y-2">
                              <textarea
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-full bg-transparent border-none outline-none resize-none text-sm p-0 min-h-[60px] text-inherit"
                                autoFocus
                              />
                              <div className="flex justify-end gap-2 text-xs">
                                <button onClick={() => { updateMessage(msg.id, editValue); setEditingMessageId(null) }} className="px-3 py-1 bg-[#6750A4] text-white rounded-full hover:bg-[#5235a0] transition-colors">Save</button>
                                <button onClick={() => setEditingMessageId(null)} className="px-3 py-1 border border-current rounded-full hover:bg-black/5 transition-colors">Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="prose prose-sm dark:prose-invert max-w-none break-words leading-relaxed text-[#1D1B20] dark:text-[#E6E1E5]">
                                {renderMessageContent(msg.content)}
                              </div>
                              <div className={`absolute top-0 ${msg.role === 'user' ? 'left-0 -translate-x-full pr-2' : 'right-0 translate-x-full pl-2'} opacity-0 group-hover:opacity-100 flex flex-col gap-1 transition-all duration-200 z-10`}>
                                <div className="flex flex-col gap-1.5 p-1.5 rounded-xl bg-white/90 dark:bg-[#1C1B1F]/90 backdrop-blur-md shadow-lg border border-[#E7E0EC] dark:border-[#49454F]">
                                  <button onClick={() => handleCopy(msg.content)} title="Copy" className="p-1.5 hover:bg-[#F3EDF7] dark:hover:bg-[#4A4458] rounded-lg text-[#49454F] dark:text-[#CAC4D0] transition-colors"><Bot size={14} /></button>
                                  <button onClick={() => { setEditingMessageId(msg.id); setEditValue(typeof msg.content === 'string' ? msg.content : '') }} title="Edit" className="p-1.5 hover:bg-[#F3EDF7] dark:hover:bg-[#4A4458] rounded-lg text-[#49454F] dark:text-[#CAC4D0] transition-colors"><Edit2 size={14} /></button>
                                  {msg.role === 'assistant' && idx === messages.length - 1 && (
                                    <button onClick={() => handleRegenerate(msg.id)} title="Regenerate" className="p-1.5 hover:bg-[#F3EDF7] dark:hover:bg-[#4A4458] rounded-lg text-[#49454F] dark:text-[#CAC4D0] transition-colors"><RotateCcw size={14} /></button>
                                  )}
                                  <button onClick={() => { if (confirm('Delete?')) deleteMessage(msg.id) }} title="Delete" className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500 transition-colors"><Trash2 size={14} /></button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                    {isTyping && <div className="text-xs text-gray-500 animate-pulse">AI is thinking...</div>}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-4 bg-white border-t dark:bg-[#141218] dark:border-[#49454F]">
                    {uploadedImage && <div className="relative mb-2 w-fit"><img src={uploadedImage} className="h-16 rounded" /><button onClick={() => setUploadedImage(null)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><X size={10} /></button></div>}
                    <div className="relative flex gap-2">
                      <textarea
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onPaste={handlePaste}
                        onKeyDown={handleKeyDown}
                        placeholder={t.askAnything}
                        className="w-full pl-4 pr-12 py-3 bg-[#F3EDF7] dark:bg-[#2B2930] rounded-3xl text-sm focus:outline-none h-[52px] resize-none"
                      />
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                      <div className="absolute right-2 top-1.5 flex gap-1">
                        <button onClick={() => fileInputRef.current?.click()} className="p-2"><ImageIcon size={18} /></button>
                        <button onClick={handleSendMessage} className="p-2 bg-[#6750A4] text-white rounded-full"><Send size={18} /></button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentView === 'history' && (
                <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 overflow-y-auto p-4 flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold">{t.readingHistory}</h2>
                    <button
                      onClick={() => { if (confirm(t.delete + '?')) clearHistory() }}
                      className="text-xs text-red-500 hover:bg-red-50 p-1 px-2 rounded"
                    >
                      {t.clearChat}
                    </button>
                  </div>
                  <div className="space-y-3">
                    {history.length === 0 ? (
                      <div className="text-center py-10 text-gray-400 text-sm">No history yet</div>
                    ) : (
                      history.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => chrome.tabs.update({ url: item.url })}
                          className="p-3 bg-white dark:bg-[#2B2930] border border-[#E7E0EC] dark:border-[#49454F] rounded-xl hover:shadow-md transition-shadow cursor-pointer group"
                        >
                          <div className="font-medium text-sm mb-1 group-hover:text-[#6750A4] line-clamp-1">{item.title}</div>
                          <div className="text-[10px] text-gray-500 line-clamp-1 break-all">{item.url}</div>
                          <div className="text-[10px] text-gray-400 mt-2">{new Date(item.timestamp).toLocaleString()}</div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}

              {currentView === 'dashboard' && (
                <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 overflow-y-auto"><ReadingDashboard /></motion.div>
              )}

              {currentView === 'settings' && (
                <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 overflow-y-auto p-4 space-y-6">
                  <APIConfiguration settings={settings} onUpdate={updateSettings} connectionStatus={connectionStatus} onTestConnection={handleTestConnection} isTesting={isTestingConnection} />
                  <PromptManager settings={settings} onUpdate={updateSettings} />
                  <UrlManager selectedUrls={settings.selectedUrls} onUrlsChange={(urls) => updateSettings({ selectedUrls: urls })} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )
      }

      {
        isScreenshotMode && (
          <ScreenshotCropper
            onCapture={(imageData, rect) => { setContextScreenshot({ imageData, rect }); setIsScreenshotMode(false); }}
            onCancel={() => setIsScreenshotMode(false)}
          />
        )
      }
    </div >
  )
}
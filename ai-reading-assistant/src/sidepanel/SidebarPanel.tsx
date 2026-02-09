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
import { AnimatePresence, motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
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
  Trash2
} from 'lucide-react'

interface SidePanelProps {
  initialContext: string
  onClose: () => void
}

type ViewMode = 'chat' | 'dashboard' | 'settings' | 'history'

export const SidePanel: React.FC<SidePanelProps> = ({ initialContext, onClose }) => {
  const { settings, updateSettings } = useSettings()
  const { messages, addMessage, updateMessage } = useMessages()
  const { dispatch } = useApp()
  const { updateStats } = useReadingStats()
  const { history, addHistoryItem, clearHistory } = useHistory()
  const t = useTranslation(settings.language)

  const [currentView, setCurrentView] = useState<ViewMode>('chat')
  const [userInput, setUserInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isScreenshotMode, setIsScreenshotMode] = useState(false)
  const [contextScreenshot, setContextScreenshot] = useState<ScreenshotData | undefined>(undefined)
  const [showPromptSelector, setShowPromptSelector] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'connected' | 'error'>('idle')
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

          // Record history if activeTab exists and not incognito
          if (activeTab && activeTab.url && activeTab.title && !settings.incognitoMode) {
            addHistoryItem({
              url: activeTab.url,
              title: activeTab.title
            })
          }
        }
      } catch (e) {
        console.warn('Failed to fetch page content/record history:', e)
      }
    }
    fetchContent()

    return () => clearInterval(interval)
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

  const handleSendMessage = async () => {
    if ((!userInput.trim() && !uploadedImage && !contextScreenshot) || isTyping) return

    if (!settings.apiKey) {
      alert('Please configure your API Key in the Settings tab first.')
      setCurrentView('settings')
      return
    }

    const userMessageContent = userInput + (uploadedImage ? ' [Image Attached]' : '') + (contextScreenshot ? ' [Screenshot Attached]' : '')

    addMessage({
      role: 'user',
      content: userMessageContent
    })

    setUserInput('')
    setUploadedImage(null)
    setContextScreenshot(undefined)
    setIsTyping(true)

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

      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: settings.modelName,
          messages: isAnthropic ? [...apiHistory, { role: 'user', content: apiUserContent }] :
            [{ role: 'system', content: systemContent }, ...apiHistory, { role: 'user', content: apiUserContent }],
          system: isAnthropic ? systemContent : undefined,
          max_tokens: 1000,
          stream: true
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
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className={`h-full flex flex-col font-sans transition-colors duration-200 ${settings.theme === 'dark' ? 'bg-[#141218] text-[#E6E1E5]' : 'bg-[#FDFCFE] text-[#1D1B20]'}`}>
      {!isScreenshotMode && (
        <>
          <header className="flex-none px-4 py-3 bg-white/80 dark:bg-[#141218]/80 backdrop-blur-md border-b border-[#E7E0EC] dark:border-[#49454F] sticky top-0 z-10 flex items-center justify-between">
            <div className="flex items-center gap-2 relative">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#D0BCFF] to-[#EADDFF] flex items-center justify-center text-[#21005D]">
                <Sparkles size={18} />
              </div>
              <div className="cursor-pointer group" onClick={() => setShowPromptSelector(!showPromptSelector)}>
                <h1 className="text-sm font-semibold leading-tight flex items-center gap-1 dark:text-[#E6E1E5]">
                  {activePromptName}
                  <ChevronDown size={14} className={`transition-transform duration-200 ${showPromptSelector ? 'rotate-180' : ''}`} />
                </h1>
                <p className="text-[10px] text-[#49454F] dark:text-[#CAC4D0] font-medium leading-none opacity-80">
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
                    {messages.map((msg) => (
                      <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse text-right' : 'flex-row'}`}>
                        <div className={`w-8 h-8 rounded-full flex-none flex items-center justify-center ${msg.role === 'user' ? 'bg-[#6750A4] text-white' : 'bg-[#EADDFF] dark:bg-[#4A4458]'}`}>
                          {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                        </div>
                        <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm text-left ${msg.role === 'user' ? 'bg-[#6750A4] text-white' : 'bg-white dark:bg-[#2B2930] dark:border-[#49454F] border'}`}>
                          <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                            {renderMessageContent(msg.content)}
                          </div>
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
      )}

      {isScreenshotMode && (
        <ScreenshotCropper
          onCapture={(imageData, rect) => { setContextScreenshot({ imageData, rect }); setIsScreenshotMode(false); }}
          onCancel={() => setIsScreenshotMode(false)}
        />
      )}
    </div>
  )
}
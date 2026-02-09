// Context for managing global application state
import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { Settings, Message, ConnectionStatus, ReadingStats, HistoryItem, APIConfig } from '../types'

interface AppState {
  settings: Settings
  messages: Message[]
  connectionStatus: ConnectionStatus
  readingStats: ReadingStats[]
  history: HistoryItem[]
}

type AppAction =
  | { type: 'UPDATE_SETTINGS'; payload: Partial<Settings> }
  | { type: 'SET_CONNECTION_STATUS'; payload: ConnectionStatus }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'LOAD_SETTINGS'; payload: Settings }
  | { type: 'SAVE_SETTINGS' }
  | { type: 'UPDATE_READING_STATS'; payload: { minutes: number; articles: number } }
  | { type: 'LOAD_STATS'; payload: ReadingStats[] }
  | { type: 'LOAD_MESSAGES'; payload: Message[] }
  | { type: 'UPDATE_MESSAGE_CONTENT'; payload: { id: string; content: string } }
  | { type: 'LOAD_HISTORY'; payload: HistoryItem[] }
  | { type: 'ADD_HISTORY_ITEM'; payload: HistoryItem }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'DELETE_MESSAGE'; payload: string }

const defaultAPIConfigs: APIConfig[] = [
  {
    id: 'default-openai',
    name: 'OpenAI Default',
    provider: 'openai',
    protocol: 'openai',
    apiKey: '',
    baseUrl: '',
    modelName: 'gpt-3.5-turbo',
    customHeaders: {}
  }
]

const initialState: AppState = {
  settings: {
    provider: 'openai',
    protocol: 'openai',
    apiKey: '',
    baseUrl: '',
    modelName: 'gpt-3.5-turbo',
    customHeaders: {},
    selectedUrls: [],
    contextLength: 5,
    prompts: [
      { id: 'default', name: 'Default Assistant', content: 'You are a helpful AI reading assistant. Summarize and explain the content clearly.' },
      { id: 'academic', name: 'Academic Researcher', content: 'You are an academic research assistant. Analyze the text for methodology, key findings, and validity. Use formal language.' },
      { id: 'translator', name: 'Translator', content: 'You are a professional translator. Translate the selected text into fluent Chinese, preserving technical terminology.' }
    ],
    activePromptId: 'default',
    theme: 'light',
    language: 'zh',
    incognitoMode: false,
    apiConfigs: defaultAPIConfigs,
    activeConfigId: 'default-openai',
    temperature: 0.7,
    maxTokens: 4096
  },
  messages: [],
  connectionStatus: { state: 'idle' },
  readingStats: [],
  history: []
}

const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<AppAction>
} | null>(null)

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'UPDATE_SETTINGS':
      const newSettings = { ...state.settings, ...action.payload }

      // If activeConfigId changed, but payload didn't update the specific fields (provider, etc),
      // we might need to sync them if we are switching configs via ID.
      // However, usually we update the fields directly or update the configs list.
      return { ...state, settings: newSettings }

    case 'SET_CONNECTION_STATUS':
      return { ...state, connectionStatus: action.payload }

    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] }

    case 'CLEAR_MESSAGES':
      return { ...state, messages: [] }

    case 'LOAD_SETTINGS':
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload,
          prompts: action.payload.prompts || state.settings.prompts,
          activePromptId: action.payload.activePromptId || state.settings.activePromptId,
          theme: action.payload.theme || state.settings.theme,
          language: action.payload.language || state.settings.language,
          apiConfigs: action.payload.apiConfigs || state.settings.apiConfigs,
          activeConfigId: action.payload.activeConfigId || state.settings.activeConfigId
        }
      }

    case 'SAVE_SETTINGS':
      return state

    case 'UPDATE_READING_STATS':
      const today = new Date().toISOString().split('T')[0]
      const existingStatIndex = state.readingStats.findIndex(s => s.date === today)
      let newStats = [...state.readingStats]

      if (existingStatIndex >= 0) {
        newStats[existingStatIndex] = {
          ...newStats[existingStatIndex],
          minutes: newStats[existingStatIndex].minutes + action.payload.minutes,
          articles: newStats[existingStatIndex].articles + action.payload.articles
        }
      } else {
        newStats.push({
          date: today,
          minutes: action.payload.minutes,
          articles: action.payload.articles
        })
      }
      if (newStats.length > 30) {
        newStats = newStats.slice(newStats.length - 30)
      }
      return { ...state, readingStats: newStats }

    case 'LOAD_STATS':
      return { ...state, readingStats: action.payload }

    case 'LOAD_MESSAGES':
      return { ...state, messages: action.payload }

    case 'UPDATE_MESSAGE_CONTENT':
      return {
        ...state,
        messages: state.messages.map(m =>
          m.id === action.payload.id ? { ...m, content: action.payload.content } : m
        )
      }

    case 'LOAD_HISTORY':
      return { ...state, history: action.payload }

    case 'ADD_HISTORY_ITEM':
      // Prevent duplicates
      if (state.history.some(h => h.url === action.payload.url)) {
        return state
      }
      return { ...state, history: [action.payload, ...state.history].slice(0, 100) }

    case 'CLEAR_HISTORY':
      return { ...state, history: [] }

    case 'DELETE_MESSAGE':
      return { ...state, messages: state.messages.filter(m => m.id !== action.payload) }

    default:
      return state
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // Load everything from chrome.storage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await (chrome as any).storage.local.get(['settings', 'readingStats', 'chatHistory', 'readingHistory'])

        // Settings migration and loading
        if (result.settings) {
          const loadedSettings = result.settings as Settings
          // Migration: if apiConfigs doesn't exist but we have single config data
          if (!loadedSettings.apiConfigs && (loadedSettings as any).apiKey) {
            loadedSettings.apiConfigs = [{
              id: 'initial-config',
              name: 'Imported Config',
              provider: loadedSettings.provider,
              protocol: loadedSettings.protocol,
              apiKey: loadedSettings.apiKey,
              baseUrl: loadedSettings.baseUrl,
              modelName: loadedSettings.modelName,
              customHeaders: loadedSettings.customHeaders || {}
            }]
            loadedSettings.activeConfigId = 'initial-config'
          }
          dispatch({ type: 'LOAD_SETTINGS', payload: loadedSettings })
        }

        if (result.readingStats) {
          dispatch({ type: 'LOAD_STATS', payload: result.readingStats })
        }
        if (result.chatHistory) {
          dispatch({ type: 'LOAD_MESSAGES', payload: result.chatHistory })
        }
        if (result.readingHistory) {
          dispatch({ type: 'LOAD_HISTORY', payload: result.readingHistory })
        }
      } catch (error) {
        console.error('Failed to load data:', error)
      }
    }

    loadData()
  }, [])

  // Persistent saving effects
  useEffect(() => {
    chrome.storage.local.set({ settings: state.settings })
  }, [state.settings])

  useEffect(() => {
    chrome.storage.local.set({ readingStats: state.readingStats })
  }, [state.readingStats])

  useEffect(() => {
    chrome.storage.local.set({ chatHistory: state.messages })
  }, [state.messages])

  useEffect(() => {
    chrome.storage.local.set({ readingHistory: state.history })
  }, [state.history])

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider')
  }
  return context
}

export function useSettings() {
  const { state, dispatch } = useAppContext()

  const updateSettings = (newSettings: Partial<Settings>) => {
    // If we're updating activeConfigId, we should also sync the top-level provider/apiKey etc
    // for backward compatibility or simple access in components.
    if (newSettings.activeConfigId && state.settings.apiConfigs) {
      const config = state.settings.apiConfigs.find(c => c.id === newSettings.activeConfigId)
      if (config) {
        newSettings.provider = config.provider
        newSettings.protocol = config.protocol
        newSettings.apiKey = config.apiKey
        newSettings.baseUrl = config.baseUrl
        newSettings.modelName = config.modelName
        newSettings.customHeaders = config.customHeaders
        newSettings.temperature = config.temperature ?? 0.7
        newSettings.maxTokens = config.maxTokens ?? 4096
      }
    }
    dispatch({ type: 'UPDATE_SETTINGS', payload: newSettings })
  }

  const addAPIConfig = (config: Omit<APIConfig, 'id'>) => {
    const newConfig: APIConfig = { ...config, id: Date.now().toString() }
    const newConfigs = [...(state.settings.apiConfigs || []), newConfig]
    updateSettings({ apiConfigs: newConfigs })
    return newConfig
  }

  const deleteAPIConfig = (id: string) => {
    const newConfigs = state.settings.apiConfigs.filter(c => c.id !== id)
    updateSettings({ apiConfigs: newConfigs })
    // Fallback if active deleted
    if (state.settings.activeConfigId === id && newConfigs.length > 0) {
      updateSettings({ activeConfigId: newConfigs[0].id })
    }
  }

  return {
    settings: state.settings,
    updateSettings,
    addAPIConfig,
    deleteAPIConfig
  }
}

export function useConnection() {
  const { state, dispatch } = useAppContext()

  const setConnectionStatus = (status: ConnectionStatus) => {
    dispatch({ type: 'SET_CONNECTION_STATUS', payload: status })
  }

  return {
    connectionStatus: state.connectionStatus,
    setConnectionStatus
  }
}

export function useMessages() {
  const { state, dispatch } = useAppContext()

  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>): Message => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    }
    dispatch({ type: 'ADD_MESSAGE', payload: newMessage })
    return newMessage
  }

  const clearMessages = () => {
    dispatch({ type: 'CLEAR_MESSAGES' })
  }

  const deleteMessage = (id: string) => {
    dispatch({ type: 'DELETE_MESSAGE', payload: id })
  }

  const updateMessage = (id: string, content: string) => {
    dispatch({ type: 'UPDATE_MESSAGE_CONTENT', payload: { id, content } })
  }

  return {
    messages: state.messages,
    addMessage,
    clearMessages,
    deleteMessage,
    updateMessage
  }
}

export function useReadingStats() {
  const { state, dispatch } = useAppContext()

  const updateStats = (minutes: number, articles: number) => {
    dispatch({ type: 'UPDATE_READING_STATS', payload: { minutes, articles } })
  }

  return {
    readingStats: state.readingStats || [],
    updateStats
  }
}

export function useHistory() {
  const { state, dispatch } = useAppContext()

  const addHistoryItem = (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    if (state.settings.incognitoMode) return
    const newItem: HistoryItem = {
      ...item,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    }
    dispatch({ type: 'ADD_HISTORY_ITEM', payload: newItem })
  }

  const clearHistory = () => {
    dispatch({ type: 'CLEAR_HISTORY' })
  }

  return {
    history: state.history || [],
    addHistoryItem,
    clearHistory
  }
}

export const useApp = useAppContext

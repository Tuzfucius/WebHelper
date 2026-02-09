// Context for managing global application state
import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { Settings, Message, ConnectionStatus, ReadingStats } from '../types'

interface AppState {
  settings: Settings
  messages: Message[]
  connectionStatus: ConnectionStatus
  readingStats: ReadingStats[]
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
    language: 'zh'
  },
  messages: [],
  connectionStatus: { state: 'idle' },
  readingStats: []
}

const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<AppAction>
} | null>(null)

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'UPDATE_SETTINGS':
      const newSettings = { ...state.settings, ...action.payload }
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
          language: action.payload.language || state.settings.language
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
      // Keep only last 30 days
      if (newStats.length > 30) {
        newStats = newStats.slice(newStats.length - 30)
      }
      return { ...state, readingStats: newStats }

    case 'LOAD_STATS':
      return { ...state, readingStats: action.payload }

    default:
      return state
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // Load settings and stats from chrome.storage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await (chrome as any).storage.local.get(['settings', 'readingStats'])
        if (result.settings) {
          dispatch({ type: 'LOAD_SETTINGS', payload: result.settings })
        }
        if (result.readingStats) {
          dispatch({ type: 'LOAD_STATS', payload: result.readingStats })
        }
      } catch (error) {
        console.error('Failed to load data:', error)
      }
    }

    loadData()
  }, [])

  // Save settings
  useEffect(() => {
    const saveSettings = async () => {
      try {
        await (chrome as any).storage.local.set({ settings: state.settings })
      } catch (error) {
        console.error('Failed to save settings:', error)
      }
    }
    saveSettings()
  }, [state.settings])

  // Save stats
  useEffect(() => {
    const saveStats = async () => {
      try {
        await (chrome as any).storage.local.set({ readingStats: state.readingStats })
      } catch (error) {
        console.error('Failed to save stats:', error)
      }
    }
    saveStats()
  }, [state.readingStats])

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
    dispatch({ type: 'UPDATE_SETTINGS', payload: newSettings })
  }

  return {
    settings: state.settings,
    updateSettings
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

  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date().toISOString() as string
    }
    dispatch({ type: 'ADD_MESSAGE', payload: newMessage })
  }

  const clearMessages = () => {
    dispatch({ type: 'CLEAR_MESSAGES' })
  }

  return {
    messages: state.messages,
    addMessage,
    clearMessages
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
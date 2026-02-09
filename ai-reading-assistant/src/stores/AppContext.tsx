// Context for managing global application state
import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { Settings, Message, ConnectionStatus } from '../types'

interface AppState {
  settings: Settings
  messages: Message[]
  connectionStatus: ConnectionStatus
}

type AppAction =
  | { type: 'UPDATE_SETTINGS'; payload: Partial<Settings> }
  | { type: 'SET_CONNECTION_STATUS'; payload: ConnectionStatus }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'LOAD_SETTINGS'; payload: Settings }
  | { type: 'SAVE_SETTINGS' }

const initialState: AppState = {
  settings: {
    provider: 'openai',
    apiKey: '',
    baseUrl: '',
    selectedUrls: []
  },
  messages: [],
  connectionStatus: { state: 'idle' }
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
      return { ...state, settings: action.payload }
      
    case 'SAVE_SETTINGS':
      return state
      
    default:
      return state
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)
  
  // Load settings from chrome.storage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const result = await (chrome as any).storage.local.get(['settings'])
        if (result.settings) {
          dispatch({ type: 'LOAD_SETTINGS', payload: result.settings })
        }
      } catch (error) {
        console.error('Failed to load settings:', error)
      }
    }
    
    loadSettings()
  }, [])
  
  // Save settings to chrome.storage when they change
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
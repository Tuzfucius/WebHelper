// Type definitions for the application
export interface Settings {
  provider: 'openai' | 'anthropic' | 'custom'
  apiKey: string
  baseUrl: string
  selectedUrls: string[]
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface APIResponse {
  choices: Array<{
    message: {
      role: string
      content: string
    }
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface ConnectionStatus {
  state: 'idle' | 'testing' | 'connected' | 'error'
  error?: string
}

export interface ContextData {
  url: string
  selectedText?: string
  screenshot?: string
  query: string
}

export interface ScreenshotData {
  imageData: string
  rect: {
    x: number
    y: number
    width: number
    height: number
  }
}

export interface EnhancedContextData {
  url: string
  selectedText?: string
  screenshot?: ScreenshotData
  query: string
}
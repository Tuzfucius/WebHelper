import { useState } from 'react'
import { ConnectionStatus } from '../types'

export interface TestConnectionResult {
  success: boolean
  error?: string
}

export const useConnectionTester = () => {
  const [isTesting, setIsTesting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ state: 'idle' })

  const testOpenAIConnection = async (apiKey: string): Promise<TestConnectionResult> => {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        return { success: true }
      } else {
        const errorData = await response.json()
        return {
          success: false,
          error: errorData.error?.message || `HTTP ${response.status}`
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      }
    }
  }

  const testAnthropicConnection = async (apiKey: string): Promise<TestConnectionResult> => {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hello' }]
        })
      })

      if (response.ok || response.status === 400) {
        // 400 is expected for invalid messages but valid API key
        return { success: true }
      } else {
        const errorData = await response.json()
        return {
          success: false,
          error: errorData.error?.message || `HTTP ${response.status}`
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      }
    }
  }

  const testCustomConnection = async (baseUrl: string, apiKey: string): Promise<TestConnectionResult> => {
    try {
      // Normalize URL
      const normalizedUrl = baseUrl.replace(/\/$/, '') + '/v1/models'
      
      const response = await fetch(normalizedUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        return { success: true }
      } else {
        const errorData = await response.json()
        return {
          success: false,
          error: errorData.error?.message || `HTTP ${response.status}`
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      }
    }
  }

  const testConnection = async (
    provider: 'openai' | 'anthropic' | 'custom',
    apiKey: string,
    baseUrl?: string
  ): Promise<TestConnectionResult> => {
    setIsTesting(true)
    setConnectionStatus({ state: 'testing' })

    try {
      let result: TestConnectionResult

      switch (provider) {
        case 'openai':
          result = await testOpenAIConnection(apiKey)
          break
        case 'anthropic':
          result = await testAnthropicConnection(apiKey)
          break
        case 'custom':
          if (!baseUrl) {
            result = { success: false, error: 'Base URL is required for custom provider' }
          } else {
            result = await testCustomConnection(baseUrl, apiKey)
          }
          break
        default:
          result = { success: false, error: 'Unknown provider' }
      }

      if (result.success) {
        setConnectionStatus({ state: 'connected' })
      } else {
        setConnectionStatus({ 
          state: 'error', 
          error: result.error 
        })
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setConnectionStatus({ 
        state: 'error', 
        error: errorMessage 
      })
      return { success: false, error: errorMessage }
    } finally {
      setIsTesting(false)
    }
  }

  return {
    isTesting,
    connectionStatus,
    testConnection
  }
}
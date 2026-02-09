import { useState } from 'react'
import { ConnectionStatus, Settings } from '../types'

export interface TestConnectionResult {
  success: boolean
  error?: string
}

export const useConnectionTester = () => {
  const [isTesting, setIsTesting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ state: 'idle' })

  const testOpenAIProtocol = async (apiKey: string, baseUrl: string, model: string): Promise<TestConnectionResult> => {
    try {
      // Ensure baseUrl ends with /v1/models or just /v1 depending on usage
      // Standard OpenAI SDK usage usually takes base url. 
      // For raw fetch to list models: GET {baseUrl}/models

      // If user inputs "https://api.openai.com/v1", we append "/models"
      // If user inputs "https://my-ollama.com/v1", we append "/models"

      const url = `${baseUrl.replace(/\/+$/, '')}/models`

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        return { success: true }
      } else {
        try {
          const errorData = await response.json()
          return {
            success: false,
            error: errorData.error?.message || `HTTP ${response.status}`
          }
        } catch {
          return {
            success: false,
            error: `HTTP ${response.status}`
          }
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      }
    }
  }

  const testAnthropicProtocol = async (apiKey: string, baseUrl: string, model: string): Promise<TestConnectionResult> => {
    try {
      const url = `${baseUrl.replace(/\/+$/, '')}/messages`

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: model || 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hello' }]
        })
      })

      if (response.ok) {
        return { success: true }
      } else { // Handle 400s which might mean auth is good but request bad
        if (response.status === 4000) { // unlikely 4000, probably 400
          // if 400, it might be invalid model. If 401, invalid key.
          // We can read body.
        }
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
    settings: Pick<Settings, 'provider' | 'protocol' | 'apiKey' | 'baseUrl' | 'modelName'>
  ): Promise<TestConnectionResult> => {
    setIsTesting(true)
    setConnectionStatus({ state: 'testing' })

    try {
      let result: TestConnectionResult

      // Determine effective protocol and base URL
      let protocol = settings.protocol
      let baseUrl = settings.baseUrl
      let apiKey = settings.apiKey

      if (settings.provider === 'openai') {
        protocol = 'openai'
        baseUrl = 'https://api.openai.com/v1'
      } else if (settings.provider === 'anthropic') {
        protocol = 'anthropic'
        baseUrl = 'https://api.anthropic.com/v1'
      }

      if (!apiKey && settings.provider !== 'custom') { // Custom might not need key (e.g. local ollama)
        // But usually we check key. For local LLM, key might be 'sk-dummy'
      }

      if (protocol === 'openai') {
        result = await testOpenAIProtocol(apiKey, baseUrl, settings.modelName)
      } else {
        result = await testAnthropicProtocol(apiKey, baseUrl, settings.modelName)
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
import React, { useEffect } from 'react'
import { ProviderSelector } from './components/ProviderSelector'
import { ApiKeyInput } from './components/ApiKeyInput'
import { UrlManager } from './components/UrlManager'
import { useSettings, useConnection } from '../stores/AppContext'
import { useConnectionTester } from '../hooks/useConnectionTester'

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings } = useSettings()
  const { connectionStatus, setConnectionStatus } = useConnection()
  const { isTesting, testConnection } = useConnectionTester()

  const handleProviderChange = (provider: 'openai' | 'anthropic' | 'custom') => {
    updateSettings({ provider })
    setConnectionStatus({ state: 'idle' }) // Reset connection status
  }

  const handleApiKeyChange = (apiKey: string) => {
    updateSettings({ apiKey })
    setConnectionStatus({ state: 'idle' }) // Reset connection status
  }

  const handleBaseUrlChange = (baseUrl: string) => {
    updateSettings({ baseUrl })
  }

  const handleUrlChange = (selectedUrls: string[]) => {
    updateSettings({ selectedUrls })
  }

  const handleTestConnection = async () => {
    if (!settings.apiKey.trim()) {
      setConnectionStatus({ 
        state: 'error', 
        error: 'Please enter an API key first' 
      })
      return
    }

    const result = await testConnection(
      settings.provider,
      settings.apiKey,
      settings.baseUrl
    )

    if (!result.success && result.error) {
      setConnectionStatus({ 
        state: 'error', 
        error: result.error 
      })
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#79747E]/20">
        <h2 className="text-lg font-semibold text-[#1D1B20]">Settings</h2>
        <div className="flex items-center space-x-2 text-xs text-[#49454F]">
          <span>Keys are stored locally on your device</span>
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
      
      {/* Privacy Notice */}
      <div className="mx-4 mt-4 p-3 bg-[#EADDFF] rounded-lg border border-[#6750A4]/20">
        <div className="flex items-start space-x-2">
          <svg className="w-5 h-5 text-[#6750A4] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="text-sm">
            <p className="font-medium text-[#6750A4] mb-1">Privacy Notice</p>
            <p className="text-[#49454F]">
              Your API keys are stored <strong>locally</strong> on your device and never sent to external servers. 
              We cannot access your keys or use them on your behalf.
            </p>
          </div>
        </div>
      </div>
      
      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="space-y-6">
          {/* Provider Selection */}
          <ProviderSelector
            selectedProvider={settings.provider}
            onProviderChange={handleProviderChange}
          />
          
          {/* API Key Input */}
          <ApiKeyInput
            value={settings.apiKey}
            onChange={handleApiKeyChange}
            provider={settings.provider}
            onTestConnection={handleTestConnection}
            isTesting={isTesting}
            connectionStatus={connectionStatus.state}
            error={connectionStatus.state === 'error' ? connectionStatus.error : undefined}
          />
          
          {/* Base URL Input (for custom provider) */}
          {settings.provider === 'custom' && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-[#1D1B20]">
                Base URL
              </label>
              <input
                type="url"
                value={settings.baseUrl}
                onChange={(e) => handleBaseUrlChange(e.target.value)}
                placeholder="https://your-api-endpoint.com"
                className="w-full px-4 py-3 border border-[#79747E]/30 rounded-lg 
                           bg-white text-[#1D1B20] placeholder-[#79747E]/50
                           focus:outline-none focus:ring-2 focus:ring-[#6750A4]"
              />
              <p className="text-xs text-[#49454F]">
                Enter the base URL for your custom API endpoint
              </p>
            </div>
          )}
          
          {/* URL Manager */}
          <UrlManager
            selectedUrls={settings.selectedUrls}
            onUrlsChange={handleUrlChange}
          />
        </div>
      </div>
      
      {/* Status Footer */}
      <div className="p-4 border-t border-[#79747E]/20">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus.state === 'connected' ? 'bg-green-500' :
              connectionStatus.state === 'error' ? 'bg-red-500' :
              connectionStatus.state === 'testing' ? 'bg-yellow-500 animate-pulse' :
              'bg-gray-400'
            }`}></div>
            <span className={
              connectionStatus.state === 'connected' ? 'text-green-600' :
              connectionStatus.state === 'error' ? 'text-red-600' :
              'text-[#49454F]'
            }>
              {connectionStatus.state === 'connected' && '✓ Connected to AI service'}
              {connectionStatus.state === 'error' && `✗ ${connectionStatus.error}`}
              {connectionStatus.state === 'testing' && 'Testing connection...'}
              {connectionStatus.state === 'idle' && 'Ready to configure'}
            </span>
          </div>
          <div className="text-xs text-[#79747E]">
            {connectionStatus.state === 'connected' && 'API key verified'}
          </div>
        </div>
      </div>
    </div>
  )
}
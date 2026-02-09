import React from 'react'

interface ApiKeyInputProps {
  value: string
  onChange: (value: string) => void
  provider: 'openai' | 'anthropic' | 'custom'
  onTestConnection: () => void
  isTesting: boolean
  connectionStatus: 'idle' | 'testing' | 'connected' | 'error'
  error?: string
}

export const ApiKeyInput: React.FC<ApiKeyInputProps> = ({
  value,
  onChange,
  provider,
  onTestConnection,
  isTesting,
  connectionStatus,
  error
}) => {
  const placeholder = provider === 'openai' 
    ? 'sk-...' 
    : provider === 'anthropic' 
    ? 'sk-ant-api03-...' 
    : ''

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-[#1D1B20]">
          API Key
        </label>
        {connectionStatus === 'connected' && (
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-600">Connected</span>
          </div>
        )}
      </div>
      
      <div className="relative">
        <input
          type="password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full px-4 py-3 border rounded-lg transition-all duration-200
                     bg-white text-[#1D1B20] placeholder-[#79747E]/50
                     focus:outline-none focus:ring-2 focus:ring-[#6750A4]
                     ${error ? 'border-red-500' : 'border-[#79747E]/30'}
                     ${connectionStatus === 'connected' ? 'border-green-500' : ''}`}
        />
        
        <button
          onClick={onTestConnection}
          disabled={isTesting || !value.trim()}
          className={`absolute right-2 top-1/2 transform -translate-y-1/2
                     px-3 py-1 rounded-full text-sm font-medium transition-all
                     ${isTesting 
                       ? 'bg-[#6750A4]/80 text-white' 
                       : value.trim() 
                         ? 'bg-[#6750A4] text-white hover:bg-[#5235a0]' 
                         : 'bg-[#79747E]/30 text-[#49454F] cursor-not-allowed'
                     }`}
        >
          {isTesting ? (
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span className="hidden sm:inline">Testing...</span>
            </div>
          ) : connectionStatus === 'connected' ? (
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="hidden sm:inline">Connected</span>
            </div>
          ) : (
            'Test'
          )}
        </button>
      </div>
      
      {error && (
        <div className="flex items-center space-x-1 text-red-600 text-sm">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}
      
      {provider === 'openai' && (
        <div className="text-xs text-[#49454F]">
          Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-[#6750A4] hover:underline">OpenAI Dashboard</a>
        </div>
      )}
      
      {provider === 'anthropic' && (
        <div className="text-xs text-[#49454F]">
          Get your API key from <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="text-[#6750A4] hover:underline">Anthropic Console</a>
        </div>
      )}
    </div>
  )
}
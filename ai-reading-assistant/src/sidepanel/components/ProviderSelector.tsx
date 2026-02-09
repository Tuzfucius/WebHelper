import React from 'react'

interface ProviderSelectorProps {
  selectedProvider: 'openai' | 'anthropic' | 'custom'
  onProviderChange: (provider: 'openai' | 'anthropic' | 'custom') => void
}

export const ProviderSelector: React.FC<ProviderSelectorProps> = ({
  selectedProvider,
  onProviderChange
}) => {
  const providers = [
    { value: 'openai' as const, name: 'OpenAI', icon: '🧠' },
    { value: 'anthropic' as const, name: 'Anthropic', icon: '🤖' },
    { value: 'custom' as const, name: 'Custom', icon: '⚙️' }
  ]

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-[#1D1B20]">AI Provider</label>
      <div className="grid grid-cols-3 gap-3">
        {providers.map((provider) => (
          <button
            key={provider.value}
            onClick={() => onProviderChange(provider.value)}
            className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all
              ${selectedProvider === provider.value
                ? 'border-[#6750A4] bg-[#EADDFF] text-[#6750A4]'
                : 'border-[#79747E]/30 bg-white text-[#49454F] hover:border-[#6750A4]/50'
              }`}
          >
            <span className="text-2xl mb-2">{provider.icon}</span>
            <span className="text-sm font-medium">{provider.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
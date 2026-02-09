import React from 'react'
import { Settings } from '../../types'
import { useTranslation } from '../../utils/i18n'

interface APIConfigurationProps {
    settings: Settings
    onUpdate: (updates: Partial<Settings>) => void
    connectionStatus: string
    onTestConnection: () => void
    isTesting: boolean
}

export const APIConfiguration: React.FC<APIConfigurationProps> = ({
    settings,
    onUpdate,
    connectionStatus,
    onTestConnection,
    isTesting
}) => {
    const t = useTranslation(settings.language)

    const handleProviderChange = (provider: Settings['provider']) => {
        const updates: Partial<Settings> = { provider }

        // Set defaults based on provider
        if (provider === 'openai') {
            updates.protocol = 'openai'
            updates.baseUrl = 'https://api.openai.com/v1'
            updates.modelName = 'gpt-3.5-turbo'
        } else if (provider === 'anthropic') {
            updates.protocol = 'anthropic'
            updates.baseUrl = 'https://api.anthropic.com/v1'
            updates.modelName = 'claude-3-haiku-20240307'
        } else {
            // Custom - keep existing or default to openai-compatible
            if (!settings.protocol) updates.protocol = 'openai'
        }

        onUpdate(updates)
    }

    return (
        <div className="space-y-6">
            {/* Provider Selector */}
            <div className="space-y-3">
                <label className="text-sm font-medium text-[#1D1B20] dark:text-[#E6E1E5]">{t.provider}</label>
                <div className="grid grid-cols-3 gap-3">
                    {(['openai', 'anthropic', 'custom'] as const).map(p => (
                        <button
                            key={p}
                            onClick={() => handleProviderChange(p)}
                            className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all
                ${settings.provider === p
                                    ? 'border-[#6750A4] bg-[#EADDFF] text-[#6750A4] dark:bg-[#4F378B] dark:text-[#EADDFF] dark:border-[#D0BCFF]'
                                    : 'border-[#79747E]/20 bg-white text-[#49454F] hover:bg-[#F3EDF7] dark:bg-[#2B2930] dark:text-[#CAC4D0] dark:border-[#49454F] dark:hover:bg-[#36343B]'
                                }`}
                        >
                            <span className="capitalize text-sm font-medium">{p}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Custom Protocol Selector */}
            {settings.provider === 'custom' && (
                <div className="space-y-3">
                    <label className="text-sm font-medium text-[#1D1B20] dark:text-[#E6E1E5]">{t.protocol}</label>
                    <div className="flex space-x-3">
                        {(['openai', 'anthropic'] as const).map(p => (
                            <label key={p} className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="radio"
                                    checked={settings.protocol === p}
                                    onChange={() => onUpdate({ protocol: p })}
                                    className="text-[#6750A4] focus:ring-[#6750A4] dark:bg-[#49454F] dark:border-[#79747E]"
                                />
                                <span className="text-sm capitalize dark:text-[#E6E1E5]">{p} API</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {/* Base URL & Model & Key */}
            <div className="space-y-4">
                {/* Base URL (editable for custom) */}
                {settings.provider === 'custom' && (
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-[#49454F] dark:text-[#CAC4D0]">{t.baseUrl}</label>
                        <input
                            type="text"
                            value={settings.baseUrl}
                            onChange={(e) => onUpdate({ baseUrl: e.target.value })}
                            placeholder="https://api.example.com/v1"
                            className="w-full px-3 py-2 text-sm border border-[#79747E]/30 rounded-lg focus:ring-2 focus:ring-[#6750A4] outline-none dark:bg-[#141218] dark:border-[#49454F] dark:text-[#E6E1E5] dark:placeholder-[#79747E]"
                        />
                    </div>
                )}

                {/* Model Name */}
                <div className="space-y-1">
                    <label className="text-xs font-medium text-[#49454F] dark:text-[#CAC4D0]">{t.modelName}</label>
                    <input
                        type="text"
                        value={settings.modelName}
                        onChange={(e) => onUpdate({ modelName: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-[#79747E]/30 rounded-lg focus:ring-2 focus:ring-[#6750A4] outline-none dark:bg-[#141218] dark:border-[#49454F] dark:text-[#E6E1E5]"
                    />
                </div>

                {/* API Key */}
                <div className="space-y-1">
                    <label className="text-xs font-medium text-[#49454F] dark:text-[#CAC4D0]">{t.apiKey}</label>
                    <div className="relative">
                        <input
                            type="password"
                            value={settings.apiKey}
                            onChange={(e) => onUpdate({ apiKey: e.target.value })}
                            placeholder="sk-..."
                            className="w-full px-3 py-2 text-sm border border-[#79747E]/30 rounded-lg focus:ring-2 focus:ring-[#6750A4] outline-none pr-20 dark:bg-[#141218] dark:border-[#49454F] dark:text-[#E6E1E5] dark:placeholder-[#79747E]"
                        />
                        <button
                            onClick={onTestConnection}
                            disabled={isTesting || !settings.apiKey}
                            className="absolute right-1 top-1 bottom-1 px-3 bg-[#6750A4] text-white text-xs rounded-md disabled:opacity-50 dark:bg-[#D0BCFF] dark:text-[#381E72]"
                        >
                            {isTesting ? t.testing : t.test}
                        </button>
                    </div>
                    {connectionStatus === 'connected' && <p className="text-xs text-green-600 dark:text-green-400 mt-1">{t.connected}</p>}
                    {connectionStatus === 'error' && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{t.connectionFailed}</p>}
                </div>

                {/* Context Length Slider */}
                <div className="space-y-1 pt-2">
                    <div className="flex justify-between">
                        <label className="text-xs font-medium text-[#49454F] dark:text-[#CAC4D0]">{t.contextMemory}</label>
                        <span className="text-xs text-[#6750A4] font-bold dark:text-[#D0BCFF]">{settings.contextLength}</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="10"
                        step="1"
                        value={settings.contextLength}
                        onChange={(e) => onUpdate({ contextLength: parseInt(e.target.value) })}
                        className="w-full accent-[#6750A4] dark:accent-[#D0BCFF]"
                    />
                    <p className="text-[10px] text-[#79747E] dark:text-[#938F99]">
                        {t.contextHint.replace('{n}', settings.contextLength.toString())}
                    </p>
                </div>

            </div>
        </div>
    )
}

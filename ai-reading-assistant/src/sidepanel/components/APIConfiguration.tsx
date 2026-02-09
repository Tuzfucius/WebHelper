import React, { useState } from 'react'
import { Settings, APIConfig } from '../../types'
import { useTranslation } from '../../utils/i18n'
import { Plus, Trash2, Edit2, Check, Shield, ShieldOff, Save, X } from 'lucide-react'

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
    const [isAdding, setIsAdding] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [newConfig, setNewConfig] = useState<Omit<APIConfig, 'id'>>({
        name: '',
        provider: 'openai',
        protocol: 'openai',
        apiKey: '',
        baseUrl: 'https://api.openai.com/v1',
        modelName: 'gpt-3.5-turbo',
        customHeaders: {}
    })

    const handleSaveConfig = () => {
        const id = editingId || Date.now().toString()
        const configToSave: APIConfig = { ...newConfig, id }

        let updatedConfigs = [...(settings.apiConfigs || [])]
        if (editingId) {
            updatedConfigs = updatedConfigs.map(c => c.id === editingId ? configToSave : c)
        } else {
            updatedConfigs.push(configToSave)
        }

        onUpdate({
            apiConfigs: updatedConfigs,
            activeConfigId: id // Automatically activate new/saved config
        })
        setIsAdding(false)
        setEditingId(null)
    }

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (confirm(t.deletePromptConfirm)) {
            const updated = settings.apiConfigs.filter(c => c.id !== id)
            const updates: Partial<Settings> = { apiConfigs: updated }
            if (settings.activeConfigId === id && updated.length > 0) {
                updates.activeConfigId = updated[0].id
            }
            onUpdate(updates)
        }
    }

    const startEdit = (config: APIConfig, e: React.MouseEvent) => {
        e.stopPropagation()
        setNewConfig(config)
        setEditingId(config.id)
        setIsAdding(true)
    }

    const handleActivate = (id: string) => {
        onUpdate({ activeConfigId: id })
    }

    return (
        <div className="space-y-6">
            {/* Incognito Mode Toggle */}
            <div className="p-4 bg-[#F3EDF7] dark:bg-[#2B2930] rounded-2xl flex items-center justify-between border border-[#E7E0EC] dark:border-[#49454F]">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${settings.incognitoMode ? 'bg-[#6750A4] text-white' : 'bg-[#EADDFF] text-[#6750A4]'}`}>
                        {settings.incognitoMode ? <ShieldOff size={20} /> : <Shield size={20} />}
                    </div>
                    <div>
                        <h4 className="text-sm font-bold">{t.incognitoMode}</h4>
                        <p className="text-[10px] text-[#49454F] dark:text-[#CAC4D0]">{t.incognitoHint}</p>
                    </div>
                </div>
                <button
                    onClick={() => onUpdate({ incognitoMode: !settings.incognitoMode })}
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ${settings.incognitoMode ? 'bg-[#6750A4]' : 'bg-[#79747E]/30'}`}
                >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${settings.incognitoMode ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
            </div>

            {/* Multi-API Management */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-[#1D1B20] dark:text-[#E6E1E5]">{t.multiAPI}</h3>
                    {!isAdding && (
                        <button
                            onClick={() => {
                                setNewConfig({ name: 'New Config', provider: 'openai', protocol: 'openai', apiKey: '', baseUrl: 'https://api.openai.com/v1', modelName: 'gpt-3.5-turbo', customHeaders: {} })
                                setIsAdding(true)
                                setEditingId(null)
                            }}
                            className="p-1 pr-2 bg-[#6750A4] text-white rounded-full text-[10px] font-bold flex items-center gap-1"
                        >
                            <Plus size={14} /> {t.addConfig}
                        </button>
                    )}
                </div>

                {isAdding ? (
                    <div className="p-4 bg-white dark:bg-[#2B2930] border border-[#6750A4]/30 rounded-2xl space-y-4 shadow-inner">
                        <div className="space-y-3">
                            <input
                                type="text"
                                placeholder="Config Name"
                                value={newConfig.name}
                                onChange={(e) => setNewConfig({ ...newConfig, name: e.target.value })}
                                className="w-full px-3 py-2 text-sm border-b focus:border-[#6750A4] outline-none dark:bg-transparent dark:text-white"
                            />

                            <div className="grid grid-cols-3 gap-2">
                                {(['openai', 'anthropic', 'custom'] as const).map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setNewConfig({
                                            ...newConfig,
                                            provider: p,
                                            protocol: p === 'custom' ? 'openai' : p,
                                            baseUrl: p === 'openai' ? 'https://api.openai.com/v1' : p === 'anthropic' ? 'https://api.anthropic.com/v1' : newConfig.baseUrl
                                        })}
                                        className={`py-1 text-[10px] rounded-md border font-bold capitalize ${newConfig.provider === p ? 'bg-[#EADDFF] border-[#6750A4] text-[#6750A4]' : 'border-gray-200'}`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>

                            <input
                                type="text"
                                placeholder={t.modelName}
                                value={newConfig.modelName}
                                onChange={(e) => setNewConfig({ ...newConfig, modelName: e.target.value })}
                                className="w-full px-3 py-2 text-xs border border-gray-100 rounded-lg dark:bg-[#141218] dark:border-gray-800"
                            />

                            <input
                                type="password"
                                placeholder={t.apiKey}
                                value={newConfig.apiKey}
                                onChange={(e) => setNewConfig({ ...newConfig, apiKey: e.target.value })}
                                className="w-full px-3 py-2 text-xs border border-gray-100 rounded-lg dark:bg-[#141218] dark:border-gray-800"
                            />

                            {newConfig.provider === 'custom' && (
                                <input
                                    type="text"
                                    placeholder={t.baseUrl}
                                    value={newConfig.baseUrl}
                                    onChange={(e) => setNewConfig({ ...newConfig, baseUrl: e.target.value })}
                                    className="w-full px-3 py-2 text-xs border border-gray-100 rounded-lg dark:bg-[#141218] dark:border-gray-800"
                                />
                            )}
                        </div>

                        <div className="flex gap-2">
                            <button onClick={handleSaveConfig} className="flex-1 py-2 bg-[#6750A4] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1">
                                <Save size={14} /> {t.save}
                            </button>
                            <button onClick={() => setIsAdding(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-xs">
                                {t.cancel}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {(settings.apiConfigs || []).map((config) => (
                            <div
                                key={config.id}
                                onClick={() => handleActivate(config.id)}
                                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between
                                    ${settings.activeConfigId === config.id
                                        ? 'border-[#6750A4] bg-[#F3EDF7] dark:bg-[#4F378B]/20 shadow-sm'
                                        : 'border-[#79747E]/10 bg-white dark:bg-[#141218] hover:border-[#6750A4]/50'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${settings.activeConfigId === config.id ? 'bg-[#6750A4] text-white' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                        {settings.activeConfigId === config.id ? <Check size={16} /> : <span className="text-[10px] uppercase font-bold">{config.provider[0]}</span>}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold capitalize line-clamp-1">{config.name || 'Unnamed Config'}</div>
                                        <div className="text-[10px] text-gray-500">{config.provider} • {config.modelName}</div>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={(e) => startEdit(config, e)} className="p-2 text-gray-400 hover:text-blue-500"><Edit2 size={14} /></button>
                                    <button onClick={(e) => handleDelete(config.id, e)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Global Settings (Context Length etc) */}
            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="space-y-2">
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
                        {t.contextHint.replace('{n}', (settings.contextLength || 0).toString())}
                    </p>
                </div>
            </div>

            <button
                onClick={onTestConnection}
                disabled={isTesting || !settings.apiKey}
                className="w-full py-3 bg-[#6750A4] text-white rounded-2xl text-sm font-bold shadow-md active:scale-95 transition-transform disabled:opacity-50"
            >
                {isTesting ? t.testing : t.testConnection}
            </button>
            {connectionStatus === 'connected' && <p className="text-center text-xs text-green-600 font-bold">{t.connected}</p>}
            {connectionStatus === 'error' && <p className="text-center text-xs text-red-600 font-bold">{t.connectionFailed}</p>}
        </div>
    )
}

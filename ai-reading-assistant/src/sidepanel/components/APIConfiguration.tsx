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
            {/* Incognito Mode Toggle */}
            <div className="p-4 bg-[var(--md3-surface-container)] dark:bg-[var(--md3-surface-container-high)] rounded-2xl flex items-center justify-between border border-[var(--md3-outline-variant)]">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${settings.incognitoMode ? 'bg-[var(--md3-primary)] text-white' : 'bg-[var(--md3-primary-container)] text-[var(--md3-on-primary-container)]'}`}>
                        {settings.incognitoMode ? <ShieldOff size={20} /> : <Shield size={20} />}
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-[var(--md3-on-surface)]">{t.incognitoMode}</h4>
                        <p className="text-[10px] text-[var(--md3-on-surface-variant)]">{t.incognitoHint}</p>
                    </div>
                </div>
                <button
                    onClick={() => onUpdate({ incognitoMode: !settings.incognitoMode })}
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ${settings.incognitoMode ? 'bg-[var(--md3-primary)]' : 'bg-[var(--md3-outline)]/30'}`}
                >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${settings.incognitoMode ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
            </div>

            {/* Multi-API Management */}
            <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                    <h3 className="text-sm font-bold text-[var(--md3-on-surface)]">{t.multiAPI}</h3>
                    {!isAdding && (
                        <button
                            onClick={() => {
                                setNewConfig({ name: 'New Config', provider: 'openai', protocol: 'openai', apiKey: '', baseUrl: 'https://api.openai.com/v1', modelName: 'gpt-3.5-turbo', customHeaders: {} })
                                setIsAdding(true)
                                setEditingId(null)
                            }}
                            className="px-3 py-1.5 bg-[var(--md3-primary)] text-white rounded-full text-[10px] font-bold flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all active:scale-95"
                        >
                            <Plus size={14} /> {t.addConfig}
                        </button>
                    )}
                </div>

                {isAdding ? (
                    <div className="p-4 bg-white dark:bg-[var(--md3-surface-container-high)] border border-[var(--md3-primary)]/30 rounded-2xl space-y-4 shadow-xl animate-fade-in">
                        <div className="space-y-3">
                            <input
                                type="text"
                                placeholder="Config Name"
                                value={newConfig.name}
                                onChange={(e) => setNewConfig({ ...newConfig, name: e.target.value })}
                                className="w-full px-3 py-2 text-sm border-b border-[var(--md3-outline-variant)] focus:border-[var(--md3-primary)] outline-none bg-transparent text-[var(--md3-on-surface)]"
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
                                        className={`py-1.5 text-[10px] rounded-lg border font-bold capitalize transition-all ${newConfig.provider === p ? 'bg-[var(--md3-primary-container)] border-[var(--md3-primary)] text-[var(--md3-on-primary-container)]' : 'border-[var(--md3-outline-variant)] text-[var(--md3-on-surface-variant)] hover:bg-black/5'}`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 gap-2">
                                <input
                                    type="text"
                                    placeholder={t.modelName}
                                    value={newConfig.modelName}
                                    onChange={(e) => setNewConfig({ ...newConfig, modelName: e.target.value })}
                                    className="w-full px-4 py-2 text-xs bg-[var(--md3-surface-container)] rounded-xl border border-[var(--md3-outline-variant)] focus:border-[var(--md3-primary)] outline-none text-[var(--md3-on-surface)]"
                                />

                                <input
                                    type="password"
                                    placeholder={t.apiKey}
                                    value={newConfig.apiKey}
                                    onChange={(e) => setNewConfig({ ...newConfig, apiKey: e.target.value })}
                                    className="w-full px-4 py-2 text-xs bg-[var(--md3-surface-container)] rounded-xl border border-[var(--md3-outline-variant)] focus:border-[var(--md3-primary)] outline-none text-[var(--md3-on-surface)]"
                                />

                                {newConfig.provider === 'custom' && (
                                    <input
                                        type="text"
                                        placeholder={t.baseUrl}
                                        value={newConfig.baseUrl}
                                        onChange={(e) => setNewConfig({ ...newConfig, baseUrl: e.target.value })}
                                        className="w-full px-4 py-2 text-xs bg-[var(--md3-surface-container)] rounded-xl border border-[var(--md3-outline-variant)] focus:border-[var(--md3-primary)] outline-none text-[var(--md3-on-surface)]"
                                    />
                                )}
                            </div>

                            <div className="space-y-4 pt-2">
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-[10px] font-bold text-[var(--md3-on-surface-variant)] opacity-70">Temperature</label>
                                        <span className="text-[10px] text-[var(--md3-primary)] font-black">{(newConfig.temperature ?? 0.7).toFixed(1)}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="2"
                                        step="0.1"
                                        value={newConfig.temperature ?? 0.7}
                                        onChange={(e) => setNewConfig({ ...newConfig, temperature: parseFloat(e.target.value) })}
                                        className="w-full h-1.5 bg-[var(--md3-outline-variant)]/30 rounded-lg appearance-none cursor-pointer accent-[var(--md3-primary)]"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-[var(--md3-on-surface-variant)] opacity-70 px-1">Max Tokens</label>
                                    <input
                                        type="number"
                                        placeholder="4096"
                                        value={newConfig.maxTokens ?? 4096}
                                        onChange={(e) => setNewConfig({ ...newConfig, maxTokens: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2 text-xs bg-[var(--md3-surface-container)] rounded-xl border border-[var(--md3-outline-variant)] focus:border-[var(--md3-primary)] outline-none text-[var(--md3-on-surface)]"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2.5 pt-2">
                            <button onClick={handleSaveConfig} className="flex-1 py-2.5 bg-[var(--md3-primary)] text-white rounded-xl text-xs font-black shadow-lg shadow-[var(--md3-primary)]/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                                <Save size={14} /> {t.save}
                            </button>
                            <button onClick={() => setIsAdding(false)} className="px-4 py-2.5 bg-[var(--md3-surface-container-high)] text-[var(--md3-on-surface)] rounded-xl text-xs font-bold hover:bg-black/5 transition-colors">
                                {t.cancel}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        {(settings.apiConfigs || []).map((config) => (
                            <div
                                key={config.id}
                                onClick={() => handleActivate(config.id)}
                                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group
                                    ${settings.activeConfigId === config.id
                                        ? 'border-[var(--md3-primary)] bg-[var(--md3-primary-container)] shadow-sm'
                                        : 'border-[var(--md3-outline-variant)] bg-[var(--md3-surface)] hover:border-[var(--md3-primary)]/50 hover:bg-[var(--md3-surface-container)]'
                                    }`}
                            >
                                <div className="flex items-center gap-3.5">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${settings.activeConfigId === config.id ? 'bg-[var(--md3-primary)] text-white shadow-sm' : 'bg-[var(--md3-surface-container-high)] text-[var(--md3-on-surface-variant)]'}`}>
                                        {settings.activeConfigId === config.id ? <Check size={18} /> : <span className="text-xs uppercase font-black">{config.provider[0]}</span>}
                                    </div>
                                    <div>
                                        <div className={`text-sm font-black line-clamp-1 ${settings.activeConfigId === config.id ? 'text-[var(--md3-on-primary-container)]' : 'text-[var(--md3-on-surface)]'}`}>{config.name || 'Unnamed Config'}</div>
                                        <div className={`text-[10px] font-bold opacity-60 ${settings.activeConfigId === config.id ? 'text-[var(--md3-on-primary-container)]' : 'text-[var(--md3-on-surface-variant)]'}`}>{config.provider} • {config.modelName}</div>
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={(e) => startEdit(config, e)} className="p-2 text-[var(--md3-on-surface-variant)] hover:text-[var(--md3-primary)] transition-colors"><Edit2 size={14} /></button>
                                    <button onClick={(e) => handleDelete(config.id, e)} className="p-2 text-[var(--md3-on-surface-variant)] hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Global Settings (Context Length etc) */}
            <div className="space-y-4 pt-6 mt-2 border-t border-[var(--md3-outline-variant)]/30">
                <div className="space-y-2.5 px-1">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-black text-[var(--md3-on-surface)]">{t.contextMemory}</label>
                        <span className="px-2 py-0.5 bg-[var(--md3-primary-container)] text-[var(--md3-primary)] rounded-full text-xs font-black">{settings.contextLength}</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="10"
                        step="1"
                        value={settings.contextLength}
                        onChange={(e) => onUpdate({ contextLength: parseInt(e.target.value) })}
                        className="w-full h-1.5 bg-[var(--md3-outline-variant)]/30 rounded-lg appearance-none cursor-pointer accent-[var(--md3-primary)]"
                    />
                    <p className="text-[10px] font-bold text-[var(--md3-on-surface-variant)] opacity-60 leading-relaxed">
                        {t.contextHint.replace('{n}', (settings.contextLength || 0).toString())}
                    </p>
                </div>
            </div>

            <button
                onClick={onTestConnection}
                disabled={isTesting || !settings.apiKey}
                className="w-full py-3.5 bg-[var(--md3-primary)] text-white rounded-2xl text-sm font-black shadow-lg shadow-[var(--md3-primary)]/30 active:scale-[0.98] hover:brightness-110 shadow-elevation-2 transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
                {isTesting ? t.testing : t.testConnection}
            </button>
            {connectionStatus === 'connected' && <p className="text-center text-xs text-green-600 font-black animate-fade-in">{t.connected}</p>}
            {connectionStatus === 'error' && <p className="text-center text-xs text-red-600 font-black animate-fade-in">{t.connectionFailed}</p>}
        </div>
    )
}

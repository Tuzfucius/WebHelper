import React from 'react'
import { Settings } from '../../types'
import { Keyboard } from 'lucide-react'

interface ShortcutSettingsProps {
    settings: Settings
    onUpdate: (settings: Partial<Settings>) => void
}

export const ShortcutSettings: React.FC<ShortcutSettingsProps> = ({ settings, onUpdate }) => {
    const handleShortcutChange = (value: string) => {
        onUpdate({
            shortcuts: {
                ...settings.shortcuts,
                sendMessage: value
            }
        })
    }

    return (
        <div className="p-4 bg-[var(--md3-surface-container)] dark:bg-[var(--md3-surface-container-high)] rounded-2xl border border-[var(--md3-outline-variant)]/50 space-y-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-[var(--md3-primary-container)] rounded-xl text-[var(--md3-primary)] shadow-sm">
                    <Keyboard size={20} />
                </div>
                <div>
                    <h3 className="text-sm font-black text-[var(--md3-on-surface)]">快捷键设置</h3>
                    <p className="text-[10px] font-bold text-[var(--md3-on-surface-variant)] opacity-60 uppercase tracking-wider">Shortcuts</p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <div>
                        <p className="text-sm font-black text-[var(--md3-on-surface)]">发送消息</p>
                        <p className="text-[10px] font-bold text-[var(--md3-on-surface-variant)] opacity-60">选择用于发送消息的键盘组合</p>
                    </div>
                    <select
                        value={settings.shortcuts?.sendMessage || 'Ctrl+Enter'}
                        onChange={(e) => handleShortcutChange(e.target.value)}
                        className="bg-[var(--md3-surface)] dark:bg-[var(--md3-surface-container)] border border-[var(--md3-outline-variant)] rounded-xl px-3 py-1.5 text-xs font-bold text-[var(--md3-on-surface)] focus:ring-2 focus:ring-[var(--md3-primary)] outline-none transition-all shadow-sm"
                    >
                        <option value="Enter">Enter</option>
                        <option value="Ctrl+Enter">Ctrl + Enter</option>
                    </select>
                </div>
            </div>
        </div>
    )
}

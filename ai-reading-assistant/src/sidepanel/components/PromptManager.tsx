import React, { useState } from 'react'
import { Settings, PromptTemplate } from '../../types'
import { useTranslation } from '../../utils/i18n'

interface PromptManagerProps {
    settings: Settings
    onUpdate: (updates: Partial<Settings>) => void
}

export const PromptManager: React.FC<PromptManagerProps> = ({
    settings,
    onUpdate
}) => {
    const t = useTranslation(settings.language)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editName, setEditName] = useState('')
    const [editContent, setEditContent] = useState('')
    const [isCreating, setIsCreating] = useState(false)

    const handleEdit = (prompt: PromptTemplate) => {
        setEditingId(prompt.id)
        setEditName(prompt.name)
        setEditContent(prompt.content)
        setIsCreating(false)
    }

    const handleCreate = () => {
        setEditingId(null)
        setEditName('New Prompt')
        setEditContent('')
        setIsCreating(true)
    }

    const handleSave = () => {
        if (!editName.trim() || !editContent.trim()) return

        const newPrompts = [...(settings.prompts || [])] // Handle potential undefined if state migration lagged

        if (isCreating) {
            const newPrompt: PromptTemplate = {
                id: crypto.randomUUID(),
                name: editName,
                content: editContent
            }
            newPrompts.push(newPrompt)
        } else {
            const index = newPrompts.findIndex(p => p.id === editingId)
            if (index !== -1) {
                newPrompts[index] = { ...newPrompts[index], name: editName, content: editContent }
            }
        }

        onUpdate({ prompts: newPrompts })
        setEditingId(null)
        setIsCreating(false)
    }

    const handleDelete = (id: string) => {
        if (confirm(t.deletePromptConfirm)) {
            const newPrompts = settings.prompts.filter(p => p.id !== id)
            onUpdate({ prompts: newPrompts })
            if (settings.activePromptId === id && newPrompts.length > 0) {
                onUpdate({ activePromptId: newPrompts[0].id })
            }
        }
    }

    const handleSetActive = (id: string) => {
        onUpdate({ activePromptId: id })
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-[#1D1B20]">{t.systemPrompts}</label>
                <button
                    onClick={handleCreate}
                    className="px-3 py-1 bg-[#EADDFF] text-[#21005D] text-xs font-medium rounded-full hover:bg-[#D0BCFF] transition-colors"
                >
                    {t.newPrompt}
                </button>
            </div>

            <div className="space-y-3">
                {(isCreating || editingId) && (
                    <div className="p-3 border border-[#6750A4] rounded-lg bg-[#F3EDF7] space-y-2 animate-fadeIn">
                        <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder={t.promptName}
                            className="w-full px-2 py-1 text-sm bg-white rounded border border-[#79747E]/30 focus:ring-1 focus:ring-[#6750A4]"
                        />
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            placeholder={t.promptContent}
                            rows={3}
                            className="w-full px-2 py-1 text-sm bg-white rounded border border-[#79747E]/30 focus:ring-1 focus:ring-[#6750A4] resize-none"
                        />
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={() => { setIsCreating(false); setEditingId(null) }}
                                className="px-2 py-1 text-xs text-[#6750A4] hover:bg-[#EADDFF]/50 rounded"
                            >
                                {t.cancel}
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-3 py-1 bg-[#6750A4] text-white text-xs rounded hover:bg-[#5235a0]"
                            >
                                {t.save}
                            </button>
                        </div>
                    </div>
                )}

                {(settings.prompts || []).map(prompt => (
                    <div
                        key={prompt.id}
                        className={`p-3 rounded-lg border transition-all hover:shadow-sm
              ${settings.activePromptId === prompt.id
                                ? 'border-[#6750A4] bg-[#F3EDF7]'
                                : 'border-[#79747E]/20 bg-white'
                            }`}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => handleSetActive(prompt.id)}>
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center
                    ${settings.activePromptId === prompt.id ? 'border-[#6750A4]' : 'border-[#79747E]'}`}>
                                    {settings.activePromptId === prompt.id && <div className="w-2 h-2 rounded-full bg-[#6750A4]" />}
                                </div>
                                <span className="font-medium text-sm text-[#1D1B20]">{prompt.name}</span>
                            </div>
                            <div className="flex space-x-1">
                                <button
                                    onClick={() => handleEdit(prompt)}
                                    className="p-1 text-[#49454F] hover:text-[#6750A4]"
                                    title={t.edit}
                                >
                                    ✎
                                </button>
                                <button
                                    onClick={() => handleDelete(prompt.id)}
                                    className="p-1 text-[#49454F] hover:text-red-600"
                                    title={t.delete}
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                        <p className="text-xs text-[#49454F] line-clamp-2 pl-6">
                            {prompt.content}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    )
}

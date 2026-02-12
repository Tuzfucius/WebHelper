import React from 'react'
import { Sparkles, Moon, Sun, Trash2, X, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSettings } from '../../stores/AppContext'

interface HeaderProps {
  showPromptSelector: boolean
  setShowPromptSelector: (show: boolean) => void
  onClose: () => void
  onClearChat: () => void
  activePromptName: string
}

export function Header({ showPromptSelector, setShowPromptSelector, onClose, onClearChat, activePromptName }: HeaderProps) {
  const { settings, updateSettings } = useSettings()
  const prompts = settings.prompts || []
  const t = (key: string) => {
    const translations: Record<string, string> = {
      clearChat: 'Clear Chat',
      chat: 'Chat',
      dashboard: 'Dashboard',
      history: 'History',
      settings: 'Settings'
    }
    return translations[key] || key
  }

  const toggleTheme = () => {
    const newTheme = settings.theme === 'dark' ? 'light' : 'dark'
    updateSettings({ theme: newTheme })
  }

  const toggleLanguage = () => {
    // 语言切换逻辑
  }

  const handlePromptSelect = (promptId: string) => {
    updateSettings({ activePromptId: promptId })
    setShowPromptSelector(false)
  }

  return (
    <header className="flex-none px-4 py-3 bg-white/70 dark:bg-[#141218]/70 backdrop-blur-xl border-b border-[#E7E0EC] dark:border-[#49454F] sticky top-0 z-20 flex items-center justify-between">
      <div className="flex items-center gap-3 relative">
        <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#D0BCFF] to-[#6750A4] flex items-center justify-center text-white shadow-sm">
          <Sparkles size={18} />
        </div>
        <div className="cursor-pointer group" onClick={() => setShowPromptSelector(!showPromptSelector)}>
          <h1 className="text-sm font-bold leading-tight flex items-center gap-1.5 text-[#1D1B20] dark:text-[#E6E1E5]">
            {activePromptName}
            <ChevronDown size={14} className={`transition-transform duration-300 ${showPromptSelector ? 'rotate-180' : ''} text-[#49454F] dark:text-[#CAC4D0]`} />
          </h1>
          <p className="text-[10px] text-[#49454F] dark:text-[#CAC4D0] font-bold tracking-wider uppercase opacity-70">
            {settings.provider}
          </p>
        </div>

        <AnimatePresence>
          {showPromptSelector && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-[#2B2930] rounded-xl shadow-lg border border-[#E7E0EC] dark:border-[#49454F] overflow-hidden z-50"
            >
              {(prompts || []).map(p => (
                <button
                  key={p.id}
                  onClick={() => handlePromptSelect(p.id)}
                  className={`w-full text-left px-4 py-2 text-sm ${settings.activePromptId === p.id ? 'bg-[#EADDFF] dark:bg-[#4A4458]' : 'hover:bg-[#F3EDF7] dark:hover:bg-[#36343B]'}`}
                >
                  {p.name}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-1">
        <button onClick={toggleLanguage} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
          <span className="text-xs font-bold border px-1 rounded">{settings.language.toUpperCase()}</span>
        </button>
        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
          {settings.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button onClick={onClearChat} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800" title={t('clearChat')}>
          <Trash2 size={18} />
        </button>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
          <X size={18} />
        </button>
      </div>
    </header>
  )
}

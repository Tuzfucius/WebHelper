import { useEffect, useState, useRef } from 'react'

interface SelectionPopoverProps {
  text: string
  onSelect: (text: string, action?: string) => void
}

interface ActionButton {
  id: string
  icon: string
  label: string
  prefix: string // 前缀指令，发送到 AI 时自动追加
}

const ACTIONS: ActionButton[] = [
  { id: 'ask', icon: '💬', label: '提问', prefix: '' },
  { id: 'summarize', icon: '📝', label: '总结', prefix: '请总结以下内容：\n\n' },
  { id: 'translate', icon: '🌐', label: '翻译', prefix: '请将以下内容翻译成中文：\n\n' },
  { id: 'explain', icon: '💡', label: '解释', prefix: '请通俗易懂地解释以下内容：\n\n' },
]

export const SelectionPopover: React.FC<SelectionPopoverProps> = ({ text, onSelect }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)
  const [currentText, setCurrentText] = useState('')
  const [showActions, setShowActions] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    const handleSelection = (e: MouseEvent) => {
      // 如果点击在 popover 内部，不处理
      if (popoverRef.current && popoverRef.current.contains(e.target as Node)) {
        return
      }

      const selection = window.getSelection()
      const selectedText = selection?.toString()?.trim() || ''

      if (selectedText.length > 5) {
        const range = selection?.getRangeAt(0)
        const rect = range?.getBoundingClientRect()
        if (rect) {
          setCurrentText(selectedText)
          const smartPosition = calculateSmartPosition(rect)
          setPosition(smartPosition)
          setIsVisible(true)
          setShowActions(false)

          // 清除之前的定时器
          if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
          // 10秒后自动隐藏
          hideTimerRef.current = setTimeout(() => setIsVisible(false), 10000)
        }
      }
    }

    const handleMouseDown = (e: MouseEvent) => {
      if (popoverRef.current && popoverRef.current.contains(e.target as Node)) {
        return
      }
      // 延迟隐藏，让 mouseup 事件先处理（新的选择）
      setTimeout(() => {
        const selection = window.getSelection()
        if (!selection || selection.toString().trim().length <= 5) {
          setIsVisible(false)
        }
      }, 50)
    }

    document.addEventListener('mouseup', handleSelection)
    document.addEventListener('mousedown', handleMouseDown)

    return () => {
      document.removeEventListener('mouseup', handleSelection)
      document.removeEventListener('mousedown', handleMouseDown)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [])

  const calculateSmartPosition = (rect: DOMRect): { x: number; y: number } => {
    const popoverWidth = showActions ? 280 : 200
    const popoverHeight = 48
    const margin = 8
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let x = rect.left + rect.width / 2 - popoverWidth / 2
    let y = rect.bottom + margin

    // 水平边界
    if (x < margin) x = margin
    else if (x + popoverWidth > viewportWidth - margin) x = viewportWidth - popoverWidth - margin

    // 垂直边界 - 下方不够则显示在上方
    if (y + popoverHeight > viewportHeight - margin) {
      y = rect.top - popoverHeight - margin
      if (y < margin) y = rect.top
    }

    return { x, y }
  }

  const handleAction = (action: ActionButton) => {
    const fullText = action.prefix + currentText
    onSelect(fullText, action.id)
    setIsVisible(false)
  }

  const handleClose = () => {
    setIsVisible(false)
  }

  if (!isVisible || !currentText) {
    return null
  }

  return (
    <div
      ref={popoverRef}
      className="fixed z-[99999]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translateZ(0)',
        animation: 'selectionPopoverIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      <style>{`
        @keyframes selectionPopoverIn {
          from { opacity: 0; transform: translateY(6px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
      <div className="relative">
        {/* 浮窗主体 */}
        <div className="relative bg-white rounded-2xl shadow-2xl border border-[#E7E0EC] overflow-hidden"
          style={{ boxShadow: '0 8px 32px rgba(103, 80, 164, 0.18), 0 2px 8px rgba(0,0,0,0.08)' }}>

          {/* 主要操作按钮行 */}
          <div className="flex items-center gap-1 px-2 py-1.5">
            {ACTIONS.map((action) => (
              <button
                key={action.id}
                onClick={() => handleAction(action)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium
                           hover:bg-[#EADDFF] active:bg-[#D0BCFF] transition-all duration-150
                           text-[#1D1B20] whitespace-nowrap"
                onMouseDown={(e) => e.preventDefault()}
                title={action.label}
              >
                <span className="text-sm">{action.icon}</span>
                <span>{action.label}</span>
              </button>
            ))}

            {/* 关闭按钮 */}
            <button
              onClick={handleClose}
              className="ml-auto w-6 h-6 rounded-full hover:bg-[#F3EDF7] transition-colors flex items-center justify-center flex-shrink-0"
              title="关闭"
            >
              <svg className="w-3.5 h-3.5 text-[#49454F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 选中文本预览 */}
          <div className="px-3 pb-2">
            <div className="bg-[#F3EDF7] rounded-lg px-2.5 py-1.5">
              <p className="text-[10px] text-[#49454F] line-clamp-2 leading-relaxed">
                {currentText.length > 120 ? currentText.substring(0, 120) + '...' : currentText}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
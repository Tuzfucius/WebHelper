import { useEffect, useState, useRef } from 'react'

interface SelectionPopoverProps {
  text: string
  onSelect: (text: string) => void
}

export const SelectionPopover: React.FC<SelectionPopoverProps> = ({ text, onSelect }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)
  const [currentText, setCurrentText] = useState('')
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleSelection = (e: MouseEvent) => {
      const selection = window.getSelection()
      const selectedText = selection?.toString() || ''
      
      if (selectedText.length > 20) {
        const rect = selection?.getRangeAt(0).getBoundingClientRect()
        if (rect) {
          setCurrentText(selectedText)
          
          // 计算智能位置
          const smartPosition = calculateSmartPosition(rect)
          setPosition(smartPosition)
          setIsVisible(true)
          
          // Auto-hide after 8 seconds
          setTimeout(() => setIsVisible(false), 8000)
        }
      } else if (selectedText.length <= 20 && isVisible) {
        setIsVisible(false)
      }
    }

    // 防止冲突的选择事件
    const handleMouseDown = (e: MouseEvent) => {
      // 如果点击的是浮窗本身，不要隐藏
      if (popoverRef.current && popoverRef.current.contains(e.target as Node)) {
        return
      }
      setIsVisible(false)
    }

    document.addEventListener('mouseup', handleSelection)
    document.addEventListener('mousedown', handleMouseDown)
    
    return () => {
      document.removeEventListener('mouseup', handleSelection)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [isVisible])

  // 智能位置计算算法
  const calculateSmartPosition = (rect: DOMRect): { x: number; y: number } => {
    if (!popoverRef.current) return { x: rect.left, y: rect.bottom + 8 }
    
    const popoverWidth = 160 // 浮窗宽度
    const popoverHeight = 56 // 浮窗高度
    const margin = 8 // 边距
    
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    let x = rect.left + rect.width / 2 - popoverWidth / 2
    let y = rect.bottom + margin
    
    // 水平边界检查
    if (x < margin) {
      x = margin
    } else if (x + popoverWidth > viewportWidth - margin) {
      x = viewportWidth - popoverWidth - margin
    }
    
    // 垂直边界检查 - 如果下方空间不足，显示在上方
    if (y + popoverHeight > viewportHeight - margin) {
      y = rect.top - popoverHeight - margin
      
      // 如果上方空间也不足，显示在左侧或右侧
      if (y < margin) {
        y = rect.bottom + margin
        
        // 如果下方空间还是不足，显示在左侧
        if (y + popoverHeight > viewportHeight - margin) {
          y = rect.top - popoverHeight - margin
          x = rect.left - popoverWidth - margin
          
          // 如果左侧空间不足，显示在右侧
          if (x < margin) {
            x = rect.right + margin
          }
        }
      }
    }
    
    return { x, y }
  }

  const handleAskAI = () => {
    onSelect(currentText)
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
      className="fixed z-[99999] animate-slide-up"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translateZ(0)', // 硬件加速
      }}
    >
      <div className="relative">
        {/* 多层阴影效果 */}
        <div className="absolute inset-0 bg-black/20 blur-sm rounded-full"></div>
        <div className="absolute inset-0 bg-black/10 rounded-full"></div>
        
        {/* 浮窗主体 */}
        <div className="relative bg-white rounded-full shadow-2xl border border-[#EADDFF]">
          {/* 装饰性背景 */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#EADDFF] to-[#F3EDF7] rounded-full opacity-50"></div>
          
          {/* 内容区域 */}
          <div className="relative flex items-center space-x-2 px-4 py-2">
            {/* AI图标 */}
            <div className="flex-shrink-0">
              <div className="w-5 h-5 bg-[#6750A4] rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            
            {/* 主按钮 */}
            <button
              onClick={handleAskAI}
              className="flex-1 bg-[#6750A4] text-white px-3 py-1.5 rounded-full text-sm font-medium
                         hover:bg-[#5235a0] active:bg-[#3e2b7a] transform active:scale-95
                         transition-all duration-200 shadow-md"
              onMouseDown={(e) => e.preventDefault()}
            >
              Ask AI
            </button>
            
            {/* 关闭按钮 */}
            <button
              onClick={handleClose}
              className="w-6 h-6 rounded-full hover:bg-[#F3EDF7] transition-colors flex items-center justify-center"
              title="Close"
            >
              <svg className="w-4 h-4 text-[#6750A4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* 文本预览 */}
          <div className="absolute -bottom-16 left-0 right-0">
            <div className="bg-white border border-[#79747E]/20 rounded-lg p-2 shadow-lg">
              <p className="text-xs text-[#49454F] line-clamp-2">
                "{currentText.length > 100 ? currentText.substring(0, 100) + '...' : currentText}"
              </p>
            </div>
          </div>
        </div>
        
        {/* 指向箭头 - 根据位置动态调整 */}
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#EADDFF]"></div>
      </div>
    </div>
  )
}
import { useState, useEffect, useRef } from 'react'

interface FloatingButtonProps {
  onClick: () => void
}

export const FloatingButton: React.FC<FloatingButtonProps> = ({ onClick }) => {
  const [state, setState] = useState<'idle' | 'hover' | 'active' | 'hidden'>('idle')
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(true)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const hideTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // 检查是否应该显示按钮
    const checkVisibility = () => {
      const shouldHide = window.scrollY > 100 ||
        (document.body.scrollHeight - window.innerHeight - window.scrollY) < 200

      if (shouldHide && state !== 'hidden') {
        setState('hidden')
      } else if (!shouldHide && state === 'hidden') {
        setState('idle')
      }
    }

    // 监听滚动和视口变化
    window.addEventListener('scroll', checkVisibility, { passive: true })
    window.addEventListener('resize', checkVisibility)

    // 初始检查
    checkVisibility()

    return () => {
      window.removeEventListener('scroll', checkVisibility)
      window.removeEventListener('resize', checkVisibility)
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
      }
    }
  }, [state])

  // 智能位置计算
  useEffect(() => {
    if (!isVisible || state === 'hidden') return

    const updatePosition = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect()
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight

        // 确保按钮不会超出视口边界
        const safeX = Math.max(8, Math.min(viewportWidth - rect.width - 8, position.x))
        const safeY = Math.max(8, Math.min(viewportHeight - rect.height - 8, position.y))

        setPosition({ x: safeX, y: safeY })
      }
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)

    return () => window.removeEventListener('resize', updatePosition)
  }, [isVisible, position, state])

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // 添加点击动画反馈
    setState('active')
    setTimeout(() => setState('hover'), 150)

    // Callback handled by parent

    onClick()
  }

  const handleMouseEnter = () => {
    if (state !== 'hidden') {
      setState('hover')

      // 清除隐藏超时
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
      }
    }
  }

  const handleMouseLeave = () => {
    if (state !== 'hidden') {
      setState('idle')
    }
  }

  const handleMouseDown = () => {
    setState('active')
  }

  const handleMouseUp = () => {
    setState('hover')
  }

  // 智能隐藏按钮
  const startHideTimer = () => {
    hideTimeoutRef.current = setTimeout(() => {
      setState('hidden')
    }, 5000) // 5秒后隐藏
  }

  // 重置隐藏计时器
  const resetHideTimer = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
    }
    startHideTimer()
  }

  // 根据状态计算样式
  const getButtonStyles = () => {
    const baseStyles = `
      fixed z-[99999] transition-all duration-300 ease-out
      flex items-center justify-center group
      shadow-lg backdrop-blur-sm
    `

    const positionStyles = `
      left: ${position.x}px;
      bottom: ${position.y}px;
    `

    const stateStyles = {
      idle: 'bg-[#6750A4]/70 hover:bg-[#6750A4]/90 transform scale-100',
      hover: 'bg-[#6750A4] transform scale-105 shadow-xl',
      active: 'bg-[#6750A4] transform scale-95 shadow-inner',
      hidden: 'opacity-0 transform scale-75 pointer-events-none'
    }

    return `${baseStyles} ${positionStyles} ${stateStyles[state]}`
  }

  return (
    <>
      {/* 智能显示指示器 */}
      {state === 'hidden' && (
        <div
          className="fixed right-4 bottom-4 z-[99999] animate-pulse"
          onMouseEnter={() => setState('hover')}
        >
          <div className="w-2 h-2 bg-[#6750A4] rounded-full"></div>
        </div>
      )}

      {/* 主要浮动按钮 */}
      <button
        ref={buttonRef}
        className={getButtonStyles()}
        onClick={handleClick}
        onMouseEnter={() => {
          handleMouseEnter()
          resetHideTimer()
        }}
        onMouseLeave={() => {
          handleMouseLeave()
          startHideTimer()
        }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        title="Ask AI Assistant"
        aria-label="Ask AI assistant"
      >
        {/* AI Icon - Animated lightning bolt */}
        <svg
          className={`w-6 h-6 text-white transition-transform duration-200 
            ${state === 'active' ? 'scale-90 rotate-12' : 'scale-100'}
            ${state === 'hover' ? 'animate-pulse-soft' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>

        {/* 悬停时显示的工具提示 */}
        {state === 'hover' && (
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 
                         bg-[#1D1B20] text-white text-xs px-2 py-1 rounded-md
                         opacity-0 group-hover:opacity-100 transition-opacity duration-200
                         whitespace-nowrap">
            Ask AI Assistant
          </div>
        )}
      </button>
    </>
  )
}
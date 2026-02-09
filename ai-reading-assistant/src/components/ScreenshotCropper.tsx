import React, { useState, useRef, useEffect, useCallback } from 'react'

interface ScreenshotCropperProps {
  onCapture: (imageData: string, rect: { x: number; y: number; width: number; height: number }) => void
  onCancel: () => void
}

interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export const ScreenshotCropper: React.FC<ScreenshotCropperProps> = ({ onCapture, onCancel }) => {
  const [isDragging, setIsDragging] = useState(false)
  const [cropRect, setCropRect] = useState<Rect | null>(null)
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const rect = overlayRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setIsDragging(true)
    setStartPos({ x, y })
    
    if (!cropRect) {
      setCropRect({
        x: Math.max(0, x - 50),
        y: Math.max(0, y - 50),
        width: 100,
        height: 100
      })
    }
  }, [cropRect])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !startPos || !cropRect) return

    const rect = overlayRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const dx = x - startPos.x
    const dy = y - startPos.y

    if (!canvasRef.current) return

    const maxWidth = canvasRef.current.width - cropRect.width
    const maxY = canvasRef.current.height - cropRect.height

    setCropRect(prev => ({
      x: Math.max(0, cropRect.x + dx),
      y: Math.max(0, cropRect.y + dy),
      width: prev ? prev.width : 100,
      height: prev ? prev.height : 100
    }))
  }, [isDragging, startPos, cropRect])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setStartPos(null)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && cropRect) {
      handleCapture()
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }, [cropRect, onCapture, onCancel])

  const handleCapture = useCallback(() => {
    if (!cropRect || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const imageData = canvas.toDataURL('image/png', 0.8)
    
    onCapture(imageData, {
      x: cropRect.x,
      y: cropRect.y,
      width: cropRect.width,
      height: cropRect.height
    })

    onCancel()
  }, [cropRect, onCapture, onCancel])

  const handleResize = useCallback(() => {
    if (!overlayRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // 设置初始画布大小
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && cropRect) {
        handleCapture()
      } else if (e.key === 'Escape') {
        onCancel()
      }
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  if (!cropRect) {
    return null
  }

  const drawOverlay = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 绘制半透明蒙层
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 清除裁剪区域
    if (cropRect) {
      ctx.clearRect(cropRect.x, cropRect.y, cropRect.width, cropRect.height)
      
      // 绘制裁剪框边界
      ctx.strokeStyle = '#6750A4'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.strokeRect(cropRect.x, cropRect.y, cropRect.width, cropRect.height)

      // 绘制四个角落的手柄
      const handleSize = 12
      ctx.fillStyle = '#6750A4'

      ctx.beginPath()
      ctx.arc(cropRect.x, cropRect.y, handleSize, 0, Math.PI * 1.5)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(cropRect.x + cropRect.width, cropRect.y, handleSize, 0, Math.PI * 1.5)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(cropRect.x, cropRect.y + cropRect.height, handleSize, 0, Math.PI * 1.5)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(cropRect.x + cropRect.width, cropRect.y + cropRect.height, handleSize, 0, Math.PI * 1.5)
      ctx.fill()

      // 绘制尺寸标签
      ctx.fillStyle = 'white'
      ctx.font = '12px Inter, sans-serif'
      const sizeText = `${Math.round(cropRect.width)} × ${Math.round(cropRect.height)}`
      const textWidth = ctx.measureText(sizeText).width
      ctx.fillText(sizeText, cropRect.x + (cropRect.width - textWidth) / 2, cropRect.y - 20)
    }
  }, [cropRect])

  useEffect(() => {
    drawOverlay()
  }, [cropRect])

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[99999] bg-black/70 cursor-crosshair"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Canvas for cropping overlay */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ 
          transform: 'translateZ(0)',
          pointerEvents: 'none'
        }}
      />
      
      {/* Control buttons */}
      {cropRect && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3">
          <div className="bg-[#6750A4] text-white px-4 py-2 rounded-lg text-sm">
            Press Enter to capture, Escape to cancel. Size: {Math.round(cropRect.width)}×{Math.round(cropRect.height)}
          </div>
          
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg
                   transition-colors text-sm font-medium text-[#1D1B20]"
          >
            Cancel
          </button>
          
          <button
            onClick={handleCapture}
            className="px-6 py-2 bg-[#6750A4] text-white rounded-lg
                   hover:bg-[#5235a0] transition-colors text-sm font-medium shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 00-2v3a2 2 0 011-1.414l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.414 1.414l-3 3a1 1 0 010-1.414z" />
            </svg>
            Capture
          </button>
        </div>
      )}
    </div>
  )
}
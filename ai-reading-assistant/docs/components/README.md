# Components - UI Components

## 📋 组件概述

**位置**: `src/components/`
**用途**: 存放所有可复用的UI组件，提供基础的交互元素

---

## 🎯 核心组件列表

### 1. ScreenshotCropper 组件

**文件**: `src/components/ScreenshotCropper.tsx`

**功能概述**:
- Canvas 2D截图功能
- 拖拽裁剪框实现
- 选择区域预览
- 键盘快捷键支持

**核心功能**:

#### A. Canvas渲染系统
```typescript
interface ScreenshotCropperProps {
  onCapture: (imageData: string, rect: { x: number; y: number; width: number; height: number }) => void
  onCancel: () => void
}

export const ScreenshotCropper: React.FC<ScreenshotCropperProps> = ({ onCapture, onCancel }) => {
  // Canvas 2D渲染实现
  const [isDragging, setIsDragging] = useState(false)
  const [cropRect, setCropRect] = useState<Rect | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // 裁剪框拖拽逻辑
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const rect = overlayRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setIsDragging(true)
    setStartPos({ x, y })
  }, [cropRect])
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !startPos || !cropRect) return
    // 裁剪框位置更新逻辑
    const rect = overlayRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const dx = x - startPos.x
    const dy = y - startPos.y
    // 边界检查和位置更新...
  }, [isDragging, startPos, cropRect])
  
  const handleCapture = useCallback(() => {
    if (!cropRect || !canvasRef.current) return
    const canvas = canvasRef.current
    const imageData = canvas.toDataURL('image/png', 0.8)
    onCapture(imageData, {
      x: cropRect.x,
      y: cropRect.y,
      width: cropRect.width,
      height: cropRect.height
    })
  }, [cropRect, onCapture])
}
```

#### B. 键盘支持
```typescript
const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
  if (e.key === 'Enter' && cropRect) {
    handleCapture()
  } else if (e.key === 'Escape') {
    onCancel()
  }
}, [cropRect, handleCapture, onCancel])
```

#### C. 视觉效果
- 半透明黑色蒙层：`bg-black/70`
- 裁剪框边框：`border-[#6750A4]`
- 裁剪框虚线：`border-dashed`
- 尺寸标签显示
- 四角手柄：圆形紫色控制点

---

## 📋 设计原则

### Material Design 3 应用

**设计理念**:
- **Helpful**: 提供直观的截图工具
- **Organic**: 自然的拖拽交互
- **Rhythm**: 一致的视觉节奏和间距
- **Focus**: 清晰的视觉层次和重点

**颜色使用**:
```css
--md3-primary: #6750A4 (主要操作色）
--md3-surface: #FEF7FF (背景色）
--md3-on-surface: #1D1B20 (文字色）
```

**圆角策略**:
- 容器：`rounded-lg` (16px)
- 按钮：`rounded-full` (药丸形状）
- 控制点：`rounded-full` (圆形）

**动画效果**:
```css
.transition-all duration-200 ease-out (平滑过渡）
.transform hover:scale-105 (悬停缩放）
```

---

## 🔧 技术实现

### 事件处理

#### 拖拽事件
```typescript
const handleMouseDown = useCallback((e: React.MouseEvent) => {
  setIsDragging(true)
  setStartPos({ x: e.clientX, y: e.clientY })
}, [])

const handleMouseMove = useCallback((e: React.MouseEvent) => {
  if (!isDragging) return
  // 更新裁剪框位置
  const dx = e.clientX - startPos.x
  const dy = e.clientY - startPos.y
  // 边界检查...
}, [isDragging, startPos, cropRect])

const handleMouseUp = useCallback(() => {
  setIsDragging(false)
  setStartPos(null)
}, [])
```

#### 键盘事件
```typescript
const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
  if (e.key === 'Enter') {
    handleCapture()
  } else if (e.key === 'Escape') {
    onCancel()
  }
}, [cropRect, handleCapture, onCancel])
```

### Canvas渲染

#### 响应式画布
```typescript
useEffect(() => {
  const canvas = canvasRef.current
  if (!canvas) return
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  drawOverlay()
}, [])

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
  }
}, [cropRect])
```

#### Base64转换
```typescript
const handleCapture = useCallback(() => {
  const canvas = canvasRef.current
  if (!canvas) return
  const imageData = canvas.toDataURL('image/png', 0.8)
  onCapture(imageData, {
    x: cropRect.x,
    y: cropRect.y,
    width: cropRect.width,
    height: cropRect.height
  })
}, [cropRect, onCapture])
```

---

## 🎨 UI设计

### 控制按钮布局

```typescript
{isScreenshotMode && (
  <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3">
    <div className="bg-[#6750A4] text-white px-4 py-2 rounded-lg text-sm">
      Press Enter to capture, Escape to cancel
    </div>
    
    <button onClick={onCancel}>
      Cancel
    </button>
    
    <button onClick={handleCapture}>
      Capture Screenshot
    </button>
  </div>
)}
```

### 视觉层次

```
Overlay Layer (z-index: 99999)
├── Black transparent background (70% opacity)
└── Canvas layer (pointer-events: none)
    ├── Selection rect outline (solid purple, 2px)
    ├── Selection clear area (transparent)
    ├── Corner handles (filled purple circles)
    └── Size label (white text, 12px)
```

---

## 📊 性能优化

### 渲染优化

#### Canvas渲染优化
- 使用`requestAnimationFrame`优化重绘
- 避免不必要的Canvas重绘
- 使用硬件加速：`transform: translateZ(0)`

#### 事件处理优化
- 使用`useCallback`包装事件处理函数
- 避免匿名函数在每次渲染时重新创建
- 正确的依赖数组设置

#### 内存管理
- 清理Canvas对象URL：在组件卸载时调用`URL.revokeObjectURL()`
- 清理定时器：在useEffect的清理函数中处理
- 清理事件监听器：移除所有添加的事件监听器

---

## 🚀 使用示例

### 基础使用

```typescript
import { ScreenshotCropper } from './components/ScreenshotCropper'

function App() {
  const [imageData, setImageData] = useState('')
  const [rect, setRect] = useState<Rect | null>(null)
  
  const handleCapture = (data: string, r: Rect) => {
    setImageData(data)
    setRect(r)
  }
  
  const handleCancel = () => {
    setImageData('')
    setRect(null)
  }
  
  return (
    <div>
      <button onClick={() => setIsScreenshotMode(true)}>
        Start Screenshot
      </button>
      
      {isScreenshotMode && (
        <ScreenshotCropper
          onCapture={handleCapture}
          onCancel={handleCancel}
        />
      )}
    </div>
  )
}
```

### 高级使用

#### 与Markdown渲染器集成
```typescript
// 将截图功能与Markdown渲染结合
import { ScreenshotCropper } from './components/ScreenshotCropper'
import { MarkdownRenderer } from './components/MarkdownRenderer'

function ChatWithScreenshots() {
  const [screenshots, setScreenshots] = useState<ScreenshotData[]>([])
  
  const handleCapture = (data: string, rect: Rect) => {
    setScreenshots(prev => [...prev, { imageData: data, rect }])
  }
  
  return (
    <div className="chat-container">
      <div className="screenshot-toolbar">
        <button onClick={() => setIsScreenshotMode(true)}>
          Add Screenshot
        </button>
      </div>
      
      <div className="messages-area">
        {messages.map((msg) => (
          <div key={msg.id} className="message">
            <MarkdownRenderer content={msg.content} />
          </div>
        ))}
      </div>
      
      {isScreenshotMode && (
        <ScreenshotCropper
          onCapture={handleCapture}
          onCancel={() => setIsScreenshotMode(false)}
        />
      )}
    </div>
  )
}
```

---

## 📋 依赖关系

```
src/components/
├── ScreenshotCropper.tsx    # 截图裁剪组件（已实现）
├── ui/                  # 基础UI组件（待创建）
└── index.tsx             # UI组件导出（待创建）
```

**外部依赖**:
- React 18+
- useRef (useRef钩子)
- useCallback (性能优化钩子)
- useState (状态管理)

**全局状态**:
- 通过Context API与全局状态集成
- 截图功能触发截图模式状态

---

## ⚠️ 注意事项

### 性能考虑
1. Canvas重绘操作可能影响性能
2. 大尺寸截图可能导致内存问题
3. 需要在组件卸载时清理资源

### 兼容性
1. Canvas API在所有现代浏览器中支持
2. 某些浏览器的Canvas实现可能有差异
3. 需要考虑不同屏幕尺寸的适配

### 可访问性
1. 所有按钮都应该有适当的`aria-label`
2. 键盘操作应该有对应的提示
3. 需要支持屏幕阅读器

---

## 📝 测试清单

### 基础功能测试
- [ ] Canvas正常渲染
- [ ] 拖拽裁剪框正常工作
- [ ] 键盘快捷键正常响应
- [ ] 捕获功能正常工作
- [ ] 取消功能正常工作
- [ ] 尺寸标签正确显示

### 边界情况测试
- [ ] 裁剪框不能超出屏幕边界
- [ ] 在小屏幕上正常显示
- [ ] 在大屏幕上正常显示
- [ ] 在不同设备像素比下正常工作

### 交互测试
- [ ] 拖拽操作流畅无卡顿
- [ ] 按钮响应及时
- [ ] 动画效果平滑
- [ ] 键盘操作快捷准确

### 性能测试
- [ ] Canvas重绘性能良好
- [ ] 内存使用正常
- [ ] 无内存泄漏
- [ ] 事件监听器正确清理

---

## 🎯 下一步开发

### Phase 4 任务
1. 创建MarkdownRenderer组件
2. 创建CodeBlock组件
3. 创建LazyMermaid组件
4. 实现流式响应处理
5. 完善打字机效果
6. 添加表格横向滚动支持

### 文档需求
- 为每个新组件创建详细文档
- 更新依赖关系图
- 添加使用示例和最佳实践

---

**最后更新**: 2026-01-27
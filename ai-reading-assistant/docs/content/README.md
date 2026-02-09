# Content Scripts

## 📋 组件概述

**位置**: `src/content/`
**用途**: Content Scripts是注入到网页的脚本，提供浮动按钮、选词浮窗等功能

**组件列表**:
- `FloatingButton.tsx`: 浮动AI助手按钮
- `SelectionPopover.tsx`: 选中文本浮窗

---

## 🎯 核心功能

### 1. FloatingButton 组件

**功能概述**:
- 智能浮动按钮，提供AI助手的快速入口
- 支持鼠标悬停/点击/离开交互
- 自动隐藏/显示逻辑
- 智能边界检测和位置自适应

**核心功能**:

#### A. 智能显示/隐藏
- **滚动检测**: 当用户滚动超过100px时自动隐藏
- **视口检测**: 当用户接近页面底部时自动隐藏
- **5秒计时**: 不活动5秒后自动隐藏
- **手动显示**: 鼠标移动到FAB位置时显示

#### B. 交互状态管理
```typescript
const [state, setState] = useState<'idle' | 'hover' | 'active' | 'hidden'>('idle')
```

**状态说明**:
- `idle`: 默认状态，半透明显示
- `hover`: 鼠标悬停时，不透明并轻微上浮
- `active`: 点击时，显示为按下状态
- `hidden`: 隐藏状态，显示为小指示点

#### C. 位置自适应
- 自动计算视口边界
- 确保按钮不超出屏幕范围
- 支持不同屏幕尺寸
- 防止遮挡重要内容

#### D. 交互反馈
- 工具提示显示
- 点击动画效果
- 触觉反馈（震动动画模拟）

---

### 2. SelectionPopover 组件

**功能概述**:
- 智能划词浮窗，快速触发AI对话
- 自动检测文本选择（>20字符）
- 智能边界检测和定位算法

**核心功能**:

#### A. 文本选择检测
```typescript
useEffect(() => {
  const handleSelection = (e: MouseEvent) => {
    const selection = window.getSelection()
    const selectedText = selection?.toString() || ''
    
    if (selectedText.length > 20) {
      const rect = selection?.getRangeAt(0).getBoundingClientRect()
      if (rect) {
        // 显示浮窗
      }
    }
  }
  
  document.addEventListener('mouseup', handleSelection)
  return () => document.removeEventListener('mouseup', handleSelection)
}, [])
```

#### B. 智能定位算法
- **边界检测**: 检测四个方向的边界
- **多种显示模式**: 上下方/左侧/右侧优先
- **冲突处理**: 点击浮窗不取消选区
- **自动隐藏**: 8秒后自动隐藏

#### C. 冲突解决
```typescript
useEffect(() => {
  const handleMouseDown = (e: MouseEvent) => {
    // 检查点击是否在浮窗内部
    if (popoverRef.current && popoverRef.current.contains(e.target as Node)) {
      return // 不取消选区
    }
    setIsVisible(false) // 隐藏浮窗
  }
  
  document.addEventListener('mousedown', handleMouseDown)
  return () => document.removeEventListener('mousedown', handleMouseDown)
}, [popoverRef])
```

#### D. 上下文传递
```typescript
const handleAskAI = (text: string) => {
  // 发送CustomEvent到App组件
  const message = new CustomEvent('selection-text', {
    detail: { text }
  })
  window.dispatchEvent(message)
  onSelect(text) // 回调到父组件
}
```

---

## 🎨 UI设计

### Material Design 3 应用

**设计原则**:
- **Helpful**: 提供直观的帮助功能
- **Organic**: 自然的交互和动画
- **Rhythm**: 一致的视觉节奏和间距

**颜色方案**:
```css
--md3-primary: #6750A4 (主要操作色）
--md3-surface: #FEF7FF (背景色)
--md3-on-surface: #1D1B20 (文字色）
```

**动画效果**:
```css
.animate-slide-up: 滑入动画（300ms）
.animate-slide-down: 滑出动画（300ms）
.animate-pulse-soft: 脉冲动画（2s）
```

---

## 🔧 技术实现

### 事件处理

#### 鼠标事件
```typescript
const handleClick = (e: React.MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()
  onClick()
}

const handleMouseEnter = () => {
  setState('hover')
}

const handleMouseLeave = () => {
  setState('idle')
}
```

#### 键盘事件
- 支持`Enter`键快速发送消息
- 支持`Escape`键取消操作
- 支持`Shift+Enter`换行

---

## 🚀 性能优化

### 1. 事件委托
```typescript
// 在组件级别使用事件委托
// 减少事件监听器数量
// 提高性能
```

### 2. 内存管理
```typescript
useEffect(() => {
  return () => {
    // 清理定时器
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
    }
    // 清理事件监听器
    document.removeEventListener('mouseup', handleSelection)
    document.removeEventListener('mousedown', handleMouseDown)
  }
}, [])
```

---

## 📊 使用示例

### FloatingButton 使用
```typescript
<FloatingButton onClick={handleOpenSidePanel} />
```

**功能**:
1. 点击FAB按钮打开侧边栏
2. 鼠标悬停时显示工具提示
3. 滚动或5秒不活动后自动隐藏

### SelectionPopover 使用
```typescript
<SelectionPopover 
  text={selectionText} 
  onSelect={(text) => {
    openSidePanel()
    setContext(text)
  }} />
```

**功能**:
1. 自动检测选中的文本（>20字符）
2. 智能定位避免遮挡内容
3. 点击"Ask AI"按钮快速发送到侧边栏
4. 8秒后自动隐藏

---

## 📋 依赖关系

```
src/content/
├── FloatingButton.tsx    # 依赖 stores/AppContext
└── SelectionPopover.tsx   # 依赖 stores/AppContext

src/stores/
└── AppContext.tsx         # 提供全局状态管理

src/types/
└── index.ts             # 定义相关类型
```

---

## 🚨 注意事项

### 用户体验
1. FAB按钮应该不干扰正常阅读
2. 浮窗应该快速响应，但不要频繁弹出
3. 所有交互都应该有明确的视觉反馈
4. 支持键盘快捷键提升效率

### 性能考虑
1. 事件监听器应该在组件卸载时清理
2. 避免不必要的状态更新和重新渲染
3. 使用`useCallback`优化事件处理函数

### 可访问性
1. 所有按钮都应该有适当的`aria-label`
2. 支持键盘导航
3. 色彩对比度符合WCAG AA标准

---

## 📝 测试清单

### FloatingButton 测试
- [ ] 正常显示在页面右下角
- [ ] 鼠标悬停时显示工具提示
- [ ] 点击时正确触发回调
- [ ] 滚动超过100px时自动隐藏
- [ ] 5秒不活动后自动隐藏
- [ ] 在不同屏幕尺寸下正确定位

### SelectionPopover 测试
- [ ] 选中文本>20字符时显示浮窗
- [ ] 选中文本<=20字符时隐藏浮窗
- [ ] 浮窗智能定位不遮挡重要内容
- [ ] 点击浮窗外部时隐藏
- [ ] 点击"Ask AI"按钮正确传递选中文本
- [ ] 8秒后自动隐藏

---

## 🎯 下一步

### Phase 4 功能
- 这些Content Scripts将为Phase 4的聊天渲染提供基础的交互支持
- 完整的聊天界面和Markdown渲染将使用这些交互入口

### 测试重点
- 测试与Side Panel的集成
- 验证消息传递机制
- 测试在不同页面上的兼容性

---

**最后更新**: 2026-01-27
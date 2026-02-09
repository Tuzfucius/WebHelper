# Utils - Utility Functions

## 📋 概述

**位置**: `src/utils/`
**用途**: 存放项目中使用的工具函数，提供通用功能和辅助方法

---

## 🎯 核心工具函数

### 1. API Client Utils

#### testConnection 工具

**文件**: 待开发

**功能概述**:
- 测试OpenAI API连接
- 测试Anthropic API连接
- 测试Custom API连接
- 处理连接错误和状态更新

**使用示例**:
```typescript
// OpenAI连接测试
const testOpenAIConnection = async (apiKey: string): Promise<boolean> => {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    })
    
    return response.ok
  } catch (error) {
    console.error('OpenAI connection test failed:', error)
    return false
  }
}

// Anthropic连接测试
const testAnthropicConnection = async (apiKey: string): Promise<boolean> => {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [
          { role: 'user', content: 'Hello' }
        ]
      })
    })
    
    return response.ok || response.status === 400 // 400是预期的，表示API key有效但消息格式错误
  } catch (error) {
    console.error('Anthropic connection test failed:', error)
    return false
  }
}
```

---

### 2. Context Builder Utils

#### buildSystemPrompt 工具

**功能概述**:
- 构建AI系统提示词
- 组合用户查询和上下文信息
- 格式化输出结果

**使用示例**:
```typescript
import type { EnhancedContextData } from '@/types'

export const buildSystemPrompt = (context: EnhancedContextData): string => {
  const parts: string[] = []
  
  // 添加系统角色
  parts.push('[System] You are an AI reading assistant for academic content.')
  
  // 添加当前URL
  parts.push(`[Current URL] ${context.url}`)
  
  // 添加选中文本
  if (context.selectedText) {
    parts.push(`[Selected Text] ${context.selectedText}`)
  }
  
  // 添加截图信息
  if (context.screenshot) {
    const { imageData, rect } = context.screenshot
    parts.push(`[Screenshot included: ${imageData.length} chars, size: ${rect.width}x${rect.height}]`)
  }
  
  // 添加用户查询
  parts.push(`[User Query] ${context.query}`)
  
  return parts.join('\n\n')
}

// 使用示例
import { buildSystemPrompt } from '@/utils/contextBuilder'

const handleSendMessage = async (query: string, context: EnhancedContextData) => {
  const systemPrompt = buildSystemPrompt(context)
  // 发送到AI API
  const response = await callOpenAI(settings.apiKey, systemPrompt + '\n\n' + query)
  return response
}
```

---

### 3. Markdown Utils

#### detectCodeBlock 工具

**功能概述**:
- 检测文本是否为代码块
- 识别编程语言
- 提取代码内容

**使用示例**:
```typescript
export const detectCodeBlock = (text: string): boolean => {
  const codeBlockPattern = /```(\w+)?\n([\s\S]*\n)?[\s\S]*\n)*\n)/
  return codeBlockPattern.test(text)
}

export const detectLanguage = (code: string): string | null => {
  if (!code) return null
  
  const languagePatterns: {
    javascript: /\/\/.*|\/\*|\*\/|\*\*\//g,
    typescript: /interface | type | enum | class | /\/\/.*type/g,
    python: /import | from | class | def | /#.*type/g,
    java: /import | package | public | class | /\/\/.*type/g,
    ruby: /require | class | def | end | /#.*type/g
    css: /\.|:|@media|/g,
    html: /<!DOCTYPE|<html|<body|<div|<span|<p/,
    sql: /SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|CREATE|TABLE/gi,
    bash: /#!/|bash|if|then|fi|do|done|exit/g,
    go: /package|import|func|var|const|type|struct|interface/g,
    php: /<?php|class|function|echo|print|die|exit/g,
    swift: /import|class|func|var|let|struct|protocol/g,
    kotlin: /import|package|fun|val|var|class|object|companion/g,
    rust: /use|mod|fn|let|struct|impl|pub/g
    csharp: /using|class|struct|namespace|public|enum|delegate/g,
    cpp: /#include|class|struct|template|namespace|public|enum|using/g
    c: /#include|define|struct|union|enum|using/g
    'c++': /#include|class|struct|namespace|public|enum|using/g
  }
  
  for (const [language, pattern] of Object.entries(languagePatterns)) {
    if (pattern.test(code)) {
      return language
    }
  }
  
  return null
}

export const extractCode = (text: string): string => {
  const codeBlockPattern = /```(\w+)?\n([\s\S]*\n)?[\s\S]*\n)*\n)/
  const match = text.match(codeBlockPattern)
  if (!match || !match[1]) return ''
  
  return match[1].trim()
}
```

---

### 4. DOM Utils

#### safeQuerySelector 工具

**功能概述**:
- 安全的DOM查询选择器
- 避免XSS攻击
- 处理查询失败情况

**使用示例**:
```typescript
export const safeQuerySelector = (selector: string, element?: HTMLElement): HTMLElement | null => {
  try {
    if (element) {
      return element.querySelector(selector)
    }
    return document.querySelector(selector)
  } catch (error) {
    console.error('DOM query failed:', error)
    return null
  }
}

export const waitForElement = (selector: string, timeout: number = 5000): Promise<HTMLElement | null> => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()
    const element = safeQuerySelector(selector)
    
    const checkExistence = () => {
      if (element) {
        resolve(element)
        return
      }
      
      if (Date.now() - startTime > timeout) {
        reject(new Error(`Element ${selector} not found within ${timeout}ms`))
      } else {
        setTimeout(checkExistence, 100)
      }
    }
    
    checkExistence()
  })
}

export const removeElement = (element: HTMLElement): void => {
  if (element && element.parentNode) {
    element.parentNode.removeChild(element)
  }
}
```

#### createOverlay 工具

**功能概述**:
- 创建DOM覆盖层
- 处理层级和样式
- 添加移除功能

**使用示例**:
```typescript
export const createOverlay = (zIndex: number = 9999): HTMLDivElement => {
  const overlay = document.createElement('div')
  overlay.style.position = 'fixed'
  overlay.style.top = '0'
  overlay.style.left = '0'
  overlay.style.right = '0'
  overlay.style.bottom = '0'
  overlay.style.left = '0'
  overlay.style.width = '100%'
  overlay.style.height = '100%'
  overlay.style.zIndex = zIndex.toString()
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'
  overlay.style.pointerEvents = 'none'
  
  return overlay
}

export const removeOverlay = (overlay: HTMLDivElement): void => {
  if (overlay && overlay.parentNode) {
    overlay.parentNode.removeChild(overlay)
  }
}
```

---

### 5. Image Utils

#### dataURLtoBlob 工具

**功能概述**:
- 将Base64数据URL转换为Blob对象
- 优化大文件处理

**使用示例**:
```typescript
export const dataURLtoBlob = (dataURL: string): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    fetch(dataURL)
      .then(response => response.blob())
      .then(blob => resolve(blob))
      .catch(reject)
  })
}

export const resizeImage = async (dataURL: string, maxWidth: number, maxHeight: number): Promise<string> => {
  const blob = await dataURLtoBlob(dataURL)
  
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      
      const ratio = Math.min(maxWidth / img.width, maxHeight / img.height)
      canvas.width = img.width * ratio
      canvas.height = img.height * ratio
      
      ctx.drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/png', 0.8))
    }
    
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = dataURL
  })
}

export const blobToFile = (blob: Blob, filename: string): File => {
  return new File([blob], filename, { type: 'image/png' })
}
```

---

### 6. Storage Utils

#### secureStorage 工具

**功能概述**:
- 安全的存储操作
- 数据加密（可选）
- 错误处理

**使用示例**:
```typescript
export const getStorage = async (key: string): Promise<any> => {
  try {
    const result = await chrome.storage.local.get([key])
    return result[key]
  } catch (error) {
    console.error('Storage get failed:', error)
    return null
  }

export const setStorage = async (key: string, value: any): Promise<boolean> => {
  try {
    await chrome.storage.local.set({ [key]: value })
    console.log(`Storage set success: ${key}`)
    return true
  } catch (error) {
    console.error('Storage set failed:', error)
    return false
  }
}

export const removeStorage = async (key: string): Promise<boolean> => {
  try {
    await chrome.storage.local.remove([key])
    console.log(`Storage remove success: ${key}`)
    return true
  } catch (error) {
    console.error('Storage remove failed:', error)
    return false
  }
}
```

---

### 7. Validation Utils

#### validateApiKey 工具

**功能概述**:
- 验证API Key格式
- 检查密钥长度和字符
- 提供友好的错误消息

**使用示例**:
```typescript
export const validateApiKey = (apiKey: string): { isValid: boolean; error: string } => {
  const trimmedKey = apiKey.trim()
  
  if (!trimmedKey) {
    return { isValid: false, error: 'API key cannot be empty' }
  }
  
  if (trimmedKey.length < 10) {
    return { isValid: false, error: 'API key must be at least 10 characters' }
  }
  
  if (trimmedKey.length > 200) {
    return { isValid: false, error: 'API key cannot exceed 200 characters' }
  }
  
  return { isValid: true, error: '' }
}

export const validateBaseUrl = (baseUrl: string): { isValid: boolean; error: string } => {
  const trimmedUrl = baseUrl.trim()
  
  if (!trimmedUrl) {
    return { isValid: false, error: 'Base URL cannot be empty' }
  }
  
  try {
    const url = new URL(trimmedUrl)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return { isValid: false, error: 'Base URL must use HTTP or HTTPS' }
    }
    
    if (url.pathname && url.pathname.length > 1000) {
      return { isValid: false, error: 'Base URL path is too long' }
    }
    
    return { isValid: true, error: '' }
  } catch (error) {
    return { isValid: true, error: 'Invalid Base URL format' }
  }
}

export const validateURL = (url: string): { isValid: boolean; error: string } => {
  try {
    const urlObj = new URL(url)
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch (error) {
    return { isValid: false, error: 'Invalid URL format' }
  }
}

export const validateEmail = (email: string): { isValid: boolean; error: string } => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const isValid = emailRegex.test(email)
  return { isValid, error: isValid ? '' : 'Invalid email format' }
}
```

---

## 🎨 工具函数设计模式

### 设计原则

1. **单一职责**: 每个函数只负责一个明确的功能
2. **输入验证**: 所有外部输入都要验证
3. **错误处理**: 统一的错误处理模式
4. **性能优化**: 避免重复计算和DOM操作
5. **可测试性**: 函数易于独立测试
6. **文档化**: 复杂函数需要详细的JSDoc注释

### 错误处理模式

```typescript
export class AppError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'AppError'
    this.code = code
  }
}

export const handleError = (error: unknown): void => {
  if (error instanceof AppError) {
    console.error(`[${error.code}] ${error.message}`)
  } else if (error instanceof Error) {
    console.error(error.message)
  } else {
    console.error('Unknown error:', error)
  }
}
```

---

## 📊 文件结构

```
src/utils/
├── api.ts           # API相关工具函数（待开发）
├── context.ts       # 上下文构建工具（待开发）
├── markdown.ts     # Markdown处理工具（待开发）
├── dom.ts          # DOM操作工具（待开发）
├── image.ts        # 图片处理工具（待开发）
├── storage.ts       # 存储工具（待开发）
└── validation.ts   # 验证工具（待开发）
```

---

## 🚀 使用指南

### 1. 在组件中使用工具函数

```typescript
import { validateApiKey } from '@/utils/validation'

function SettingsPage() {
  const [apiKey, setApiKey] = useState('')
  
  const handleSave = () => {
    const { isValid, error } = validateApiKey(apiKey)
    if (!isValid) {
      alert(error)
      return
    }
    
    saveToStorage('apiKey', apiKey)
  }
}
```

### 2. 在Hook中使用工具函数

```typescript
import { buildSystemPrompt } from '@/utils/context'
import { callOpenAI } from '@/utils/api'

function useChat() {
  const { settings } = useSettings()
  const { addMessage } = useMessages()
  
  const handleSend = async () => {
    const prompt = buildSystemPrompt(context)
    const response = await callOpenAI(settings.apiKey, prompt)
    addMessage({
      role: 'assistant',
      content: response.choices[0].message.content
    })
  }
}
```

---

## ⚠️ 注意事项

### 性能优化
1. **缓存结果**: 对重复的操作结果进行缓存
2. **惰性计算**: 只在需要时执行计算
3. **避免重复查询**: 优化DOM操作和API调用

### 安全考虑
1. **输入验证**: 所有用户输入都要验证
2. **XSS防护**: 使用安全的DOM操作方法
3. **数据清理**: 及时清理敏感数据和临时对象

### 可维护性
1. **函数分组**: 相关功能函数放在同一文件中
2. **命名规范**: 使用一致的命名约定
3. **注释完整**: 复杂函数需要详细的JSDoc注释

---

## 📝 测试清单

### 单元测试
- [ ] validateApiKey工具测试
- [ ] validateBaseUrl工具测试
- [ ] validateURL工具测试
- [ ] safeQuerySelector工具测试

### 集成测试
- [ ] 工具函数与组件集成测试
- [ ] 错误处理机制测试
- [ ] 存储功能测试

---

## 🎯 下一步开发

### 优先级1 (核心功能)
- [x] API Client Utils: 实现完整的API调用逻辑
- [x] Context Builder Utils: 完善系统提示词构建
- [ ] Storage Utils: 实现本地存储管理
- [ ] Validation Utils: 完善所有验证函数

### 优先级2 (增强功能)
- [ ] Markdown Utils: 实现代码检测和语法高亮
- [ ] Image Utils: 实现图片处理功能
- [ ] DOM Utils: 实现DOM操作辅助函数

### 优先级3 (可选功能)
- [ ] 实现数据缓存机制
- [ ] 添加性能监控工具
- [ ] 实现国际化支持

---

## 📋 相关文件

- `src/stores/AppContext.tsx`: 使用验证工具
- `src/hooks/useConnectionTester.ts`: 使用API工具
- `src/sidepanel/SettingsPage.tsx`: 使用验证工具
- `src/content/FloatingButton.tsx`: 基础组件
- `src/content/SelectionPopover.tsx`: 基础组件

---

**最后更新**: 2026-01-27
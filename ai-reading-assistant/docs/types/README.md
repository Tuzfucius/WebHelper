# Types - Type Definitions

## 📋 概述

**位置**: `src/types/`
**用途**: 定义项目中使用的所有TypeScript类型接口，确保类型安全

---

## 🎯 核心类型定义

### 1. Settings Type

```typescript
export interface Settings {
  provider: 'openai' | 'anthropic' | 'custom'
  apiKey: string
  baseUrl: string
  selectedUrls: string[]
}
```

**用途**: 存储用户API配置信息

**字段说明**:
- `provider`: AI提供商选择
- `apiKey`: API密钥（加密存储）
- `baseUrl`: 自定义API端点（Custom provider时使用）
- `selectedUrls`: URL白名单列表

---

### 2. Message Type

```typescript
export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}
```

**用途**: 聊天消息数据结构

**字段说明**:
- `id`: 消息唯一标识
- `role`: 消息角色（用户或AI助手）
- `content`: 消息内容（支持Markdown格式）
- `timestamp`: ISO格式时间戳

---

### 3. ConnectionStatus Type

```typescript
export interface ConnectionStatus {
  state: 'idle' | 'testing' | 'connected' | 'error'
  error?: string
}
```

**用途**: API连接状态管理

**字段说明**:
- `state`: 当前连接状态
  - `idle`: 空闲，未测试
  - `testing`: 测试中
  - `connected`: 连接成功
  - `error`: 连接失败
- `error`: 错误信息（state为error时有值）

---

### 4. APIResponse Type

```typescript
export interface APIResponse {
  choices: Array<{
    message: {
      role: string
      content: string
    }
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}
```

**用途**: OpenAI API响应格式

**字段说明**:
- `choices`: AI生成的内容选项数组
- `message`: 消息对象
  - `role`: 消息角色
  - `content`: 消息内容
- `usage`: Token使用情况（可选）

---

### 5. ContextData Type

```typescript
export interface ContextData {
  url: string
  selectedText?: string
  screenshot?: string
  query: string
}
```

**用途**: 传递给AI的上下文数据

**字段说明**:
- `url`: 当前网页URL
- `selectedText`: 用户选中的文本
- `screenshot`: 截图的Base64数据字符串
- `query`: 用户的查询内容

---

### 6. ScreenshotData Type

```typescript
export interface ScreenshotData {
  imageData: string
  rect: {
    x: number
    y: number
    width: number
    height: number
  }
}
```

**用途**: 截图数据结构

**字段说明**:
- `imageData`: 图片Base64数据
- `rect`: 截图位置和尺寸
  - `x`: 裁剪区域左上角X坐标
  - `y`: 裁剪区域左上角Y坐标
  - `width`: 裁剪区域宽度
  - `height`: 裁剪区域高度

---

### 7. TestConnectionResult Type

```typescript
export interface TestConnectionResult {
  success: boolean
  error?: string
}
```

**用途**: API连接测试结果

**字段说明**:
- `success`: 测试是否成功
- `error`: 失败时的错误信息

---

### 8. EnhancedContextData Type

```typescript
export interface EnhancedContextData {
  url: string
  selectedText?: string
  screenshot?: ScreenshotData
  query: string
}
```

**用途**: 增强的上下文数据（包含结构化截图数据）

**字段说明**:
- 继承ContextData的所有字段
- `screenshot`: 改为ScreenshotData类型，包含完整的截图信息

---

## 🔧 TypeScript配置

### 类型安全设置

```typescript
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noImplicitAny": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
    "allowSyntheticDefaultImports": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

## 📊 类型依赖关系

```
src/types/
├── index.ts           # 核心类型定义（主要使用）
├── chrome.d.ts         # Chrome API类型扩展
```

---

## 🎨 设计模式

### 类型设计原则

1. **单一职责**: 每个Type只负责一个特定的数据结构
2. **类型安全**: 避免使用`any`，明确所有字段类型
3. **可扩展性**: 使用接口而非具体类型，便于扩展
4. **文档化**: 为复杂类型添加JSDoc注释
5. **一致性**: 字段命名保持一致性和可读性

### 类型使用指南

#### Settings类型使用
```typescript
// 设置用户配置
const updateSettings: Partial<Settings> = {
  apiKey: 'sk-xxxxxxxxxxxx',
  provider: 'openai'
  baseUrl: 'https://api.example.com'
}

// 检查设置
if (settings.baseUrl) {
  // Custom provider需要baseUrl
  console.log('Using custom API endpoint')
}
```

#### Message类型使用
```typescript
// 创建用户消息
const userMessage: Message = {
  id: Date.now().toString(),
  role: 'user',
  content: 'Hello, AI!',
  timestamp: new Date().toISOString()
}

// 创建AI响应消息
const assistantMessage: Message = {
  id: (Date.now() + 1).toString(),
  role: 'assistant',
  content: 'Hello! How can I help you?',
  timestamp: new Date().toISOString()
}
```

---

## 🚀 使用场景

### 1. 设置管理

#### A. 保存设置到Chrome Storage
```typescript
const saveSettings = async (settings: Settings) => {
  try {
    await chrome.storage.local.set({ settings })
    console.log('Settings saved successfully')
  } catch (error) {
    console.error('Failed to save settings:', error)
  }
}

const loadSettings = async (): Promise<Settings> => {
  try {
    const result = await chrome.storage.local.get(['settings'])
    return result.settings || {
      provider: 'openai',
      apiKey: '',
      baseUrl: '',
      selectedUrls: []
    }
  } catch (error) {
    console.error('Failed to load settings:', error)
    throw error
  }
}
```

#### B. 初始化默认设置
```typescript
const initializeSettings = async () => {
  const existingSettings = await loadSettings()
  if (!existingSettings) {
    const defaultSettings: Settings = {
      provider: 'openai',
      apiKey: '',
      baseUrl: '',
      selectedUrls: []
    }
    await saveSettings(defaultSettings)
  }
}
```

### 2. 消息管理

#### A. 添加消息到历史
```typescript
const addMessageToHistory = (message: Message) => {
  const history = await loadMessageHistory()
  const newHistory = [...history, message]
  await saveMessageHistory(newHistory)
}

const loadMessageHistory = async (): Promise<Message[]> => {
  try {
    const result = await chrome.storage.local.get(['messageHistory'])
    return result.messageHistory || []
  } catch (error) {
    console.error('Failed to load message history:', error)
    return []
  }
}

const saveMessageHistory = async (history: Message[]) => {
  try {
    await chrome.storage.local.set({ messageHistory: history })
  } catch (error) {
    console.error('Failed to save message history:', error)
  }
}
```

#### B. 清空消息历史
```typescript
const clearMessageHistory = async () => {
  try {
    await chrome.storage.local.set({ messageHistory: [] })
    console.log('Message history cleared')
  } catch (error) {
    console.error('Failed to clear message history:', error)
  }
}
```

### 3. API集成

#### A. OpenAI API调用
```typescript
const callOpenAI = async (apiKey: string, prompt: string) => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1000,
      temperature: 0.7
    })
  })
  
  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`)
  }
  
  return await response.json()
}
```

#### B. Anthropic API调用
```typescript
const callAnthropic = async (apiKey: string, prompt: string) => {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      messages: [
        { role: 'user', content: prompt }
      ]
    })
  })
  
  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status}`)
  }
  
  return await response.json()
}
```

#### C. Custom API调用
```typescript
const callCustomAPI = async (baseUrl: string, apiKey: string, prompt: string) => {
  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'custom-model',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1000
    })
  })
  
  if (!response.ok) {
    throw new Error(`Custom API error: ${response.status}`)
  }
  
  return await response.json()
}
```

---

## 📋 文件结构

```
src/types/
├── index.ts           # 核心类型定义（主要使用）
└── chrome.d.ts         # Chrome API类型扩展
```

---

## 🚀 性能优化

### 类型安全最佳实践

1. **避免重复定义**: 使用`export`和`import`，避免循环依赖
2. **使用接口**: 优先使用interface而非type
3. **明确可选字段**: 使用`?`标记可选字段
4. **类型推断**: 让TypeScript自动推断复杂类型
5. **类型守卫**: 使用类型守卫确保类型安全

### 代码示例

```typescript
// 类型守卫示例
function isScreenshotData(data: any): data is ScreenshotData {
  return data.imageData !== undefined && typeof data.rect === 'object'
}

// 可选字段检查
function validateSettings(settings: Settings): void {
  if (settings.provider === 'custom' && !settings.baseUrl) {
    throw new Error('Custom provider requires base URL')
  }
}

// 类型断言
const assertMessage = (message: Message): void => {
  if (message.role === 'user') {
    console.log('Message is from user:', message.content)
  }
}
```

---

## ⚠️ 注意事项

### 类型维护
1. **一致性**: 保持类型命名和结构的一致性
2. **文档化**: 为复杂类型添加详细的JSDoc注释
3. **测试**: 为新类型添加单元测试
4. **审查**: 定期review类型定义，移除未使用的类型
5. **复用**: 优先使用现有类型，避免重复定义

### Chrome API类型
```typescript
// src/types/chrome.d.ts中定义Chrome扩展API类型
// 确保所有Chrome API调用都有正确的类型支持
```

---

## 🎯 相关文件

- `src/stores/AppContext.tsx`: 使用Settings类型
- `src/hooks/useConnectionTester.ts`: 使用ConnectionStatus类型
- `src/sidepanel/sidebarPanel.tsx`: 使用多个类型
- `src/components/ScreenshotCropper.tsx`: 使用ScreenshotData类型
- `src/content/FloatingButton.tsx`: 基础React组件
- `src/content/SelectionPopover.tsx`: 基础React组件

---

**最后更新**: 2026-01-27
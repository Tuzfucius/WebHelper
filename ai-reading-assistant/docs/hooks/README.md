# Custom Hooks

## 📋 概述

**位置**: `src/hooks/`
**用途**: 存放项目中自定义的React Hooks，提供特定的状态管理和业务逻辑

---

## 🎯 当前Hooks列表

### 1. useConnectionTester Hook

**文件**: `src/hooks/useConnectionTester.ts`
**状态**: 
```typescript
const [isTesting, setIsTesting] = useState(false)
const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ state: 'idle' })
```

**核心功能**:
- OpenAI连接测试
- Anthropic连接测试
- Custom API连接测试
- 连接状态管理

**返回值**:
```typescript
{
  isTesting: boolean
  connectionStatus: ConnectionStatus
  testConnection: (provider, apiKey, baseUrl?) => Promise<TestConnectionResult>
}
```

**使用示例**:
```typescript
const { isTesting, testConnection } = useConnectionTester()

const handleTest = async () => {
  setIsTesting(true)
  const result = await testConnection('openai', apiKey)
  // 处理结果...
}
```

---

### 2. 待开发的Hooks

#### useMarkdownParser Hook (待开发)
**功能**: Markdown解析和渲染逻辑
**用途**: 为Phase 4的聊天渲染提供Markdown支持

#### useStreamingResponse Hook (待开发)
**功能**: 处理AI的流式响应
**用途**: 实现打字机效果和实时滚动

#### useScreenshotManager Hook (待开发)
**功能**: 管理截图功能的状态
**用途**: 为截图功能提供状态管理和清理逻辑

---

## 🔧 技术实现

### 当前Hook的架构

**状态管理**:
- 使用React Hooks进行本地状态管理
- 与全局AppContext配合使用
- 提供特定领域的状态管理

**API集成**:
- OpenAI API调用逻辑
- Anthropic API调用逻辑
- 连接测试和错误处理

**类型安全**:
- 所有函数都有明确的输入和输出类型
- 使用TypeScript接口定义参数类型

---

## 🚀 使用指南

### 1. Connection Tester Hook

```typescript
// 在SettingsPage中使用
import { useConnectionTester } from '@/hooks/useConnectionTester'

function SettingsPage() {
  const { isTesting, testConnection } = useConnectionTester()
  
  return (
    <div>
      <button onClick={testConnection}>
        {isTesting ? 'Testing...' : 'Test Connection'}
      </button>
    </div>
  )
}
```

### 2. 创建自定义Hook

```typescript
// 示例：创建一个hook来管理本地状态
import { useState, useCallback } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue)
  
  useEffect(() => {
    const item = localStorage.getItem(key)
    if (item) {
      setValue(JSON.parse(item))
    }
  }, [key])
  
  const updateValue = useCallback((newValue: T) => {
    setValue(newValue)
    localStorage.setItem(key, JSON.stringify(newValue))
  }, [])
  
  return [value, updateValue]
}
```

---

## 📊 依赖关系

```
src/hooks/
├── useConnectionTester.ts      # 连接测试Hook（已实现）
├── useLocalStorage.ts           # 本地存储Hook（待创建）
├── useMarkdownParser.ts       # Markdown解析Hook（待创建）
├── useStreamingResponse.ts    # 流式响应Hook（待创建）
└── useScreenshotManager.ts    # 截图管理Hook（待创建）
```

**外部依赖**:
- React Hooks
- src/types/index.ts (类型定义)
- src/stores/AppContext.tsx (全局状态)

---

## 🎨 设计模式

### 自定义Hook的设计原则

1. **单一职责**: 每个Hook只负责一个特定的功能领域
2. **可测试性**: Hook的逻辑应该易于独立测试
3. **性能优化**: 使用`useCallback`和`useMemo`优化性能
4. **类型安全**: 所有函数都有明确的类型定义
5. **可复用性**: Hook设计为可跨项目复用

---

## ⚠️ 注意事项

### 状态管理
- 全局状态应该使用AppContext，不要在自定义Hook中重复管理
- 自定义Hook应该只管理本地状态或特定业务逻辑
- Hook之间的状态同步应该通过事件或props传递

### 性能考虑
- 避免在Hook中进行复杂的计算
- 使用依赖数组的正确性来避免不必要的重渲染
- 适时清理副作用（useEffect的返回函数）

### 测试支持
- Hook应该易于单元测试
- 提供清晰的输入输出契约
- 避免依赖外部全局状态

---

## 🚀 下一步开发

### 1. 创建本地存储Hook
```bash
# 创建 useLocalStorage.ts
# 提供通用的本地存储功能
```

### 2. 创建Markdown解析Hook
```bash
# 创建 useMarkdownParser.ts
# 为Phase 4提供Markdown渲染支持
```

### 3. 创建流式响应Hook
```bash
# 创建 useStreamingResponse.ts
# 实现打字机效果和流式响应处理
```

### 4. 创建截图管理Hook
```bash
# 创建 useScreenshotManager.ts
# 管理截图功能的状态和清理逻辑
```

---

## 📝 维护指南

### 添加新功能
1. 在本文件添加新Hook的文档
2. 创建对应的Hook实现文件
3. 更新依赖关系图

### 修改现有功能
1. 在对应Hook文件中修改实现
2. 更新本文档说明变更
3. 确保所有使用到该Hook的组件都正常工作

### 删除功能
1. 在使用该Hook的所有组件中移除引用
2. 删除Hook实现文件
3. 更新本文档标记为已删除

---

## 🎯 功能优先级

### 高优先级 (核心功能)
- ✅ useConnectionTester: 连接测试（已实现）
- 🚧 useLocalStorage: 本地存储管理
- 🚧 useStreamingResponse: 流式响应处理

### 中优先级 (增强功能)
- 🚧 useMarkdownParser: Markdown解析
- 🚧 useScreenshotManager: 截图管理

### 低优先级 (可选功能)
- 🚧 useDebounce: 防抖处理
- 🚧 useThrottle: 节流处理
- 🚧 useKeyboardShortcuts: 键盘快捷键

---

## 📊 性能指标

### 当前状态
- 已实现Hooks: 1个 (useConnectionTester)
- 待开发Hooks: 4个
- 代码覆盖率: 未测量

### 目标指标
- Hook重用率: > 60%
- 平均Hook复杂度: 中等
- 测试覆盖率: 目标 > 80%

---

**最后更新**: 2026-01-27
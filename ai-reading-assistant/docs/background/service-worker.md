# Background Service Worker

## 📋 组件概述

**位置**: `src/background/service-worker.ts`
**用途**: Chrome扩展的后台服务工作进程，处理扩展的全局事件和状态

---

## 🎯 核心功能

### 1. 扩展生命周期管理

**安装监听**:
```typescript
chrome.runtime.onInstalled.addListener((details) => {
  console.log('AI Reading Assistant installed:', details)
  
  // 初始化默认设置
  chrome.storage.local.set({
    settings: {
      provider: 'openai',
      apiKey: '',
      baseUrl: '',
      selectedUrls: []
    }
  })
})
```

**功能描述**:
- 扩展首次安装时自动初始化默认设置
- 记录安装日志用于调试
- 确保用户在首次打开时有可用的设置

---

### 2. 消息传递机制

**支持的消息类型**:
- `'open-sidepanel'`: 打开侧边栏
- `'get-tab-info'`: 获取当前标签页信息

**消息处理**:
```typescript
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received in service worker:', message)
  
  switch (message.type) {
    case 'open-sidepanel':
      chrome.sidePanel.open({ windowId: sender.tab?.windowId })
      sendResponse({ success: true })
      break
      
    case 'get-tab-info':
      sendResponse({
        url: sender.tab?.url || '',
        title: sender.tab?.title || ''
      })
      break
      
    default:
      sendResponse({ success: false, error: 'Unknown message type' })
  }
  
  return true // 表示异步响应
})
```

**功能描述**:
- 监听来自content scripts和side panel的消息
- 提供打开侧边栏的功能
- 提供获取当前标签页信息的功能
- 支持异步消息响应

---

### 3. Service Worker保持活跃

**活跃状态维持**:
```typescript
// 防止Service Worker被Chrome终止
self.addEventListener('activate', () => {
  console.log('Service Worker activated')
})
```

**功能描述**:
- 监听activate事件
- 维持Service Worker的活跃状态
- 提供调试日志

---

## 🔧 技术实现

### 事件类型

```typescript
// 支持的消息类型
type ExtensionMessage =
  | { type: 'open-sidepanel' }
  | { type: 'get-tab-info' }
  | { type: 'test-connection' }

// 响应类型
type ExtensionResponse =
  | { success: true }
  | { success: false; error: string }
  | { url: string; title: string }
```

### Chrome API使用

**权限声明** (manifest.json):
```json
{
  "permissions": [
    "storage",
    "sidePanel", 
    "activeTab",
    "scripting"
  ],
  "background": {
    "service_worker": "background.js"
  }
}
```

**使用的API**:
- `chrome.runtime`: 消息传递和生命周期事件
- `chrome.storage`: 设置数据持久化
- `chrome.sidePanel`: 侧边栏控制
- `chrome.tabs`: 标签页信息获取

---

## 🚀 使用示例

### Content Script调用示例

```typescript
// 在Content Script中调用Service Worker
const openSidePanel = () => {
  chrome.runtime.sendMessage(
    { type: 'open-sidepanel' },
    (response) => {
      if (response.success) {
        console.log('Side panel opened successfully')
      }
    }
  )
}

const getTabInfo = () => {
  chrome.runtime.sendMessage(
    { type: 'get-tab-info' },
    (response) => {
      console.log('Current URL:', response.url)
      console.log('Current title:', response.title)
    }
  )
}
```

### Side Panel调用示例

```typescript
// 在Side Panel中调用Service Worker
const openSidePanelFromPanel = () => {
  chrome.runtime.sendMessage(
    { type: 'open-sidepanel' },
    (response) => {
      if (response.success) {
        console.log('Side panel opened successfully')
      }
    }
  )
}
```

---

## 📊 文件结构

```
src/background/
└── service-worker.ts    # Service Worker主文件
```

---

## ⚠️ 注意事项

### 性能优化
- 避免在消息监听器中进行复杂计算
- 尽快地返回响应，避免阻塞发送者
- 使用异步处理，不要在主线程中执行耗时操作

### 错误处理
- 所有可能出错的API调用都要有try-catch块
- 为消息提供明确的错误信息
- 避免抛出未捕获的异常

### 调试支持
- 使用`console.log`记录重要事件
- 在开发阶段添加详细的调试信息
- 生产环境中可以移除或减少日志

### 权限管理
- 只请求必要的权限
- 通过manifest.json明确声明权限需求
- 遵循最小权限原则

---

## 🎨 设计原则

### 代码风格
- 使用清晰的函数命名
- 添加详细的注释说明复杂逻辑
- 保持一致的代码格式

### 可维护性
- 将相关功能分组到独立的函数中
- 添加类型定义确保类型安全
- 避免硬编码，使用常量配置

---

## 📋 功能清单

### ✅ 已实现功能
- [x] 扩展安装事件监听
- [x] 默认设置初始化
- [x] 消息传递机制
- [x] 侧边栏打开功能
- [x] 标签页信息获取
- [x] Service Worker活跃状态维持

### 🚧 待优化功能
- [ ] 更详细的错误处理
- [ ] 添加连接状态管理
- [ ] 支持消息队列
- [ ] 添加调试模式开关

---

## 🚀 开发指南

### 添加新功能步骤

1. 在`service-worker.ts`中添加新的消息类型处理
2. 更新`src/types/index.ts`中的消息类型定义
3. 在`src/types/chrome.d.ts`中添加Chrome API类型
4. 更新`manifest.json`中的权限配置
5. 在相关组件中测试新功能

### 调试技巧

1. 打开Chrome扩展管理页面
2. 切换到Service Worker视图查看日志
3. 使用Chrome DevTools进行断点调试
4. 检查chrome.storage中的数据状态

---

## 📝 相关文件

- `src/stores/AppContext.tsx`: 使用Settings状态
- `src/types/index.ts`: 定义Settings类型
- `public/manifest.json`: 权限配置

---

**最后更新**: 2026-01-27
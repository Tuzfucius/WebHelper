export interface APIConfig {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'custom';
  protocol: 'openai' | 'anthropic';
  apiKey: string;
  baseUrl: string;
  modelName: string;
  customHeaders: Record<string, string>;
  temperature?: number;
  maxTokens?: number;
}

export interface MCPServerConfig {
  id: string;
  name: string;
  url: string;         // HTTP(S) 端点
  enabled: boolean;
  tools?: MCPTool[];   // 从服务器拉取的工具列表
  lastConnected?: string;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

export interface Settings {
  provider: 'openai' | 'anthropic' | 'custom';
  protocol: 'openai' | 'anthropic';
  apiKey: string;
  baseUrl: string;
  modelName: string;
  customHeaders: Record<string, string>;
  selectedUrls: string[];
  contextLength: number;
  prompts: PromptTemplate[];
  activePromptId: string;
  theme?: 'light' | 'dark' | 'system';
  language: 'en' | 'zh';
  temperature?: number;
  maxTokens?: number;
  incognitoMode: boolean;
  apiConfigs: APIConfig[];
  activeConfigId: string;
  shortcuts: {
    sendMessage: string;
  };
  mcpServers: MCPServerConfig[];
  maxPageContentLength: number; // 页面内容截断长度
}

export interface HistoryItem {
  id: string;
  url: string;
  title: string;
  timestamp: string;
}

export interface ReadingStats {
  date: string; // YYYY-MM-DD
  minutes: number;
  articles: number;
}

export interface ComplexityStats {
  subject: string;
  A: number;
  fullMark: number;
}

export interface PromptTemplate {
  id: string;
  name: string;
  content: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string | any[]; // Support for multimodal content
  tool_calls?: any[]; // For assistant messages
  tool_call_id?: string; // For tool messages
  name?: string; // For tool messages
  timestamp: string;
}

export interface APIResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    }
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ConnectionStatus {
  state: 'idle' | 'testing' | 'connected' | 'error';
  error?: string;
}

export interface ContextData {
  url: string;
  selectedText?: string;
  screenshot?: string;
  query: string;
}

export interface ScreenshotData {
  imageData: string;
  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface EnhancedContextData {
  url: string;
  selectedText?: string;
  screenshot?: ScreenshotData;
  query: string;
}

export interface ComplexityMetrics {
  vocabulary: number;
  sentence: number;
  density: number;
  abstract: number;
  wordCount?: number;
  wpm?: number;
}

// 数据导出/导入格式
export interface ExportData {
  version: string;
  exportedAt: string;
  settings: Partial<Settings>;
  chatHistory: Message[];
  readingHistory: HistoryItem[];
  readingStats: ReadingStats[];
}
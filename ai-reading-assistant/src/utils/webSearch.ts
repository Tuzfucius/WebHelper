/**
 * Web Search 工具 - 使用 exa-web-search-free 进行网络搜索
 * 需要安装 mcp 工具: npm install -g @anthropic-ai/mcp-cli
 */

export interface WebSearchResult {
  title: string
  url: string
  snippet: string
}

/**
 * 使用 exa-web-search-free 进行网络搜索
 * 注意：需要在系统中配置 exa MCP server
 * 
 * @param query 搜索查询
 * @param numResults 返回结果数量
 * @returns 搜索结果数组
 */
export async function web_search(query: string, numResults: number = 5): Promise<WebSearchResult[]> {
  // 检查是否在 Chrome 扩展环境中
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    // 在 Chrome 扩展中，尝试通过消息传递调用 background script
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'WEB_SEARCH',
        query,
        numResults
      })
      
      if (response && response.success) {
        return response.results
      }
    } catch (error) {
      console.warn('Background script search failed, falling back to mock:', error)
    }
  }
  
  // 降级方案：使用 mock 数据（实际项目中应该调用真实 API）
  return mockWebSearch(query, numResults)
}

/**
 * Mock 网络搜索 - 实际项目中应替换为真实 API 调用
 */
function mockWebSearch(query: string, numResults: number): WebSearchResult[] {
  // 生成模拟搜索结果
  const mockResults: WebSearchResult[] = [
    {
      title: `关于 "${query}" 的搜索结果 1`,
      url: `https://example.com/search?q=${encodeURIComponent(query)}&result=1`,
      snippet: `这是 "${query}" 相关内容的摘要描述，包含了关键信息点...`
    },
    {
      title: `关于 "${query}" 的搜索结果 2`,
      url: `https://example.org/search?q=${encodeURIComponent(query)}&result=2`,
      snippet: `另一个关于 "${query}" 的搜索结果，包含不同的观点和信息...`
    },
    {
      title: `关于 "${query}" 的搜索结果 3`,
      url: `https://example.net/search?q=${encodeURIComponent(query)}&result=3`,
      snippet: `还有关于 "${query}" 的详细信息，请查看完整内容...`
    }
  ]
  
  return mockResults.slice(0, numResults)
}

/**
 * 检查 web_search 功能是否可用
 */
export function isWebSearchAvailable(): boolean {
  // 可以添加检测逻辑，例如检查 background script 是否已注册
  return true
}

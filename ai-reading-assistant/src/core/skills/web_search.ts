/**
 * Web Search Skill - 使用 exa-web-search-free 进行网络搜索
 */
import { skillManager } from './base'
import { web_search } from '../../utils/webSearch'

skillManager.registerSkill({
  name: 'web_search',
  description: '使用网络搜索引擎查找最新信息。支持中英文搜索，返回标题、URL和摘要。',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: '搜索查询关键词，建议使用英文以获得更好的结果'
      },
      numResults: {
        type: 'number',
        description: '返回结果数量，默认为 5',
        default: 5
      }
    },
    required: ['query']
  },
  execute: async ({ query, numResults = 5 }) => {
    try {
      const results = await web_search(query, numResults)
      return {
        success: true,
        query,
        results: results.map(r => ({
          title: r.title,
          url: r.url,
          snippet: r.snippet
        })),
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        query
      }
    }
  }
})

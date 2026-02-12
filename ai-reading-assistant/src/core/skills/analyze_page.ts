/**
 * 页面分析 Skill - 通过消息通信提取和分析页面内容
 * 注意：此 Skill 通过 chrome.tabs.sendMessage 与 content script 通信,
 * 而非直接导入 contentAnalyzer（后者依赖 DOM API，仅在 content script 中可用）
 */
import { skillManager } from './base'

skillManager.registerSkill({
  name: 'analyze_page',
  description: '分析当前页面的内容，提取标题、正文、摘要，并计算可读性指标。适用于学术论文、新闻文章等长文本。',
  parameters: {
    type: 'object' as const,
    properties: {
      maxLength: {
        type: 'number',
        description: '内容最大长度（字符数），默认50000'
      }
    }
  },
  execute: async (args: { maxLength?: number }) => {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
      if (!tabs[0]?.id) {
        return { success: false, error: '无法找到当前活动标签页' }
      }

      // 通过消息通信获取页面内容
      const content = await chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_PAGE_CONTENT' })

      if (!content) {
        return { success: false, error: '无法提取页面内容（content script 未就绪）' }
      }

      const maxLen = args.maxLength || 50000
      const truncatedContent = content.content?.substring(0, maxLen) || ''

      // 基础可读性分析（在 sidepanel 中进行，不依赖 DOM）
      const wordCount = truncatedContent.split(/\s+/).filter(Boolean).length
      const sentences = truncatedContent.split(/[。！？.!?]+/).filter(Boolean)
      const sentenceCount = sentences.length
      const avgWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0

      let readabilityLevel: string
      if (avgWordsPerSentence <= 15) readabilityLevel = '简单'
      else if (avgWordsPerSentence <= 25) readabilityLevel = '中等'
      else readabilityLevel = '较难'

      return {
        success: true,
        title: content.title || '',
        excerpt: truncatedContent.substring(0, 300),
        wordCount,
        sentenceCount,
        avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
        readabilityLevel,
        contentPreview: truncatedContent.substring(0, 2000),
        stats: content.stats || null
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '页面分析失败'
      }
    }
  }
})

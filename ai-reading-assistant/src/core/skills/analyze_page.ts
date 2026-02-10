/**
 * 页面分析 Skill - 提取和分析页面内容
 */
import { skillManager, Skill } from './base'
import { extractPageContent, analyzeReadability } from '../../utils/contentAnalyzer'

skillManager.registerSkill({
  name: 'analyze_page',
  description: '分析当前页面的内容，提取标题、正文、摘要，并计算可读性指标。适用于学术论文、新闻文章等长文本。',
  parameters: {
    type: 'object',
    properties: {
      extractImages: {
        type: 'boolean',
        description: '是否提取图片Alt文本',
        default: false
      },
      maxLength: {
        type: 'number',
        description: '最大提取字符数',
        default: 50000
      }
    }
  },
  execute: async ({ extractImages = false, maxLength = 50000 }) => {
    try {
      const content = extractPageContent({ 
        extractImages, 
        maxLength 
      })
      
      const readability = analyzeReadability(content.content)
      
      return {
        success: true,
        title: content.title,
        excerpt: content.excerpt,
        wordCount: content.stats?.wordCount || 0,
        readability: {
          score: readability.score,
          level: readability.level,
          suggestions: readability.suggestions
        },
        contentPreview: content.content.substring(0, 500) + '...',
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed'
      }
    }
  }
} as Skill)

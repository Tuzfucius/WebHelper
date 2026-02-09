/**
 * 内容分析工具 - 页面内容提取和可读性分析
 */
import { Readability } from '@mozilla/readability'
import DOMPurify from 'dompurify'

export interface PageContent {
  title: string
  content: string
  excerpt: string
  stats?: ContentStats
}

export interface ContentStats {
  wordCount: number
  sentenceCount: number
  avgWordsPerSentence: number
  vocabulary: number
}

export interface ReadabilityResult {
  score: number
  level: 'easy' | 'medium' | 'hard'
  suggestions: string[]
}

/**
 * 提取页面内容
 */
export function extractPageContent(options: {
  extractImages?: boolean
  maxLength?: number
}): PageContent {
  const { extractImages = false, maxLength = 50000 } = options
  
  // 克隆文档以避免修改原页面
  const documentClone = document.cloneNode(true) as Document
  
  // 使用 Readability 提取内容
  const reader = new Readability(documentClone)
  const article = reader.parse()
  
  const rawText = article?.textContent || document.body.innerText
  const title = article?.title || document.title
  const excerpt = article?.excerpt || ''
  
  // 清理内容
  const cleanContent = DOMPurify.sanitize(rawText)
  const truncatedContent = cleanContent.substring(0, maxLength)
  
  // 计算统计信息
  const stats = calculateContentStats(truncatedContent)
  
  return {
    title,
    content: truncatedContent,
    excerpt,
    stats
  }
}

/**
 * 计算内容统计信息
 */
function calculateContentStats(text: string): ContentStats {
  if (!text || text.trim().length === 0) {
    return {
      wordCount: 0,
      sentenceCount: 0,
      avgWordsPerSentence: 0,
      vocabulary: 0
    }
  }
  
  // 分词
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'word' })
  const segments = Array.from(segmenter.segment(text))
  const words = segments.filter(s => s.isWordLike).map(s => s.segment)
  const wordCount = words.length
  
  // 句子统计
  const sentenceSegmenter = new Intl.Segmenter(undefined, { granularity: 'sentence' })
  const sentences = Array.from(sentenceSegmenter.segment(text))
  const sentenceCount = sentences.length
  const avgWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0
  
  // 词汇多样性
  const uniqueWords = new Set(words.map(w => w.toLowerCase())).size
  const vocabulary = wordCount > 0 ? (uniqueWords / wordCount) * 100 : 0
  
  return {
    wordCount,
    sentenceCount,
    avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
    vocabulary: Math.round(vocabulary * 10) / 10
  }
}

/**
 * 分析文本可读性
 */
export function analyzeReadability(text: string): ReadabilityResult {
  if (!text || text.trim().length === 0) {
    return {
      score: 0,
      level: 'easy',
      suggestions: ['文本太短，无法分析']
    }
  }
  
  const stats = calculateContentStats(text)
  const suggestions: string[] = []
  
  // 计算可读性分数 (0-100)
  // 基于句子长度和词汇复杂度的综合评估
  let score = 100
  
  // 句子长度惩罚
  if (stats.avgWordsPerSentence > 20) {
    const penalty = Math.min(30, (stats.avgWordsPerSentence - 20) * 2)
    score -= penalty
    suggestions.push('句子偏长，建议拆分短句提高可读性')
  }
  
  // 词汇复杂度
  const words = text.split(/\s+/).filter(w => w.length > 6)
  const longWordRatio = stats.wordCount > 0 ? words.length / stats.wordCount * 100 : 0
  
  if (longWordRatio > 20) {
    score -= 10
    suggestions.push('专业术语较多，可以添加解释')
  }
  
  // 确保分数在 0-100 范围内
  score = Math.max(0, Math.min(100, score))
  
  // 确定难度等级
  let level: 'easy' | 'medium' | 'hard'
  if (score >= 70) {
    level = 'easy'
  } else if (score >= 40) {
    level = 'medium'
  } else {
    level = 'hard'
    suggestions.push('内容较难，建议分段阅读或寻求辅助解释')
  }
  
  return {
    score,
    level,
    suggestions
  }
}

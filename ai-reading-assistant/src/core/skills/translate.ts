/**
 * 翻译 Skill - 支持多语言翻译
 */
import { skillManager, Skill } from './base'

interface TranslationResult {
  original: string
  translated: string
  sourceLang: string
  targetLang: string
}

const LANGUAGE_CODES: Record<string, string> = {
  '中文': 'zh',
  '英文': 'en',
  '日语': 'ja',
  '韩语': 'ko',
  '法语': 'fr',
  '德语': 'de',
  '西班牙语': 'es',
  '俄语': 'ru'
}

skillManager.registerSkill({
  name: 'translate',
  description: '将文本翻译成指定语言。支持中文、英文、日语、韩语、法语、德语、西班牙语、俄语。默认翻译成中文。',
  parameters: {
    type: 'object',
    properties: {
      text: { 
        type: 'string', 
        description: '需要翻译的文本'
      },
      targetLang: {
        type: 'string',
        description: '目标语言（如：中文、英文、日语等）',
        default: '中文'
      },
      sourceLang: {
        type: 'string',
        description: '源语言（可选，自动检测）',
        default: 'auto'
      }
    },
    required: ['text']
  },
  execute: async ({ text, targetLang = '中文', sourceLang = 'auto' }) => {
    try {
      const sourceCode = sourceLang === 'auto' ? 'auto' : LANGUAGE_CODES[sourceLang] || 'auto'
      const targetCode = LANGUAGE_CODES[targetLang] || 'zh'
      
      // 使用免费的翻译 API（这里使用模拟实现，实际可以接入 Google Translate API）
      const translated = await mockTranslate(text, sourceCode, targetCode)
      
      return {
        success: true,
        original: text,
        translated,
        sourceLang: sourceLang === 'auto' ? 'auto-detected' : sourceLang,
        targetLang,
        timestamp: new Date().toISOString()
      } as TranslationResult & { success: boolean; timestamp: string }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Translation failed',
        original: text
      }
    }
  }
} as Skill)

// 模拟翻译函数 - 实际项目中可以替换为真实 API
async function mockTranslate(text: string, _sourceLang: string, targetLang: string): Promise<string> {
  // 这里使用简单的占位符，实际项目中应该调用真实的翻译 API
  // 例如：Google Translate API、DeepL API 等
  const langMap: Record<string, string> = {
    'zh': '中文',
    'en': 'English',
    'ja': '日本語',
    'ko': '한국어',
    'fr': 'Français',
    'de': 'Deutsch',
    'es': 'Español',
    'ru': 'Русский'
  }
  
  return `[${langMap[targetLang] || 'Translated'}]: ${text}`
}

import { Readability } from '@mozilla/readability'
import DOMPurify from 'dompurify'
import { ComplexityMetrics } from '../types'

export interface PageContent {
    title: string
    content: string
    excerpt: string
    stats?: ComplexityMetrics
}

const analyzeComplexity = (text: string): ComplexityMetrics => {
    if (!text || text.trim().length === 0) {
        return { vocabulary: 0, sentence: 0, density: 0, abstract: 0 }
    }

    // 1. Segmentation
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'word' })
    const segments = Array.from(segmenter.segment(text))

    const words = segments.filter(s => s.isWordLike).map(s => s.segment.toLowerCase())
    const wordCount = words.length

    // 2. Vocabulary (Unique Words)
    const uniqueWords = new Set(words).size
    const vocabularyScore = Math.min(100, (uniqueWords / 500) * 100) // Normalize

    // 3. Sentence Length
    const sentenceSegmenter = new Intl.Segmenter(undefined, { granularity: 'sentence' })
    const sentences = Array.from(sentenceSegmenter.segment(text))
    const sentenceCount = sentences.length
    const avgSentenceLength = sentenceCount > 0 ? wordCount / sentenceCount : 0
    const sentenceScore = Math.min(100, (avgSentenceLength / 20) * 100) // Normalize (20 words/sentence as baseline)

    // 4. Density (Character per word approx for Chinese, or Word length for English)
    // For mixed content, we can use average word length
    const totalWordLength = words.reduce((acc, w) => acc + w.length, 0)
    const avgWordLength = wordCount > 0 ? totalWordLength / wordCount : 0
    // Density score: higher is denser
    const densityScore = Math.min(100, (avgWordLength / 6) * 100)

    // 5. Abstractness (Simplified heuristc: long words > 6 chars)
    const longWords = words.filter(w => w.length > 6).length
    const abstractScore = wordCount > 0 ? Math.min(100, (longWords / wordCount) * 100 * 3) : 0

    return {
        vocabulary: Math.round(vocabularyScore),
        sentence: Math.round(sentenceScore),
        density: Math.round(densityScore),
        abstract: Math.round(abstractScore)
    }
}

export const extractPageContent = (): PageContent => {
    // Clone document to avoid modifying the page
    const documentClone = document.cloneNode(true) as Document

    // Use Readability
    const reader = new Readability(documentClone)
    const article = reader.parse()

    const rawText = article?.textContent || document.body.innerText.substring(0, 5000)
    const title = article?.title || document.title
    const excerpt = article?.excerpt || ''

    // Analyze complexity
    const stats = analyzeComplexity(rawText)

    // Clean content
    const cleanContent = DOMPurify.sanitize(rawText)

    return {
        title,
        content: cleanContent,
        excerpt,
        stats
    }
}

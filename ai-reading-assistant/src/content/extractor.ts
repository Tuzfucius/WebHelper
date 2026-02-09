import { Readability } from '@mozilla/readability'
import DOMPurify from 'dompurify'

export const extractPageContent = (): { title: string; content: string; excerpt: string } => {
    // Clone document to avoid modifying the page
    const documentClone = document.cloneNode(true) as Document

    // Use Readability
    const reader = new Readability(documentClone)
    const article = reader.parse()

    if (!article) {
        // Fallback
        return {
            title: document.title,
            content: document.body.innerText.substring(0, 5000), // Raw fallback
            excerpt: ''
        }
    }

    // Clean content
    const cleanContent = DOMPurify.sanitize(article.textContent)

    return {
        title: article.title,
        content: cleanContent,
        excerpt: article.excerpt
    }
}

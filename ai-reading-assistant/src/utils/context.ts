import { Settings } from '../types'

export interface PageContext {
    url: string
    title: string
    content: string // Summary or full text (truncated)
    timestamp: number
}

export const extractContextData = async (currentUrl: string): Promise<{
    url: string
    title: string
    content: string
}> => {
    const memory = await contextEngine.getMemory()
    const page = memory.find(p => p.url === currentUrl)
    
    if (page) {
        return {
            url: page.url,
            title: page.title,
            content: page.content
        }
    }
    
    return {
        url: currentUrl,
        title: document.title,
        content: ''
    }
}

const STORAGE_KEY = 'page_memory'

export const contextEngine = {
    async addPage(page: PageContext, limit: number) {
        if (limit <= 0) return

        const memory = await this.getMemory()

        // Remove if exists (to update position/content)
        const filtered = memory.filter(p => p.url !== page.url)

        // Add to front
        filtered.unshift(page)

        // Trim
        const trimmed = filtered.slice(0, limit)

        await chrome.storage.local.set({ [STORAGE_KEY]: trimmed })
    },

    async getMemory(): Promise<PageContext[]> {
        const result = await chrome.storage.local.get(STORAGE_KEY)
        return (result[STORAGE_KEY] as PageContext[]) || []
    },

    async clearMemory() {
        await chrome.storage.local.remove(STORAGE_KEY)
    },

    async getRelevantContext(currentUrl: string, limit: number): Promise<string> {
        const memory = await this.getMemory()
        // Exclude current page from "previous context"
        const relevant = memory.filter(p => p.url !== currentUrl).slice(0, limit)

        if (relevant.length === 0) return ''

        return relevant.map(p => `
[Source: ${p.title} (${p.url})]
${p.content.substring(0, 500)}...
`).join('\n---\n')
    }
}

export type MessageHandler = (
    payload: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
) => void

export type MessageType =
    | 'OPEN_SIDEPANEL'
    | 'GET_TAB_INFO'
    | 'SELECTION_TEXT'
    | 'SCREENSHOT_CAPTURED'
    | 'UPDATE_SETTINGS'
    | 'GET_PAGE_STATS'
    | 'GET_PAGE_CONTENT'

export interface MessagePayloads {
    OPEN_SIDEPANEL: { context?: string }
    GET_TAB_INFO: undefined
    SELECTION_TEXT: { text: string }
    SCREENSHOT_CAPTURED: { imageData: string; rect: { x: number; y: number; width: number; height: number } }
    UPDATE_SETTINGS: { settings: any }
    GET_PAGE_STATS: undefined
    GET_PAGE_CONTENT: undefined
}

export interface ExtensionMessage<T extends MessageType> {
    type: T
    payload: MessagePayloads[T]
}

export const sendMessage = <T extends MessageType>(
    type: T,
    payload: MessagePayloads[T]
): Promise<any> => {
    return new Promise((resolve, reject) => {
        try {
            chrome.runtime.sendMessage({ type, payload }, (response) => {
                if (chrome.runtime.lastError) {
                    // Ignore errors if no background listener (optional)
                    resolve(null)
                } else {
                    resolve(response)
                }
            })
        } catch (error) {
            reject(error)
        }
    })
}

export const sendToActiveTab = <T extends MessageType>(
    type: T,
    payload: MessagePayloads[T]
): Promise<any> => {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0]
            if (!activeTab?.id) {
                reject('No active tab found')
                return
            }
            chrome.tabs.sendMessage(activeTab.id, { type, payload }, (response) => {
                if (chrome.runtime.lastError) {
                    console.warn('Content script not ready or not found', chrome.runtime.lastError)
                    resolve(null)
                } else {
                    resolve(response)
                }
            })
        })
    })
}

export const onMessage = <T extends MessageType>(
    type: T,
    callback: (payload: MessagePayloads[T], sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => void
) => {
    const listener = (message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
        if (message.type === type) {
            callback(message.payload, sender, sendResponse)
            // Return true to indicate async response might be used
            return true
        }
    }
    chrome.runtime.onMessage.addListener(listener)
    return () => chrome.runtime.onMessage.removeListener(listener)
}

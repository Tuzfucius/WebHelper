import React, { useEffect, useState } from 'react'
import { sendMessage } from '../utils/messaging'

export const ElementPicker: React.FC = () => {
    const [active, setActive] = useState(false)
    const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null)

    useEffect(() => {
        const handleToggle = (message: any) => {
            if (message.type === 'TOGGLE_PICKER') {
                setActive(prev => !prev)
                if (active) {
                    // Clean up if turning off
                    setHoveredElement(null)
                }
            }
        }
        chrome.runtime.onMessage.addListener(handleToggle)
        return () => chrome.runtime.onMessage.removeListener(handleToggle)
    }, [active])

    useEffect(() => {
        if (!active) return

        const handleMouseOver = (e: MouseEvent) => {
            e.preventDefault()
            e.stopPropagation()
            setHoveredElement(e.target as HTMLElement)
        }

        const handleClick = (e: MouseEvent) => {
            e.preventDefault()
            e.stopPropagation()
            const target = e.target as HTMLElement

            // Extract content
            // We can take outerHTML or innerText
            // Let's take innerText for safety and token count, or specific attributes
            const text = target.innerText.substring(0, 2000)
            const html = target.outerHTML.substring(0, 5000) // limit size
            const tagName = target.tagName.toLowerCase()

            const context = `Selected Element <${tagName}>:\n${text}`

            sendMessage('OPEN_SIDEPANEL', { context })
            setActive(false)
            setHoveredElement(null)
        }

        document.addEventListener('mouseover', handleMouseOver, true)
        document.addEventListener('click', handleClick, true)

        return () => {
            document.removeEventListener('mouseover', handleMouseOver, true)
            document.removeEventListener('click', handleClick, true)
        }
    }, [active])

    if (!active || !hoveredElement) return null

    // Calculate overlay position
    const rect = hoveredElement.getBoundingClientRect()

    return (
        <div
            style={{
                position: 'fixed',
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
                backgroundColor: 'rgba(103, 80, 164, 0.2)',
                border: '2px solid #6750A4',
                pointerEvents: 'none', // Allow click to pass through to document listener? 
                // No, if pointerEvents none, the click goes to element. 
                // But we have useCapture=true on document listener, so we intercept it.
                zIndex: 999999,
                transition: 'all 0.1s ease'
            }}
        >
            <div style={{
                position: 'absolute',
                top: '-24px',
                left: 0,
                background: '#6750A4',
                color: 'white',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold'
            }}>
                {hoveredElement.tagName.toLowerCase()}
            </div>
        </div>
    )
}

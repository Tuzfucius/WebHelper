// Simple placeholder icons - replace with actual icons
const createIcon = (size: number): string => {
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none">
      <rect width="${size}" height="${size}" fill="#6750A4" rx="4"/>
      <path d="M12 8V16M8 12H16" stroke="white" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

document.addEventListener('DOMContentLoaded', () => {
  // Create placeholder icons
  const icon16 = createIcon(16)
  const icon48 = createIcon(48)
  const icon128 = createIcon(128)
  
  // Add icon elements to the DOM
  const addIcon = (id: string, dataUrl: string) => {
    const icon = document.createElement('link')
    icon.id = id
    icon.rel = 'icon'
    icon.href = dataUrl
    document.head.appendChild(icon)
  }
  
  addIcon('icon16', icon16)
  addIcon('icon48', icon48)
  addIcon('icon128', icon128)
})
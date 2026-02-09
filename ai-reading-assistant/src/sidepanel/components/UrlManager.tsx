import React, { useState } from 'react'

interface UrlManagerProps {
  selectedUrls: string[]
  onUrlsChange: (urls: string[]) => void
}

export const UrlManager: React.FC<UrlManagerProps> = ({
  selectedUrls,
  onUrlsChange
}) => {
  const [newUrl, setNewUrl] = useState('')

  const addUrl = () => {
    if (newUrl.trim() && !selectedUrls.includes(newUrl.trim())) {
      onUrlsChange([...selectedUrls, newUrl.trim()])
      setNewUrl('')
    }
  }

  const removeUrl = (urlToRemove: string) => {
    onUrlsChange(selectedUrls.filter(url => url !== urlToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addUrl()
    }
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-[#1D1B20]">
        Allowed URLs (Optional)
      </label>
      <p className="text-xs text-[#49454F]">
        Add domains where the extension should work (empty = all sites)
      </p>
      
      <div className="flex space-x-2">
        <input
          type="url"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="https://example.com"
          className="flex-1 px-3 py-2 border border-[#79747E]/30 rounded-lg 
                     bg-white text-[#1D1B20] placeholder-[#79747E]/50
                     focus:outline-none focus:ring-2 focus:ring-[#6750A4]"
        />
        <button
          onClick={addUrl}
          disabled={!newUrl.trim() || selectedUrls.includes(newUrl.trim())}
          className="px-4 py-2 bg-[#6750A4] text-white rounded-lg
                     hover:bg-[#5235a0] disabled:bg-[#79747E]/30
                     disabled:text-[#49454F] transition-colors"
        >
          Add
        </button>
      </div>
      
      {selectedUrls.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-[#49454F]">Added URLs:</label>
          <div className="space-y-1">
            {selectedUrls.map((url, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-[#F3EDF7] rounded-lg">
                <span className="text-sm text-[#1D1B20] truncate">{url}</span>
                <button
                  onClick={() => removeUrl(url)}
                  className="p-1 text-[#79747E] hover:text-red-600 transition-colors"
                  title="Remove"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <button
        onClick={() => onUrlsChange([])}
        disabled={selectedUrls.length === 0}
        className="w-full py-2 text-sm text-[#6750A4] border border-[#6750A4]/30 rounded-lg
                   hover:bg-[#EADDFF] disabled:text-[#79747E]/50 disabled:cursor-not-allowed
                   transition-colors"
      >
        Clear All URLs
      </button>
    </div>
  )
}
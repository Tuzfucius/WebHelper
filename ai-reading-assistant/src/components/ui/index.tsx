import React from 'react'

// Placeholder components - will be expanded in later phases
export const Button = ({ children, onClick, className = '' }: { 
  children: React.ReactNode
  onClick?: () => void
  className?: string 
}) => (
  <button 
    className={`bg-[#6750A4] text-white px-4 py-2 rounded-full 
               hover:bg-[#5235a0] transition-colors duration-200 
               font-medium ${className}`}
    onClick={onClick}
  >
    {children}
  </button>
)

export const Input = ({ 
  type = 'text', 
  placeholder, 
  value, 
  onChange 
}: { 
  type?: string
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className="w-full px-3 py-2 border border-[#79747E]/30 rounded-lg 
               bg-white text-[#1D1B20] placeholder-[#79747E]/50
               focus:outline-none focus:ring-2 focus:ring-[#6750A4]"
  />
)

export const Card = ({ children, className = '' }: { 
  children: React.ReactNode
  className?: string 
}) => (
  <div className={`bg-[#F3EDF7] rounded-lg p-4 ${className}`}>
    {children}
  </div>
)

export const Spinner = () => (
  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#6750A4]"></div>
)
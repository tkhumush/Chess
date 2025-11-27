import React, { useState } from 'react'
import { useAppStore } from '@/stores/appStore'

export default function QuickMatchButton() {
  const [isSearching, setIsSearching] = useState(false)
  const { skillLevel, preferredVariant, createGameOffer } = useAppStore()

  const handleQuickMatch = () => {
    setIsSearching(true)
    
    // Create a game offer with default settings
    createGameOffer({
      skillLevel,
      variant: preferredVariant,
      timeControl: { initial: 600, increment: 0 }, // 10+0
      message: 'Quick match!',
    })
    
    // TODO: Implement auto-matching logic
    // For now, just create an offer
    setTimeout(() => {
      setIsSearching(false)
    }, 2000)
  }

  return (
    <button
      onClick={handleQuickMatch}
      disabled={isSearching}
      className="btn-primary w-full"
    >
      {isSearching ? (
        <div className="flex items-center justify-center">
          <div className="loading-spinner w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
          Searching...
        </div>
      ) : (
        'Quick Match'
      )}
    </button>
  )
}
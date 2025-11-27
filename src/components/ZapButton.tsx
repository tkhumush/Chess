import React, { useState } from 'react'
import { useAppStore } from '@/stores/appStore'

interface ZapButtonProps {
  targetEventId?: string
  targetPubkey?: string
  zapCount?: number
  totalAmount?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function ZapButton({ 
  targetEventId, 
  targetPubkey, 
  zapCount = 0, 
  totalAmount = 0,
  size = 'md',
  className = '' 
}: ZapButtonProps) {
  const [isZapping, setIsZapping] = useState(false)
  const [showZapDialog, setShowZapDialog] = useState(false)
  const { zapsEnabled } = useAppStore()

  if (!zapsEnabled) return null

  const formatAmount = (sats: number) => {
    if (sats >= 1000) {
      return `${(sats / 1000).toFixed(1)}k`
    }
    return sats.toString()
  }

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  }

  async function handleZap() {
    if (!targetEventId && !targetPubkey) return
    
    setIsZapping(true)
    try {
      // TODO: Implement actual zap functionality
      console.log('Zapping:', { targetEventId, targetPubkey })
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate zap
      
      // TODO: Update zap count and amount in store
    } catch (error) {
      console.error('Zap failed:', error)
    } finally {
      setIsZapping(false)
      setShowZapDialog(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowZapDialog(true)}
        disabled={isZapping}
        className={`
          zap-button inline-flex items-center space-x-1 transition-all duration-200
          ${sizeClasses[size]}
          ${isZapping ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
          ${className}
        `}
      >
        <span className="text-yellow-600">⚡</span>
        {zapCount > 0 && (
          <span className="font-medium">
            {zapCount}
          </span>
        )}
        {totalAmount > 0 && (
          <span className="text-xs opacity-75">
            ({formatAmount(Math.floor(totalAmount / 1000))})
          </span>
        )}
      </button>

      {/* Zap Dialog */}
      {showZapDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="text-center">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Send Lightning Zap
              </h3>
              <p className="text-gray-600 mb-6">
                {targetEventId ? 'Zap this brilliant move!' : 'Tip this player!'}
              </p>

              {/* Zap Amount Buttons */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[21, 100, 500, 1000, 5000, 10000].map((amount) => (
                  <button
                    key={amount}
                    onClick={handleZap}
                    disabled={isZapping}
                    className="btn-primary py-3 text-sm"
                  >
                    {amount >= 1000 ? `${amount / 1000}k` : amount} sats
                  </button>
                ))}
              </div>

              {/* Custom Amount */}
              <div className="mb-6">
                <input
                  type="number"
                  placeholder="Custom amount (sats)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Message */}
              <div className="mb-6">
                <textarea
                  placeholder="Optional message..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                />
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowZapDialog(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleZap}
                  disabled={isZapping}
                  className="flex-1 btn-primary"
                >
                  {isZapping ? 'Sending...' : 'Send Zap'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
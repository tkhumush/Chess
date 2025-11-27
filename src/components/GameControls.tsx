import React, { useState } from 'react'
import type { GameState } from '@/types/chess'

interface GameControlsProps {
  game: GameState
}

export default function GameControls({ game }: GameControlsProps) {
  const [showResignConfirm, setShowResignConfirm] = useState(false)
  const [showDrawOffer, setShowDrawOffer] = useState(false)

  const handleResign = () => {
    // TODO: Implement resignation
    console.log('Player resigned')
    setShowResignConfirm(false)
  }

  const handleDrawOffer = () => {
    // TODO: Implement draw offer
    console.log('Draw offered')
    setShowDrawOffer(false)
  }

  const handleTakeback = () => {
    // TODO: Implement takeback request
    console.log('Takeback requested')
  }

  if (game.status !== 'active') {
    return (
      <div className="game-controls">
        <div className="text-center text-gray-600">
          Game completed
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="game-controls">
        <div className="flex space-x-3">
          {/* Draw Offer */}
          <button
            onClick={() => setShowDrawOffer(true)}
            className="btn-secondary flex-1"
          >
            Offer Draw
          </button>

          {/* Takeback */}
          <button
            onClick={handleTakeback}
            className="btn-secondary flex-1"
            disabled={game.moves.length === 0}
          >
            Request Takeback
          </button>

          {/* Resign */}
          <button
            onClick={() => setShowResignConfirm(true)}
            className="btn-danger flex-1"
          >
            Resign
          </button>
        </div>
      </div>

      {/* Resign Confirmation Modal */}
      {showResignConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="text-center">
              <div className="text-4xl mb-4">🏳️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Resign Game
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to resign? This will end the game and give your opponent the win.
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowResignConfirm(false)}
                  className="flex-1 btn-secondary"
                >
                  Continue Playing
                </button>
                <button
                  onClick={handleResign}
                  className="flex-1 btn-danger"
                >
                  Yes, Resign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Draw Offer Modal */}
      {showDrawOffer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="text-center">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Offer Draw
              </h3>
              <p className="text-gray-600 mb-6">
                Offer your opponent a draw? They can accept, decline, or ignore this offer.
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDrawOffer(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDrawOffer}
                  className="flex-1 btn-primary"
                >
                  Offer Draw
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
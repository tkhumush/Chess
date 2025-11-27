import React from 'react'
import { useAppStore } from '@/stores/appStore'
import type { GameState } from '@/types/chess'
import ZapButton from './ZapButton'

interface MoveListProps {
  game: GameState
}

export default function MoveList({ game }: MoveListProps) {
  const { selectedMove, selectMove, zapsEnabled } = useAppStore()

  // Group moves into pairs (White, Black)
  const movePairs: Array<{
    number: number
    white?: typeof game.moves[0]
    black?: typeof game.moves[0]
  }> = []

  game.moves.forEach((move, index) => {
    const moveNumber = Math.ceil((index + 1) / 2)
    const isWhite = move.color === 'white'
    
    if (isWhite) {
      movePairs.push({
        number: moveNumber,
        white: move,
        black: undefined,
      })
    } else {
      const pairIndex = movePairs.length - 1
      if (pairIndex >= 0) {
        movePairs[pairIndex].black = move
      }
    }
  })

  function handleMoveClick(moveIndex: number) {
    selectMove(selectedMove === moveIndex ? null : moveIndex)
  }

  if (game.moves.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <div className="text-4xl mb-2">♟️</div>
        <p className="text-sm">
          No moves yet. The game is just beginning!
        </p>
      </div>
    )
  }

  return (
    <div className="move-list p-4">
      <div className="space-y-1">
        {movePairs.map((pair, pairIndex) => (
          <div key={pair.number} className="flex items-center text-sm">
            {/* Move Number */}
            <div className="w-8 text-gray-500 font-mono text-xs">
              {pair.number}.
            </div>

            {/* White Move */}
            <div className="flex-1 min-w-0">
              {pair.white && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleMoveClick((pair.number - 1) * 2)}
                    className={`px-2 py-1 rounded text-left font-mono hover:bg-gray-100 transition-colors ${
                      selectedMove === (pair.number - 1) * 2
                        ? 'bg-blue-100 text-blue-800'
                        : 'text-gray-900'
                    }`}
                  >
                    {pair.white.san}
                  </button>
                  
                  {zapsEnabled && pair.white.zaps.length > 0 && (
                    <ZapButton
                      targetEventId={pair.white.eventId}
                      zapCount={pair.white.zaps.length}
                      totalAmount={pair.white.zaps.reduce((sum, zap) => sum + zap.amount, 0)}
                      size="sm"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Black Move */}
            <div className="flex-1 min-w-0">
              {pair.black && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleMoveClick((pair.number - 1) * 2 + 1)}
                    className={`px-2 py-1 rounded text-left font-mono hover:bg-gray-100 transition-colors ${
                      selectedMove === (pair.number - 1) * 2 + 1
                        ? 'bg-blue-100 text-blue-800'
                        : 'text-gray-900'
                    }`}
                  >
                    {pair.black.san}
                  </button>
                  
                  {zapsEnabled && pair.black.zaps.length > 0 && (
                    <ZapButton
                      targetEventId={pair.black.eventId}
                      zapCount={pair.black.zaps.length}
                      totalAmount={pair.black.zaps.reduce((sum, zap) => sum + zap.amount, 0)}
                      size="sm"
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Move Navigation */}
      {selectedMove !== null && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <button
              onClick={() => selectMove(null)}
              className="text-xs text-gray-600 hover:text-gray-900"
            >
              Current position
            </button>
            
            <div className="flex space-x-1">
              <button
                onClick={() => selectMove(Math.max(0, selectedMove - 1))}
                disabled={selectedMove <= 0}
                className="p-1 text-xs text-gray-600 hover:text-gray-900 disabled:opacity-50"
              >
                ←
              </button>
              <button
                onClick={() => selectMove(Math.min(game.moves.length - 1, selectedMove + 1))}
                disabled={selectedMove >= game.moves.length - 1}
                className="p-1 text-xs text-gray-600 hover:text-gray-900 disabled:opacity-50"
              >
                →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Result */}
      {game.result && game.result !== '*' && (
        <div className="mt-4 pt-4 border-t border-gray-200 text-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            {game.result === '1-0' && '1-0 White wins'}
            {game.result === '0-1' && '0-1 Black wins'}
            {game.result === '1/2-1/2' && '1/2-1/2 Draw'}
          </div>
        </div>
      )}
    </div>
  )
}
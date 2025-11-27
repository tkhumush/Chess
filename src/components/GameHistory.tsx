import React from 'react'
import { useAppStore } from '@/stores/appStore'

export default function GameHistory() {
  const { gameHistory } = useAppStore()

  if (gameHistory.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📚</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No games yet
        </h3>
        <p className="text-gray-600">
          Your completed games will appear here
        </p>
      </div>
    )
  }

  const getResultText = (result: string, isWhite: boolean) => {
    switch (result) {
      case '1-0': return isWhite ? 'Won' : 'Lost'
      case '0-1': return isWhite ? 'Lost' : 'Won'
      case '1/2-1/2': return 'Draw'
      default: return 'Abandoned'
    }
  }

  const getResultColor = (result: string, isWhite: boolean) => {
    const outcome = getResultText(result, isWhite)
    switch (outcome) {
      case 'Won': return 'text-green-600 bg-green-50'
      case 'Lost': return 'text-red-600 bg-red-50'
      case 'Draw': return 'text-yellow-600 bg-yellow-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="space-y-4">
      {gameHistory.map((game) => {
        const isWhite = true // TODO: determine if current user was white
        
        return (
          <div key={game.id} className="bg-white rounded-lg shadow-md p-6 border hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    vs {isWhite ? game.players.black.name : game.players.white.name || 'Anonymous'}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getResultColor(game.result, isWhite)}`}>
                    {getResultText(game.result, isWhite)}
                  </span>
                  <span className="text-sm text-gray-500">
                    {game.variant}
                  </span>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>
                    {new Date(game.date).toLocaleDateString()}
                  </span>
                  <span>•</span>
                  <span>
                    You played as {isWhite ? 'White' : 'Black'}
                  </span>
                  <span>•</span>
                  <span>
                    Result: {game.result}
                  </span>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    // TODO: Open game viewer/analyzer
                    console.log('View game:', game.id)
                  }}
                  className="btn-secondary text-sm"
                >
                  Analyze
                </button>
                
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(game.pgn)
                    // TODO: Show toast notification
                  }}
                  className="btn-secondary text-sm"
                >
                  Copy PGN
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
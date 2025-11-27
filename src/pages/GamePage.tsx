import React from 'react'
import { useAppStore } from '@/stores/appStore'
import ChessBoard from '@/components/ChessBoard'
import MoveList from '@/components/MoveList'
import PlayerCard from '@/components/PlayerCard'
import GameControls from '@/components/GameControls'
import SpectatorPanel from '@/components/SpectatorPanel'

export default function GamePage() {
  const { currentGame, sidePanel } = useAppStore()

  if (!currentGame) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No active game
          </h2>
          <p className="text-gray-600">
            Start a new game from the home page
          </p>
        </div>
      </div>
    )
  }

  const isPlayerWhite = currentGame.players.white.pubkey === 'current-user-pubkey' // TODO: get from store
  const playerColor = isPlayerWhite ? 'white' : 'black'

  return (
    <div className="max-w-7xl mx-auto">
      {/* Game Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            {currentGame.variant === 'classical' ? 'Classical' : currentGame.variant} Chess
          </h1>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>Move {Math.ceil(currentGame.moves.length / 2)}</span>
            <span>•</span>
            <span className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-green-400 mr-2" />
              Live Game
            </span>
            {currentGame.spectatorCount > 0 && (
              <>
                <span>•</span>
                <span>{currentGame.spectatorCount} watching</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Players and Board */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top Player (Opponent) */}
          <PlayerCard 
            player={isPlayerWhite ? currentGame.players.black : currentGame.players.white}
            isCurrentTurn={false} // TODO: implement turn logic
            gameStatus={currentGame.status}
          />

          {/* Chess Board */}
          <div className="flex justify-center">
            <div className="w-full max-w-2xl">
              <ChessBoard 
                game={currentGame}
                playerColor={playerColor}
              />
            </div>
          </div>

          {/* Bottom Player (Current User) */}
          <PlayerCard 
            player={isPlayerWhite ? currentGame.players.white : currentGame.players.black}
            isCurrentTurn={true} // TODO: implement turn logic
            gameStatus={currentGame.status}
          />

          {/* Game Controls */}
          <GameControls game={currentGame} />
        </div>

        {/* Right Column - Side Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Panel Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex">
                <button
                  onClick={() => useAppStore.getState().setSidePanel('moves')}
                  className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 ${
                    sidePanel === 'moves'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Moves
                </button>
                
                <button
                  onClick={() => useAppStore.getState().setSidePanel('spectators')}
                  className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 ${
                    sidePanel === 'spectators'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Spectators ({currentGame.spectatorCount})
                </button>
              </nav>
            </div>

            {/* Panel Content */}
            <div className="h-96 overflow-y-auto">
              {sidePanel === 'moves' && (
                <MoveList game={currentGame} />
              )}
              
              {sidePanel === 'spectators' && (
                <SpectatorPanel />
              )}
            </div>
          </div>

          {/* PGN Export */}
          <div className="mt-4">
            <button
              onClick={() => {
                const pgn = currentGame.chess.pgn()
                navigator.clipboard.writeText(pgn)
                // TODO: Show toast notification
              }}
              className="w-full btn-secondary text-sm"
            >
              Copy PGN
            </button>
          </div>
        </div>
      </div>

      {/* Game End Modal would go here */}
    </div>
  )
}
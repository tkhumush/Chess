import React from 'react'
import type { GamePlayer, GameStatus } from '@/types/chess'
import ZapButton from './ZapButton'

interface PlayerCardProps {
  player: GamePlayer
  isCurrentTurn: boolean
  gameStatus: GameStatus
}

export default function PlayerCard({ player, isCurrentTurn, gameStatus }: PlayerCardProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getConnectionStatus = () => {
    if (!player.connected) return 'Disconnected'
    if (gameStatus !== 'active') return 'Game Over'
    return isCurrentTurn ? 'Thinking...' : 'Waiting'
  }

  return (
    <div className="player-card">
      <div className="flex items-center justify-between">
        {/* Player Info */}
        <div className="flex items-center space-x-3">
          {/* Avatar */}
          <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
            {player.picture ? (
              <img
                src={player.picture}
                alt={player.name || 'Player'}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-gray-600 font-medium">
                {(player.name || 'Anonymous')[0]?.toUpperCase()}
              </span>
            )}
          </div>

          {/* Name and Color */}
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-medium text-gray-900">
                {player.name || 'Anonymous Player'}
              </h3>
              <div className="flex items-center space-x-1">
                <div className={`w-3 h-3 rounded-full ${
                  player.color === 'white' ? 'bg-gray-200 border-2 border-gray-800' : 'bg-gray-800'
                }`} />
                <span className="text-xs text-gray-500 capitalize">
                  {player.color}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${
                player.connected ? 'bg-green-400' : 'bg-red-400'
              }`} />
              <span className="text-xs text-gray-600">
                {getConnectionStatus()}
              </span>
            </div>
          </div>
        </div>

        {/* Time and Actions */}
        <div className="text-right space-y-2">
          {/* Time Remaining */}
          <div className={`text-lg font-mono font-bold ${
            isCurrentTurn && player.timeRemaining < 60
              ? 'text-red-600'
              : isCurrentTurn
              ? 'text-blue-600'
              : 'text-gray-900'
          }`}>
            {formatTime(player.timeRemaining)}
          </div>

          {/* Zap Button */}
          <ZapButton
            targetPubkey={player.pubkey}
            size="sm"
            className="bg-yellow-50 border border-yellow-200"
          />
        </div>
      </div>

      {/* Turn Indicator */}
      {gameStatus === 'active' && (
        <div className="mt-3">
          <div className={`w-full h-1 rounded-full ${
            isCurrentTurn ? 'bg-blue-500' : 'bg-gray-200'
          } transition-colors duration-300`} />
        </div>
      )}
    </div>
  )
}
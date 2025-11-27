import React, { useState } from 'react'
import { useAppStore } from '@/stores/appStore'
import type { SkillLevel, GameVariant } from '@/types/chess'

export default function MatchmakingPanel() {
  const [selectedTab, setSelectedTab] = useState<'create' | 'browse'>('browse')
  const [gameForm, setGameForm] = useState({
    skillLevel: 'intermediate' as SkillLevel,
    variant: 'classical' as GameVariant,
    timeControl: { initial: 600, increment: 0 }, // 10+0
    message: '',
  })

  const { 
    availableGames, 
    myOffers, 
    createGameOffer, 
    acceptGameOffer, 
    cancelGameOffer,
    skillLevel 
  } = useAppStore()

  const handleCreateOffer = () => {
    createGameOffer({
      skillLevel: gameForm.skillLevel,
      variant: gameForm.variant,
      timeControl: gameForm.timeControl,
      message: gameForm.message,
    })
    
    // Reset form
    setGameForm({
      ...gameForm,
      message: '',
    })
  }

  const skillLevels: Array<{ value: SkillLevel; label: string; description: string }> = [
    { value: 'total-beginner', label: 'Total Beginner', description: 'Just learning the rules' },
    { value: 'beginner', label: 'Beginner', description: 'Know the rules, learning tactics' },
    { value: 'intermediate', label: 'Intermediate', description: 'Comfortable with basic strategy' },
    { value: 'advanced', label: 'Advanced', description: 'Strong tactical and positional play' },
    { value: 'master', label: 'Master', description: 'Expert level play' },
  ]

  const variants: Array<{ value: GameVariant; label: string; description: string }> = [
    { value: 'classical', label: 'Classical', description: 'Standard chess rules' },
    { value: 'rapid', label: 'Rapid', description: 'Faster time controls' },
    { value: 'blitz', label: 'Blitz', description: 'Very fast games' },
  ]

  const timeControls = [
    { initial: 180, increment: 2, label: '3+2' },
    { initial: 300, increment: 0, label: '5+0' },
    { initial: 600, increment: 0, label: '10+0' },
    { initial: 900, increment: 15, label: '15+15' },
    { initial: 1800, increment: 0, label: '30+0' },
  ]

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex">
          <button
            onClick={() => setSelectedTab('browse')}
            className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 ${
              selectedTab === 'browse'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Browse Games ({availableGames.length})
          </button>
          <button
            onClick={() => setSelectedTab('create')}
            className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 ${
              selectedTab === 'create'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Create Game
          </button>
        </nav>
      </div>

      <div className="p-6">
        {selectedTab === 'browse' ? (
          <div className="space-y-4">
            {/* My Offers */}
            {myOffers.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Your Game Offers
                </h3>
                <div className="space-y-2">
                  {myOffers.map((offer) => (
                    <div key={offer.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border">
                      <div>
                        <div className="font-medium text-blue-900">
                          {offer.variant} • {offer.timeControl.initial / 60}+{offer.timeControl.increment}
                        </div>
                        <div className="text-sm text-blue-700">
                          {skillLevels.find(s => s.value === offer.skillLevel)?.label}
                          {offer.message && ` • "${offer.message}"`}
                        </div>
                      </div>
                      <button
                        onClick={() => cancelGameOffer(offer.id)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Cancel
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available Games */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Available Games
              </h3>
              
              {availableGames.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-3">🎯</div>
                  <p className="text-lg mb-2">No games available</p>
                  <p className="text-sm">Create a game or wait for other players to join</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableGames.map((game) => (
                    <div key={game.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
                      <div>
                        <div className="font-medium text-gray-900">
                          {game.variant} • {game.timeControl.initial / 60}+{game.timeControl.increment}
                        </div>
                        <div className="text-sm text-gray-600">
                          {skillLevels.find(s => s.value === game.skillLevel)?.label}
                          {game.message && ` • "${game.message}"`}
                        </div>
                      </div>
                      <button
                        onClick={() => acceptGameOffer(game.id)}
                        className="btn-primary"
                      >
                        Accept
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Create New Game
            </h3>

            {/* Skill Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Your Skill Level
              </label>
              <div className="grid gap-3">
                {skillLevels.map((level) => (
                  <label key={level.value} className="flex items-center">
                    <input
                      type="radio"
                      name="skillLevel"
                      value={level.value}
                      checked={gameForm.skillLevel === level.value}
                      onChange={(e) => setGameForm({ ...gameForm, skillLevel: e.target.value as SkillLevel })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{level.label}</div>
                      <div className="text-xs text-gray-500">{level.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Game Variant */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Game Variant
              </label>
              <div className="grid gap-3">
                {variants.map((variant) => (
                  <label key={variant.value} className="flex items-center">
                    <input
                      type="radio"
                      name="variant"
                      value={variant.value}
                      checked={gameForm.variant === variant.value}
                      onChange={(e) => setGameForm({ ...gameForm, variant: e.target.value as GameVariant })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{variant.label}</div>
                      <div className="text-xs text-gray-500">{variant.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Time Control */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Time Control
              </label>
              <div className="grid grid-cols-3 gap-3">
                {timeControls.map((tc) => (
                  <button
                    key={tc.label}
                    onClick={() => setGameForm({ 
                      ...gameForm, 
                      timeControl: { initial: tc.initial, increment: tc.increment }
                    })}
                    className={`p-3 text-center border rounded-lg transition-colors ${
                      gameForm.timeControl.initial === tc.initial && gameForm.timeControl.increment === tc.increment
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-medium">{tc.label}</div>
                    <div className="text-xs text-gray-500">
                      {tc.initial / 60} min + {tc.increment} sec
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message (Optional)
              </label>
              <input
                type="text"
                value={gameForm.message}
                onChange={(e) => setGameForm({ ...gameForm, message: e.target.value })}
                placeholder="Looking for a good game!"
                maxLength={100}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                {gameForm.message.length}/100 characters
              </p>
            </div>

            {/* Create Button */}
            <button
              onClick={handleCreateOffer}
              className="w-full btn-primary py-3 text-lg"
            >
              Create Game Offer
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
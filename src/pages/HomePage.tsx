import { useState } from 'react'
import { useAppStore } from '@/stores/appStore'
import MatchmakingPanel from '@/components/MatchmakingPanel'
import GameHistory from '@/components/GameHistory'
import QuickMatchButton from '@/components/QuickMatchButton'

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'play' | 'history'>('play')
  const { gameHistory, isConnected } = useAppStore()

  return (
    <div className="max-w-6xl mx-auto">
      {/* Welcome Section */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Nostr Chess
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Play decentralized multiplayer chess on the Nostr protocol. 
          Find opponents, play games, and tip brilliant moves with Lightning.
        </p>
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="loading-spinner w-5 h-5 border-2 border-yellow-600 border-t-transparent rounded-full mr-3" />
            <p className="text-yellow-800">
              Connecting to the Nostr network...
            </p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-4xl mb-3">⚡</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Quick Match
          </h3>
          <p className="text-gray-600 mb-4 text-sm">
            Find an opponent at your skill level instantly
          </p>
          <QuickMatchButton />
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-4xl mb-3">🎯</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Create Game
          </h3>
          <p className="text-gray-600 mb-4 text-sm">
            Set your own rules and wait for opponents
          </p>
          <button 
            className="btn-primary w-full"
            onClick={() => setActiveTab('play')}
          >
            Create Game
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-4xl mb-3">👀</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Watch Games
          </h3>
          <p className="text-gray-600 mb-4 text-sm">
            Spectate live games and tip great moves
          </p>
          <button 
            className="btn-secondary w-full"
            disabled
          >
            Coming Soon
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('play')}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'play'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Find Games
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Game History ({gameHistory.length})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {activeTab === 'play' ? (
          <MatchmakingPanel />
        ) : (
          <GameHistory />
        )}
      </div>

      {/* Features Section */}
      <div className="mt-16 bg-gray-50 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Why Nostr Chess?
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl mb-3">🔒</div>
            <h3 className="font-semibold text-gray-900 mb-2">Decentralized</h3>
            <p className="text-sm text-gray-600">
              No central server. Your games live on the Nostr network.
            </p>
          </div>
          
          <div className="text-center">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="font-semibold text-gray-900 mb-2">Lightning Tips</h3>
            <p className="text-sm text-gray-600">
              Tip players and react to brilliant moves with Bitcoin.
            </p>
          </div>
          
          <div className="text-center">
            <div className="text-3xl mb-3">🌐</div>
            <h3 className="font-semibold text-gray-900 mb-2">Open Source</h3>
            <p className="text-sm text-gray-600">
              Transparent, auditable, and community-driven development.
            </p>
          </div>
          
          <div className="text-center">
            <div className="text-3xl mb-3">🎮</div>
            <h3 className="font-semibold text-gray-900 mb-2">Multiple Variants</h3>
            <p className="text-sm text-gray-600">
              Classical, rapid, blitz, and more variants coming soon.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
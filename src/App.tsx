// TODO: Replace with actual React imports when packages are installed
// import React from 'react'
import React from './lib/react'
import { useAppStore } from './stores/appStore'
import HomePage from './pages/HomePage'
import GamePage from './pages/GamePage'
import './App.css'

function App() {
  const { currentGame, isConnected } = useAppStore()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">
                ♛ Chess
              </h1>
              <span className="text-sm text-gray-500">
                Decentralized Multiplayer
              </span>
            </div>

            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-green-400' : 'bg-red-400'
                  }`}
                />
                <span className="text-sm text-gray-600">
                  {isConnected ? 'Connected' : 'Connecting...'}
                </span>
              </div>

              {/* User Menu Placeholder */}
              <button className="p-2 text-gray-600 hover:text-gray-900">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentGame ? <GamePage /> : <HomePage />}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-sm">
              Built with ⚡ by the Nostr community •
              <a
                href="https://github.com/tkhumush/Chess"
                className="text-yellow-400 hover:text-yellow-300 ml-1"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open Source
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
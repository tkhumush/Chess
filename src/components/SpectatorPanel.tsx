
export default function SpectatorPanel() {
  // TODO: Implement spectator list from Nostr events
  const spectators = [
    { pubkey: '1', name: 'ChessMaster42', watching: true },
    { pubkey: '2', name: 'QueenGambit', watching: true },
    { pubkey: '3', name: 'KnightRider', watching: false },
  ]

  return (
    <div className="p-4">
      <div className="space-y-3">
        {spectators.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-3xl mb-2">👁️</div>
            <p className="text-sm">No spectators yet</p>
          </div>
        ) : (
          spectators.map((spectator) => (
            <div key={spectator.pubkey} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-600">
                    {spectator.name[0]}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {spectator.name}
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className={`w-2 h-2 rounded-full ${
                      spectator.watching ? 'bg-green-400' : 'bg-gray-300'
                    }`} />
                    <span className="text-xs text-gray-500">
                      {spectator.watching ? 'Watching' : 'Away'}
                    </span>
                  </div>
                </div>
              </div>
              
              <button className="text-xs text-gray-400 hover:text-gray-600">
                ⚡
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
/**
 * React hook for managing Nostr connections and game service
 */

import { useEffect, useState, useCallback } from 'react'
import { generateKeyPair, DEFAULT_RELAYS } from '@/lib/nostr'
import { getGameService, type GameService } from '@/services/gameService'
import { useAppStore } from '@/stores/appStore'
import type { Event } from 'nostr-tools'

/**
 * Hook to initialize and manage Nostr connection
 */
export function useNostr() {
  const [gameService, setGameService] = useState<GameService | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { keys, setKeys, setConnected, updateRelayStatus } = useAppStore()

  // Initialize Nostr connection
  const initialize = useCallback(async () => {
    if (isConnecting || gameService) return

    setIsConnecting(true)
    setError(null)

    try {
      // Get or generate keys
      let privateKey = keys?.privateKey
      let publicKey = keys?.publicKey

      if (!privateKey || !publicKey) {
        // Check localStorage first
        const stored = localStorage.getItem('nostr-keys')
        if (stored) {
          const parsed = JSON.parse(stored)
          privateKey = parsed.privateKey
          publicKey = parsed.publicKey
        } else {
          // Generate new keys
          const newKeys = generateKeyPair()
          privateKey = newKeys.privateKey
          publicKey = newKeys.publicKey

          // Store in localStorage
          localStorage.setItem('nostr-keys', JSON.stringify(newKeys))
        }

        // Update store
        setKeys({ privateKey, publicKey })
      }

      // Get relays from env or use defaults
      const relayString = import.meta.env.VITE_DEFAULT_RELAYS
      const relays = relayString ? relayString.split(',') : DEFAULT_RELAYS

      // Initialize game service
      const service = getGameService(relays)
      await service.initialize(privateKey, publicKey)

      setGameService(service)
      setConnected(true)

      // Update relay status
      const status = service.getClient().getRelayStatus()
      updateRelayStatus(status)

      console.log('Nostr initialized successfully')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initialize Nostr'
      setError(message)
      console.error('Nostr initialization error:', err)
    } finally {
      setIsConnecting(false)
    }
  }, [keys, gameService, isConnecting, setKeys, setConnected, updateRelayStatus])

  // Auto-initialize on mount
  useEffect(() => {
    initialize()

    // Cleanup on unmount
    return () => {
      if (gameService) {
        gameService.disconnect()
      }
    }
  }, []) // Empty deps - only run once on mount

  return {
    gameService,
    isConnecting,
    error,
    isReady: !!gameService,
    initialize,
  }
}

/**
 * Hook to subscribe to game offers
 */
export function useGameOffers(skillLevel?: string) {
  const [offers, setOffers] = useState<Event[]>([])
  const { gameService } = useNostr()

  useEffect(() => {
    if (!gameService) return

    // Fetch existing offers
    gameService.getAvailableOffers(skillLevel).then(setOffers)

    // Subscribe to new offers
    const subId = gameService.subscribeToGameOffers((event) => {
      setOffers((prev) => {
        // Check if offer already exists
        if (prev.find(e => e.id === event.id)) return prev
        return [...prev, event]
      })
    }, skillLevel)

    return () => {
      gameService.unsubscribe(subId)
    }
  }, [gameService, skillLevel])

  return offers
}

/**
 * Hook to subscribe to game moves
 */
export function useGameMoves(gameId: string | null) {
  const [moves, setMoves] = useState<Event[]>([])
  const { gameService } = useNostr()

  useEffect(() => {
    if (!gameService || !gameId) return

    // Fetch existing moves
    gameService.getGameMoves(gameId).then(setMoves)

    // Subscribe to new moves
    const subId = gameService.subscribeToGameMoves(gameId, (event) => {
      setMoves((prev) => {
        // Check if move already exists
        if (prev.find(e => e.id === event.id)) return prev

        // Insert in correct position by move number
        const newMoves = [...prev, event]
        newMoves.sort((a, b) => {
          const moveA = parseInt(a.tags.find(t => t[0] === 'move')?.[1] || '0')
          const moveB = parseInt(b.tags.find(t => t[0] === 'move')?.[1] || '0')
          return moveA - moveB
        })

        return newMoves
      })
    })

    return () => {
      gameService.unsubscribe(subId)
    }
  }, [gameService, gameId])

  return moves
}

/**
 * Hook for game actions
 */
export function useGameActions() {
  const { gameService } = useNostr()

  const publishOffer = useCallback(async (offer: {
    variant: string
    skillLevel: string
    timeControl: string
    message?: string
  }) => {
    if (!gameService) throw new Error('Game service not initialized')
    return await gameService.publishGameOffer(offer)
  }, [gameService])

  const acceptOffer = useCallback(async (
    offerEventId: string,
    offerPubkey: string,
    gameId: string
  ) => {
    if (!gameService) throw new Error('Game service not initialized')
    return await gameService.acceptGameOffer(offerEventId, offerPubkey, gameId)
  }, [gameService])

  const publishMove = useCallback(async (
    gameId: string,
    moveNumber: number,
    san: string,
    fen: string,
    whitePubkey: string,
    blackPubkey: string,
    previousEventId?: string
  ) => {
    if (!gameService) throw new Error('Game service not initialized')
    return await gameService.publishMove(
      gameId,
      moveNumber,
      san,
      fen,
      whitePubkey,
      blackPubkey,
      previousEventId
    )
  }, [gameService])

  const archiveGame = useCallback(async (
    pgn: string,
    gameId: string,
    whitePubkey: string,
    blackPubkey: string,
    result: '1-0' | '0-1' | '1/2-1/2',
    variant: string
  ) => {
    if (!gameService) throw new Error('Game service not initialized')
    return await gameService.archiveGame(pgn, gameId, whitePubkey, blackPubkey, result, variant)
  }, [gameService])

  return {
    publishOffer,
    acceptOffer,
    publishMove,
    archiveGame,
  }
}

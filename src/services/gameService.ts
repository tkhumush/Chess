/**
 * Game service - handles Nostr interactions for chess games
 * Manages game offers, acceptance, moves, and archival
 */

import type { Event } from 'nostr-tools'
import {
  createNostrClient,
  createGameOfferEvent,
  createGameAcceptanceEvent,
  createMoveEvent,
  createGameArchiveEvent,
  getTagValue,
  CHESS_KINDS,
  DEFAULT_RELAYS,
  type NostrClient,
} from '@/lib/nostr'
import type { GameOffer, GameState } from '@/types/chess'

/**
 * Game service class for managing chess games over Nostr
 */
export class GameService {
  private client: NostrClient
  private privateKey: string | null = null
  private publicKey: string | null = null

  constructor(relays: string[] = DEFAULT_RELAYS) {
    this.client = createNostrClient({ relays })
  }

  /**
   * Initialize the service with user keys
   */
  async initialize(privateKey: string, publicKey: string): Promise<void> {
    this.privateKey = privateKey
    this.publicKey = publicKey

    await this.client.connect()
    console.log('Game service initialized with pubkey:', publicKey)
  }

  /**
   * Disconnect from relays
   */
  disconnect(): void {
    this.client.disconnect()
  }

  /**
   * Publish a game offer
   */
  async publishGameOffer(offer: {
    variant: string
    skillLevel: string
    timeControl: string
    message?: string
  }): Promise<Event> {
    if (!this.privateKey) {
      throw new Error('Not initialized - call initialize() first')
    }

    const event = createGameOfferEvent(this.privateKey, offer)
    await this.client.publish(event)

    console.log('Published game offer:', event)
    return event
  }

  /**
   * Accept a game offer
   */
  async acceptGameOffer(offerEventId: string, offerPubkey: string, gameId: string): Promise<Event> {
    if (!this.privateKey) {
      throw new Error('Not initialized - call initialize() first')
    }

    const event = createGameAcceptanceEvent(this.privateKey, offerEventId, offerPubkey, gameId)
    await this.client.publish(event)

    console.log('Published game acceptance:', event)
    return event
  }

  /**
   * Publish a move
   */
  async publishMove(
    gameId: string,
    moveNumber: number,
    san: string,
    fen: string,
    whitePubkey: string,
    blackPubkey: string,
    previousEventId?: string
  ): Promise<Event> {
    if (!this.privateKey) {
      throw new Error('Not initialized - call initialize() first')
    }

    const event = createMoveEvent(
      this.privateKey,
      gameId,
      moveNumber,
      san,
      fen,
      whitePubkey,
      blackPubkey,
      previousEventId
    )

    await this.client.publish(event)

    console.log('Published move:', event)
    return event
  }

  /**
   * Archive a completed game
   */
  async archiveGame(
    pgn: string,
    gameId: string,
    whitePubkey: string,
    blackPubkey: string,
    result: '1-0' | '0-1' | '1/2-1/2',
    variant: string
  ): Promise<Event> {
    if (!this.privateKey) {
      throw new Error('Not initialized - call initialize() first')
    }

    const event = createGameArchiveEvent(
      this.privateKey,
      pgn,
      gameId,
      whitePubkey,
      blackPubkey,
      result,
      variant
    )

    await this.client.publish(event)

    console.log('Published game archive:', event)
    return event
  }

  /**
   * Subscribe to game offers
   */
  subscribeToGameOffers(
    onOffer: (event: Event) => void,
    skillLevel?: string
  ): string {
    const filter: any = {
      kinds: [CHESS_KINDS.GAME_OFFER],
      '#t': ['chess-offer'],
      since: Math.floor(Date.now() / 1000) - 600, // Last 10 minutes
    }

    if (skillLevel) {
      filter['#skill'] = [skillLevel]
    }

    return this.client.subscribe([filter], (event: Event) => {
      // Check if offer has expired
      const expiresTag = getTagValue(event, 'expires')
      if (expiresTag) {
        const expires = parseInt(expiresTag)
        if (expires < Math.floor(Date.now() / 1000)) {
          return // Offer expired, ignore
        }
      }

      onOffer(event)
    })
  }

  /**
   * Subscribe to game moves for a specific game
   */
  subscribeToGameMoves(
    gameId: string,
    onMove: (event: Event) => void
  ): string {
    const filter = {
      kinds: [CHESS_KINDS.LIVE_GAME],
      '#game': [gameId],
    }

    return this.client.subscribe([filter], onMove)
  }

  /**
   * Subscribe to game acceptances
   */
  subscribeToGameAcceptances(
    onAcceptance: (event: Event) => void
  ): string {
    const filter = {
      kinds: [CHESS_KINDS.GAME_OFFER],
      '#t': ['chess-accept'],
      '#p': [this.publicKey!],
    }

    return this.client.subscribe([filter], onAcceptance)
  }

  /**
   * Unsubscribe from a subscription
   */
  unsubscribe(subscriptionId: string): void {
    this.client.unsubscribe(subscriptionId)
  }

  /**
   * Get available game offers
   */
  async getAvailableOffers(skillLevel?: string): Promise<Event[]> {
    const filter: any = {
      kinds: [CHESS_KINDS.GAME_OFFER],
      '#t': ['chess-offer'],
      since: Math.floor(Date.now() / 1000) - 600, // Last 10 minutes
      limit: 50,
    }

    if (skillLevel) {
      filter['#skill'] = [skillLevel]
    }

    const events = await this.client.querySync([filter])

    // Filter out expired offers
    const now = Math.floor(Date.now() / 1000)
    return events.filter(event => {
      const expiresTag = getTagValue(event, 'expires')
      if (!expiresTag) return true
      return parseInt(expiresTag) > now
    })
  }

  /**
   * Get game moves
   */
  async getGameMoves(gameId: string): Promise<Event[]> {
    const filter = {
      kinds: [CHESS_KINDS.LIVE_GAME],
      '#game': [gameId],
      limit: 200, // Max 200 moves per game
    }

    const events = await this.client.querySync([filter])

    // Sort by move number
    return events.sort((a, b) => {
      const moveA = parseInt(getTagValue(a, 'move') || '0')
      const moveB = parseInt(getTagValue(b, 'move') || '0')
      return moveA - moveB
    })
  }

  /**
   * Get game archive
   */
  async getGameArchive(gameId: string): Promise<Event | null> {
    const filter = {
      kinds: [CHESS_KINDS.FINAL_ARCHIVE],
      '#game': [gameId],
      limit: 1,
    }

    const events = await this.client.querySync([filter])
    return events[0] || null
  }

  /**
   * Get user's game history
   */
  async getUserGameHistory(pubkey: string, limit: number = 10): Promise<Event[]> {
    const filter = {
      kinds: [CHESS_KINDS.FINAL_ARCHIVE],
      authors: [pubkey],
      limit,
    }

    return await this.client.querySync([filter])
  }

  /**
   * Convert Nostr event to GameOffer
   */
  eventToGameOffer(event: Event): GameOffer {
    const content = JSON.parse(event.content)
    const skillLevel = getTagValue(event, 'skill') || 'intermediate'
    const variant = getTagValue(event, 'variant') || 'classical'
    const timeControl = getTagValue(event, 'time') || '600+0'
    const expires = getTagValue(event, 'expires')

    return {
      id: event.id,
      eventId: event.id,
      pubkey: event.pubkey,
      variant: variant as any,
      skillLevel: skillLevel as any,
      timeControl,
      message: content.message,
      expires: expires ? parseInt(expires) * 1000 : Date.now() + 300000,
    }
  }

  /**
   * Get the Nostr client instance
   */
  getClient(): NostrClient {
    return this.client
  }
}

/**
 * Create a singleton game service instance
 */
let gameServiceInstance: GameService | null = null

export function getGameService(relays?: string[]): GameService {
  if (!gameServiceInstance) {
    gameServiceInstance = new GameService(relays)
  }
  return gameServiceInstance
}

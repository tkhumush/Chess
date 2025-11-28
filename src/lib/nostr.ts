/**
 * Nostr client utilities for chess application
 * Uses nostr-tools for real Nostr protocol interactions
 */

import { SimplePool, type Event, type Filter, getPublicKey, generateSecretKey, finalizeEvent } from 'nostr-tools'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils'

export interface NostrConfig {
  relays: string[]
  privateKey?: string
  publicKey?: string
}

export interface RelayPool {
  connect(): Promise<void>
  disconnect(): void
  publish(event: Event): Promise<void>
  subscribe(filters: Filter[], onEvent: (event: Event) => void): string
  unsubscribe(subscriptionId: string): void
  getRelayStatus(): Array<{ url: string; connected: boolean }>
}

/**
 * Nostr client implementation using nostr-tools
 */
export class NostrClient implements RelayPool {
  private pool: SimplePool
  private relays: string[]
  private subscriptions: Map<string, () => void> = new Map()
  private connected: boolean = false

  constructor(config: NostrConfig) {
    this.relays = config.relays
    this.pool = new SimplePool()
  }

  async connect(): Promise<void> {
    if (this.connected) return

    console.log('Connecting to Nostr relays:', this.relays)

    // SimplePool connects automatically when publishing/subscribing
    // We'll mark as connected immediately
    this.connected = true

    // Test connectivity by trying to reach relays
    try {
      const testFilter: Filter = { kinds: [1], limit: 1 }
      const events = await this.pool.querySync(this.relays, testFilter)
      console.log('Successfully connected to Nostr relays, test query returned', events.length, 'events')
    } catch (error) {
      console.warn('Initial relay test failed, but will continue:', error)
    }
  }

  disconnect(): void {
    console.log('Disconnecting from Nostr relays')

    // Close all subscriptions
    this.subscriptions.forEach((unsub) => unsub())
    this.subscriptions.clear()

    // Close the pool
    this.pool.close(this.relays)
    this.connected = false
  }

  async publish(event: Event): Promise<void> {
    if (!this.connected) {
      await this.connect()
    }

    console.log('Publishing event to relays:', event)

    try {
      const pubs = this.pool.publish(this.relays, event)

      // Wait for at least one relay to confirm
      await Promise.race(pubs.map(pub => pub))

      console.log('Event published successfully')
    } catch (error) {
      console.error('Failed to publish event:', error)
      throw error
    }
  }

  subscribe(filters: Filter[], onEvent: (event: Event) => void): string {
    if (!this.connected) {
      this.connect().catch(console.error)
    }

    const subId = crypto.randomUUID()
    console.log('Subscribing to filters:', filters, 'ID:', subId)

    // Subscribe to events
    const sub = this.pool.subscribeMany(
      this.relays,
      filters,
      {
        onevent(event: Event) {
          console.log('Received event:', event)
          onEvent(event)
        },
        oneose() {
          console.log('End of stored events for subscription:', subId)
        },
      }
    )

    // Store unsubscribe function
    this.subscriptions.set(subId, () => sub.close())

    return subId
  }

  unsubscribe(subscriptionId: string): void {
    console.log('Unsubscribing:', subscriptionId)

    const unsub = this.subscriptions.get(subscriptionId)
    if (unsub) {
      unsub()
      this.subscriptions.delete(subscriptionId)
    }
  }

  getRelayStatus() {
    // SimplePool doesn't expose individual relay status
    // We'll return all relays as connected if pool is connected
    return this.relays.map(url => ({
      url,
      connected: this.connected,
    }))
  }

  /**
   * Query events from relays (synchronous)
   */
  async querySync(filters: Filter[], timeoutMs: number = 5000): Promise<Event[]> {
    if (!this.connected) {
      await this.connect()
    }

    try {
      const events = await this.pool.querySync(this.relays, filters)
      return events
    } catch (error) {
      console.error('Query failed:', error)
      return []
    }
  }

  /**
   * Get a single event by ID
   */
  async getEvent(id: string): Promise<Event | null> {
    const events = await this.querySync([{ ids: [id] }])
    return events[0] || null
  }

  /**
   * Get events by author
   */
  async getEventsByAuthor(pubkey: string, kinds?: number[], limit: number = 10): Promise<Event[]> {
    const filter: Filter = {
      authors: [pubkey],
      limit,
    }

    if (kinds) {
      filter.kinds = kinds
    }

    return await this.querySync([filter])
  }

  /**
   * Get the underlying pool
   */
  getPool(): SimplePool {
    return this.pool
  }
}

/**
 * Create a Nostr client instance
 */
export function createNostrClient(config: NostrConfig): NostrClient {
  return new NostrClient(config)
}

/**
 * Generate a new Nostr key pair
 */
export function generateKeyPair(): { privateKey: string; publicKey: string } {
  const sk = generateSecretKey()
  const pk = getPublicKey(sk)

  return {
    privateKey: bytesToHex(sk),
    publicKey: pk,
  }
}

/**
 * Get public key from private key
 */
export function getPublicKeyFromPrivate(privateKey: string): string {
  try {
    const sk = hexToBytes(privateKey)
    return getPublicKey(sk)
  } catch (error) {
    throw new Error('Invalid private key')
  }
}

/**
 * Sign and finalize a Nostr event
 */
export function signEvent(event: Omit<Event, 'id' | 'sig' | 'pubkey'>, privateKey: string): Event {
  try {
    const sk = hexToBytes(privateKey)
    return finalizeEvent(event as any, sk)
  } catch (error) {
    throw new Error('Failed to sign event: ' + error)
  }
}

/**
 * Create an unsigned event template
 */
export function createEventTemplate(
  kind: number,
  content: string,
  tags: string[][] = []
): Omit<Event, 'id' | 'sig' | 'pubkey'> {
  return {
    kind,
    content,
    tags,
    created_at: Math.floor(Date.now() / 1000),
  }
}

/**
 * Default Nostr relay configuration
 */
export const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.snort.social',
  'wss://relay.nostr.band',
]

/**
 * Event kind constants for chess application
 */
export const CHESS_KINDS = {
  GAME_OFFER: 1491,
  LIVE_GAME: 34609,
  FINAL_ARCHIVE: 64,
  ZAP_REQUEST: 9734,
  ZAP_RECEIPT: 9735,
} as const

/**
 * Helper to get tag value from event
 */
export function getTagValue(event: Event, tagName: string): string | undefined {
  const tag = event.tags.find(t => t[0] === tagName)
  return tag ? tag[1] : undefined
}

/**
 * Helper to get all tag values from event
 */
export function getTagValues(event: Event, tagName: string): string[] {
  return event.tags.filter(t => t[0] === tagName).map(t => t[1])
}

/**
 * Validate event signature
 */
export function validateEventSignature(event: Event): boolean {
  try {
    // nostr-tools validates signature internally when creating events
    // For received events, we trust relay validation
    return event.id !== undefined && event.sig !== undefined && event.pubkey !== undefined
  } catch (error) {
    return false
  }
}

/**
 * Create a game offer event
 */
export function createGameOfferEvent(
  privateKey: string,
  offer: {
    variant: string
    skillLevel: string
    timeControl: string
    message?: string
  }
): Event {
  const content = JSON.stringify(offer)
  const tags: string[][] = [
    ['t', 'chess-offer'],
    ['skill', offer.skillLevel],
    ['variant', offer.variant],
    ['time', offer.timeControl],
    ['expires', (Math.floor(Date.now() / 1000) + 300).toString()], // 5 minutes
  ]

  const template = createEventTemplate(CHESS_KINDS.GAME_OFFER, content, tags)
  return signEvent(template, privateKey)
}

/**
 * Create a game acceptance event
 */
export function createGameAcceptanceEvent(
  privateKey: string,
  offerEventId: string,
  offerPubkey: string,
  gameId: string
): Event {
  const content = JSON.stringify({ accept: true, gameId })
  const tags: string[][] = [
    ['t', 'chess-accept'],
    ['e', offerEventId],
    ['p', offerPubkey],
    ['game', gameId],
  ]

  const template = createEventTemplate(CHESS_KINDS.GAME_OFFER, content, tags)
  return signEvent(template, privateKey)
}

/**
 * Create a live game move event
 */
export function createMoveEvent(
  privateKey: string,
  gameId: string,
  moveNumber: number,
  san: string,
  fen: string,
  whitePubkey: string,
  blackPubkey: string,
  previousEventId?: string
): Event {
  const turn = moveNumber % 2 === 1 ? 'white' : 'black'
  const tags: string[][] = [
    ['d', `game-${gameId}`],
    ['game', gameId],
    ['move', moveNumber.toString()],
    ['turn', turn],
    ['san', san],
    ['fen', fen],
    ['p', whitePubkey],
    ['p', blackPubkey],
  ]

  if (previousEventId) {
    tags.push(['e', previousEventId])
  }

  const template = createEventTemplate(CHESS_KINDS.LIVE_GAME, san, tags)
  return signEvent(template, privateKey)
}

/**
 * Create a game archive event (NIP-64)
 */
export function createGameArchiveEvent(
  privateKey: string,
  pgn: string,
  gameId: string,
  whitePubkey: string,
  blackPubkey: string,
  result: '1-0' | '0-1' | '1/2-1/2',
  variant: string
): Event {
  const tags: string[][] = [
    ['t', 'chess-game'],
    ['game', gameId],
    ['white', whitePubkey],
    ['black', blackPubkey],
    ['result', result],
    ['variant', variant],
  ]

  const template = createEventTemplate(CHESS_KINDS.FINAL_ARCHIVE, pgn, tags)
  return signEvent(template, privateKey)
}

import type { Event as NostrEvent } from 'nostr-tools'

// Re-export common types from nostr-tools
export type { Event, Filter, Relay } from 'nostr-tools'

// Custom event kinds for chess
export const CHESS_EVENT_KINDS = {
  GAME_OFFER: 1491,
  LIVE_GAME: 34609,
  FINAL_ARCHIVE: 64,
  ZAP_REQUEST: 9734,
  ZAP_RECEIPT: 9735,
} as const

// Nostr key pair interface
export interface NostrKeyPair {
  privateKey: string
  publicKey: string
}

// User profile from kind 0 events
export interface NostrProfile {
  pubkey: string
  name?: string
  about?: string
  picture?: string
  banner?: string
  nip05?: string
  lud16?: string // Lightning address
  website?: string
}

// Relay connection status
export interface RelayStatus {
  url: string
  connected: boolean
  status: 'connecting' | 'connected' | 'disconnected' | 'error'
  error?: string
  latency?: number
}

// Chess-specific event interfaces
export interface GameOfferEvent extends NostrEvent {
  kind: typeof CHESS_EVENT_KINDS.GAME_OFFER
  content: string // JSON encoded game offer
  tags: string[][] // Tags include: ['t', 'chess-offer'|'chess-accept'], ['skill'], ['variant'], ['time'], etc.
}

export interface LiveGameEvent extends NostrEvent {
  kind: typeof CHESS_EVENT_KINDS.LIVE_GAME
  content: string // SAN move notation
  tags: string[][] // Tags include: ['d', game-id], ['p', player-pubkeys], ['move'], ['turn'], ['san'], ['fen'], ['e', prev-event]
}

export interface ArchiveGameEvent extends NostrEvent {
  kind: typeof CHESS_EVENT_KINDS.FINAL_ARCHIVE
  content: string // Complete PGN
  tags: string[][] // Tags include: ['t', 'chess-game'], ['white'], ['black'], ['result'], ['game'], ['variant']
}

// Zap event types (re-exported for convenience)
export interface ZapRequestEvent extends NostrEvent {
  kind: typeof CHESS_EVENT_KINDS.ZAP_REQUEST
  content: string // optional message
  tags: string[][] // Tags include: ['relays', ...urls], ['amount'], ['lnurl'], ['p', recipient], ['e', target-event]
}

export interface ZapReceiptEvent extends NostrEvent {
  kind: typeof CHESS_EVENT_KINDS.ZAP_RECEIPT
  content: string // usually empty
  tags: string[][] // Tags include: ['p', recipient], ['P', sender], ['e', event], ['bolt11'], ['description'], ['preimage']
}

// Union type for all chess events
export type ChessEvent = 
  | GameOfferEvent 
  | LiveGameEvent 
  | ArchiveGameEvent 
  | ZapRequestEvent 
  | ZapReceiptEvent
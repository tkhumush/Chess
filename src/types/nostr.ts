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
  tags: [
    ['t', 'chess-offer' | 'chess-accept'],
    ['skill', string],
    ['variant', string],
    ['time', string],
    ['expires', string]?,
    ['e', string]?, // for acceptance events
    ['p', string]?, // for acceptance events
    ['game', string]?, // for acceptance events
  ]
}

export interface LiveGameEvent extends NostrEvent {
  kind: typeof CHESS_EVENT_KINDS.LIVE_GAME
  content: string // SAN move notation
  tags: [
    ['d', string], // game identifier
    ['p', string], // white player
    ['p', string], // black player
    ['move', string], // move number
    ['turn', 'white' | 'black'],
    ['san', string], // move in SAN
    ['fen', string], // board state
    ['e', string]?, // previous move event
  ]
}

export interface ArchiveGameEvent extends NostrEvent {
  kind: typeof CHESS_EVENT_KINDS.FINAL_ARCHIVE
  content: string // Complete PGN
  tags: [
    ['t', 'chess-game'],
    ['white', string], // white player pubkey
    ['black', string], // black player pubkey
    ['result', '1-0' | '0-1' | '1/2-1/2'],
    ['game', string], // game identifier
    ['variant', string],
  ]
}

// Zap event types (re-exported for convenience)
export interface ZapRequestEvent extends NostrEvent {
  kind: typeof CHESS_EVENT_KINDS.ZAP_REQUEST
  content: string // optional message
  tags: [
    ['relays', ...string[]],
    ['amount', string],
    ['lnurl', string],
    ['p', string], // recipient
    ['e', string]?, // target event (for move zaps)
  ]
}

export interface ZapReceiptEvent extends NostrEvent {
  kind: typeof CHESS_EVENT_KINDS.ZAP_RECEIPT
  content: string // usually empty
  tags: [
    ['p', string], // zap recipient
    ['P', string]?, // zap sender
    ['e', string]?, // target event
    ['bolt11', string], // lightning invoice
    ['description', string], // JSON encoded zap request
    ['preimage', string]?,
  ]
}

// Union type for all chess events
export type ChessEvent = 
  | GameOfferEvent 
  | LiveGameEvent 
  | ArchiveGameEvent 
  | ZapRequestEvent 
  | ZapReceiptEvent
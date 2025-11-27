// TODO: Replace with actual chess.js import when package is installed
// import { Chess } from 'chess.js'
import type { MockChessEngine } from '@/lib/chess'

export type SkillLevel =
  | 'total-beginner'
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'master'

export type GameVariant =
  | 'classical'
  | 'rapid'
  | 'blitz'
  | 'chess960'
  | 'king-of-the-hill'

export type GameStatus =
  | 'waiting'
  | 'active'
  | 'completed'
  | 'abandoned'

export type PlayerColor = 'white' | 'black'

export type GameResult = '1-0' | '0-1' | '1/2-1/2' | '*'

export interface TimeControl {
  initial: number // seconds
  increment: number // seconds per move
}

export interface GameOffer {
  id: string
  pubkey: string
  skillLevel: SkillLevel
  variant: GameVariant
  timeControl: TimeControl
  message?: string
  expires: number // unix timestamp
  eventId: string
}

export interface PlayerProfile {
  pubkey: string
  name?: string
  picture?: string
  skillLevel: SkillLevel
  gamesPlayed: number
  gamesWon: number
  rating?: number
}

export interface GamePlayer {
  pubkey: string
  name?: string
  picture?: string
  color: PlayerColor
  timeRemaining: number
  connected: boolean
}

export interface ChessMove {
  san: string // Standard Algebraic Notation
  fen: string // Board state after move
  moveNumber: number
  color: PlayerColor
  timestamp: number
  eventId: string
  parentEventId?: string
  zaps: ZapInfo[]
}

export interface ZapInfo {
  amount: number // millisatoshis
  sender: string // pubkey
  message?: string
  timestamp: number
}

export interface GameState {
  id: string
  status: GameStatus
  variant: GameVariant
  players: {
    white: GamePlayer
    black: GamePlayer
  }
  moves: ChessMove[]
  currentFen: string
  result?: GameResult
  startTime: number
  endTime?: number
  spectatorCount: number
  chess: MockChessEngine // chess.js instance
}

export interface GameRecord {
  id: string
  pgn: string
  players: {
    white: PlayerProfile
    black: PlayerProfile
  }
  result: GameResult
  date: number
  variant: GameVariant
  eventId: string
}
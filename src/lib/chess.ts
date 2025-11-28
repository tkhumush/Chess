/**
 * Chess engine utilities and validation using chess.js
 * Handles chess logic, move validation, and PGN generation
 */

import { Chess } from 'chess.js'

export interface ChessPosition {
  fen: string
  moves: string[]
  turn: 'w' | 'b'
  isGameOver: boolean
  isCheck: boolean
  isCheckmate: boolean
  isStalemate: boolean
  isDraw: boolean
}

export interface ChessMove {
  from: string
  to: string
  san: string
  piece: string
  captured?: string
  promotion?: string
  flags: string
  color: 'w' | 'b'
}

/**
 * Chess engine wrapper around chess.js
 * Provides a consistent interface for chess operations
 */
export class ChessEngine {
  private game: Chess

  constructor(fen?: string) {
    this.game = new Chess(fen)
  }

  /**
   * Get current FEN position
   */
  fen(): string {
    return this.game.fen()
  }

  /**
   * Get PGN of the game
   */
  pgn(): string {
    return this.game.pgn()
  }

  /**
   * Get move history
   */
  history(options?: { verbose: boolean }): string[] | ChessMove[] {
    return this.game.history(options as any)
  }

  /**
   * Get current turn
   */
  turn(): 'w' | 'b' {
    return this.game.turn()
  }

  /**
   * Check if game is over
   */
  isGameOver(): boolean {
    return this.game.isGameOver()
  }

  /**
   * Check if current position is checkmate
   */
  isCheckmate(): boolean {
    return this.game.isCheckmate()
  }

  /**
   * Check if current position is stalemate
   */
  isStalemate(): boolean {
    return this.game.isStalemate()
  }

  /**
   * Check if current position is a draw
   */
  isDraw(): boolean {
    return this.game.isDraw()
  }

  /**
   * Check if king is in check
   */
  isCheck(): boolean {
    return this.game.isCheck()
  }

  /**
   * Check if position is threefold repetition
   */
  isThreefoldRepetition(): boolean {
    return this.game.isThreefoldRepetition()
  }

  /**
   * Check if insufficient material for checkmate
   */
  isInsufficientMaterial(): boolean {
    return this.game.isInsufficientMaterial()
  }

  /**
   * Get all legal moves
   * @param options - Optional filters (square, verbose)
   */
  moves(options?: { square?: string; verbose?: boolean }): any[] {
    return this.game.moves(options as any)
  }

  /**
   * Make a move
   * @param move - Move in SAN notation or {from, to, promotion} object
   */
  move(move: string | { from: string; to: string; promotion?: string }): ChessMove | null {
    try {
      const result = this.game.move(move as any)
      if (!result) return null

      return {
        from: result.from,
        to: result.to,
        san: result.san,
        piece: result.piece,
        captured: result.captured,
        promotion: result.promotion,
        flags: result.flags,
        color: result.color,
      }
    } catch (error) {
      return null
    }
  }

  /**
   * Load a position from FEN
   */
  load(fen: string): boolean {
    try {
      this.game.load(fen)
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Reset to starting position
   */
  reset(): void {
    this.game.reset()
  }

  /**
   * Undo last move
   */
  undo(): ChessMove | null {
    const result = this.game.undo()
    if (!result) return null

    return {
      from: result.from,
      to: result.to,
      san: result.san,
      piece: result.piece,
      captured: result.captured,
      promotion: result.promotion,
      flags: result.flags,
      color: result.color,
    }
  }

  /**
   * Get the piece at a square
   */
  get(square: string): { type: string; color: 'w' | 'b' } | null {
    return this.game.get(square as any)
  }

  /**
   * Put a piece on a square
   */
  put(piece: { type: string; color: 'w' | 'b' }, square: string): boolean {
    return this.game.put(piece as any, square as any)
  }

  /**
   * Remove a piece from a square
   */
  remove(square: string): { type: string; color: 'w' | 'b' } | null {
    return this.game.remove(square as any)
  }

  /**
   * Get current position as object
   */
  getPosition(): ChessPosition {
    return {
      fen: this.fen(),
      moves: this.history() as string[],
      turn: this.turn(),
      isGameOver: this.isGameOver(),
      isCheck: this.isCheck(),
      isCheckmate: this.isCheckmate(),
      isStalemate: this.isStalemate(),
      isDraw: this.isDraw(),
    }
  }

  /**
   * Get ASCII representation of the board
   */
  ascii(): string {
    return this.game.ascii()
  }

  /**
   * Load PGN
   */
  loadPgn(pgn: string): boolean {
    try {
      this.game.loadPgn(pgn)
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Get the underlying chess.js instance
   */
  getGame(): Chess {
    return this.game
  }
}

/**
 * Create a new chess engine instance
 */
export function createChessEngine(fen?: string): ChessEngine {
  return new ChessEngine(fen)
}

/**
 * Validate a chess move in Standard Algebraic Notation
 */
export function validateMove(san: string): boolean {
  // Basic SAN validation regex
  const sanRegex = /^[NBRQK]?[a-h]?[1-8]?x?[a-h][1-8](=[NBRQ])?[+#]?$/
  const pawnMoveRegex = /^[a-h][1-8](=[NBRQ])?[+#]?$/
  const castleRegex = /^(O-O|O-O-O)[+#]?$/

  return sanRegex.test(san) || pawnMoveRegex.test(san) || castleRegex.test(san)
}

/**
 * Convert time in seconds to chess time format (MM:SS)
 */
export function formatChessTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

/**
 * Parse PGN and extract game information
 */
export function parsePGN(pgn: string): {
  headers: Record<string, string>
  moves: string[]
} {
  const game = new Chess()
  try {
    game.loadPgn(pgn)
    const history = game.history()

    // Extract headers from PGN
    const headers: Record<string, string> = {}
    const headerRegex = /\[(\w+)\s+"([^"]+)"\]/g
    let match
    while ((match = headerRegex.exec(pgn)) !== null) {
      headers[match[1]] = match[2]
    }

    return { headers, moves: history }
  } catch (error) {
    return { headers: {}, moves: [] }
  }
}

/**
 * Generate PGN from game data
 */
export function generatePGN(
  moves: string[],
  headers: Record<string, string> = {},
  result: string = '*'
): string {
  const game = new Chess()

  // Make all the moves
  for (const move of moves) {
    try {
      game.move(move)
    } catch (error) {
      console.error('Invalid move in PGN generation:', move)
      break
    }
  }

  // Set headers
  const defaultHeaders = {
    Event: 'Nostr Chess Game',
    Site: 'Nostr Network',
    Date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
    Round: '1',
    White: 'White Player',
    Black: 'Black Player',
    Result: result,
    ...headers,
  }

  game.header(...Object.entries(defaultHeaders).flat() as any)

  return game.pgn()
}

/**
 * Validate FEN string
 */
export function validateFEN(fen: string): boolean {
  try {
    new Chess(fen)
    return true
  } catch (error) {
    return false
  }
}

/**
 * Get game result from position
 */
export function getGameResult(game: ChessEngine): '1-0' | '0-1' | '1/2-1/2' | '*' {
  if (!game.isGameOver()) return '*'

  if (game.isCheckmate()) {
    return game.turn() === 'w' ? '0-1' : '1-0'
  }

  if (game.isDraw() || game.isStalemate() || game.isThreefoldRepetition() || game.isInsufficientMaterial()) {
    return '1/2-1/2'
  }

  return '*'
}

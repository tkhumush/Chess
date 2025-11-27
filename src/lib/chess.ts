/**
 * Chess engine utilities and validation
 * Handles chess logic, move validation, and PGN generation
 */

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
}

/**
 * Mock chess engine for development
 * TODO: Replace with actual chess.js implementation
 */
export class MockChessEngine {
  private position: string = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
  private moveHistory: string[] = []
  private gameOver: boolean = false

  constructor(fen?: string) {
    if (fen) {
      this.position = fen
    }
  }

  fen(): string {
    return this.position
  }

  pgn(): string {
    if (this.moveHistory.length === 0) return '*'
    
    let pgn = ''
    for (let i = 0; i < this.moveHistory.length; i += 2) {
      const moveNumber = Math.floor(i / 2) + 1
      pgn += `${moveNumber}. ${this.moveHistory[i]}`
      if (this.moveHistory[i + 1]) {
        pgn += ` ${this.moveHistory[i + 1]}`
      }
      pgn += ' '
    }
    
    if (this.gameOver) {
      pgn += '1-0' // Mock result
    } else {
      pgn += '*'
    }
    
    return pgn.trim()
  }

  history(): string[] {
    return [...this.moveHistory]
  }

  turn(): 'w' | 'b' {
    return this.moveHistory.length % 2 === 0 ? 'w' : 'b'
  }

  isGameOver(): boolean {
    return this.gameOver
  }

  isCheckmate(): boolean {
    return this.gameOver && this.moveHistory.length > 10 // Mock checkmate after 5+ moves
  }

  isStalemate(): boolean {
    return false // Mock - no stalemate
  }

  isDraw(): boolean {
    return false // Mock - no draws
  }

  isCheck(): boolean {
    return false // Mock - no check detection
  }

  moves(options?: { square?: string; verbose?: boolean }): any[] {
    // Mock legal moves
    const allMoves = ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6']
    
    if (options?.verbose) {
      return allMoves.map(san => ({
        san,
        from: 'e2',
        to: 'e4',
        piece: 'p',
        flags: '',
      }))
    }
    
    return allMoves
  }

  move(move: string | { from: string; to: string; promotion?: string }): ChessMove | null {
    let san: string
    
    if (typeof move === 'string') {
      san = move
    } else {
      // Convert algebraic to SAN (simplified)
      san = move.from + move.to
      if (move.promotion) {
        san += '=' + move.promotion.toUpperCase()
      }
    }
    
    // Mock validation - accept common opening moves
    const validMoves = ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7']
    
    if (!validMoves.includes(san) && this.moveHistory.length < 10) {
      return null // Invalid move
    }
    
    // Add move to history
    this.moveHistory.push(san)
    
    // Update position (simplified)
    this.updatePosition(san)
    
    // Check for game over (mock after 20 moves)
    if (this.moveHistory.length >= 20) {
      this.gameOver = true
    }
    
    return {
      san,
      from: 'e2',
      to: 'e4',
      piece: 'p',
      flags: '',
    }
  }

  private updatePosition(san: string): void {
    // Mock position update - just increment move counter
    const parts = this.position.split(' ')
    const fullMoveNumber = parseInt(parts[5]) + (this.turn() === 'w' ? 1 : 0)
    const halfMoveNumber = parseInt(parts[4]) + 1
    
    parts[1] = this.turn() === 'w' ? 'b' : 'w' // Switch turn
    parts[4] = halfMoveNumber.toString()
    if (this.turn() === 'w') {
      parts[5] = fullMoveNumber.toString()
    }
    
    this.position = parts.join(' ')
  }

  load(fen: string): boolean {
    try {
      this.position = fen
      return true
    } catch (error) {
      return false
    }
  }

  reset(): void {
    this.position = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    this.moveHistory = []
    this.gameOver = false
  }
}

/**
 * Create a new chess engine instance
 */
export function createChessEngine(fen?: string): MockChessEngine {
  return new MockChessEngine(fen)
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
  const lines = pgn.trim().split('\n')
  const headers: Record<string, string> = {}
  const moves: string[] = []
  
  let inHeaders = true
  
  for (const line of lines) {
    if (inHeaders && line.startsWith('[') && line.endsWith(']')) {
      const match = line.match(/\[(\w+)\s+"(.*)"\]/)
      if (match) {
        headers[match[1]] = match[2]
      }
    } else if (line.trim() === '') {
      inHeaders = false
    } else if (!inHeaders) {
      // Extract moves (simplified)
      const moveMatches = line.match(/\d+\.\s*(\S+)(?:\s+(\S+))?/g)
      if (moveMatches) {
        for (const match of moveMatches) {
          const parts = match.split(/\s+/)
          if (parts[1]) moves.push(parts[1])
          if (parts[2]) moves.push(parts[2])
        }
      }
    }
  }
  
  return { headers, moves }
}

/**
 * Generate PGN from game data
 */
export function generatePGN(
  moves: string[], 
  headers: Record<string, string> = {},
  result: string = '*'
): string {
  let pgn = ''
  
  // Add headers
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
  
  for (const [key, value] of Object.entries(defaultHeaders)) {
    pgn += `[${key} "${value}"]\n`
  }
  
  pgn += '\n'
  
  // Add moves
  for (let i = 0; i < moves.length; i += 2) {
    const moveNumber = Math.floor(i / 2) + 1
    pgn += `${moveNumber}. ${moves[i]}`
    if (moves[i + 1]) {
      pgn += ` ${moves[i + 1]}`
    }
    pgn += ' '
  }
  
  pgn += result
  
  return pgn.trim()
}
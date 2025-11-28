import { useState } from 'react'
import { Chessboard } from 'react-chessboard'
import type { Square } from 'react-chessboard/dist/chessboard/types'
import { useAppStore } from '@/stores/appStore'
import type { GameState, PlayerColor } from '@/types/chess'

interface ChessBoardProps {
  game: GameState
  playerColor: PlayerColor
}

export default function ChessBoard({ game, playerColor }: ChessBoardProps) {
  const [rightClickedSquares, setRightClickedSquares] = useState<Record<string, any>>({})
  const [moveFrom, setMoveFrom] = useState<Square | null>(null)
  const [moveTo, setMoveTo] = useState<Square | null>(null)
  const [showPromotionDialog, setShowPromotionDialog] = useState(false)
  const [optionSquares, setOptionSquares] = useState<Record<string, any>>({})

  const { makeMove, selectedMove } = useAppStore()

  // Get current position for move navigation
  const currentPosition = selectedMove !== null 
    ? (game.moves[selectedMove]?.fen || game.currentFen)
    : game.currentFen

  // Check if it's player's turn
  const isPlayerTurn = game.chess.turn() === (playerColor === 'white' ? 'w' : 'b')

  function safeGameMutate(modify: () => void) {
    // Create a copy of the chess instance for safe mutation
    const gameCopy = { ...game.chess }
    modify()
    return gameCopy
  }

  function getMoveOptions(square: Square) {
    const moves = game.chess.moves({
      square,
      verbose: true,
    })
    
    if (moves.length === 0) {
      setOptionSquares({})
      return false
    }

    const newSquares: Record<string, any> = {}
    moves.map((move) => {
      newSquares[move.to] = {
        background: move.captured
          ? 'radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)'
          : 'radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)',
        borderRadius: '50%',
      }
      return move
    })
    
    newSquares[square] = {
      background: 'rgba(255, 255, 0, 0.4)',
    }
    
    setOptionSquares(newSquares)
    return true
  }

  function onSquareClick(square: Square) {
    // Don't allow moves if not player's turn
    if (!isPlayerTurn || selectedMove !== null) {
      return
    }

    setRightClickedSquares({})

    function resetFirstMove(square: Square) {
      const hasOptions = getMoveOptions(square)
      if (hasOptions) setMoveFrom(square)
    }

    // from square
    if (!moveFrom) {
      resetFirstMove(square)
      return
    }

    // to square
    if (!moveTo) {
      // check if valid move before showing promotion dialog
      const moves = game.chess.moves({
        square: moveFrom,
        verbose: true,
      })
      const foundMove = moves.find((m) => m.from === moveFrom && m.to === square)
      
      // not a valid move
      if (!foundMove) {
        // check if clicked on new piece
        const hasMoveOptions = getMoveOptions(square)
        setMoveFrom(hasMoveOptions ? square : null)
        return
      }

      // valid move
      setMoveTo(square)

      // if promotion move
      if (foundMove.promotion) {
        setShowPromotionDialog(true)
        return
      }

      // is normal move
      const move = makeMove(foundMove.san)
      if (move) {
        setMoveFrom(null)
        setMoveTo(null)
        setOptionSquares({})
      }
    }
  }

  function onPromotionPieceSelect(piece?: string) {
    // if no piece passed then user has cancelled dialog, don't make move and reset
    if (piece === undefined) {
      setMoveFrom(null)
      setMoveTo(null)
      setShowPromotionDialog(false)
      return
    }

    const moves = game.chess.moves({
      square: moveFrom!,
      verbose: true,
    })
    const foundMove = moves.find(
      (m) => m.from === moveFrom && m.to === moveTo && m.promotion === piece[1].toLowerCase()
    )

    if (foundMove) {
      const move = makeMove(foundMove.san)
      if (move) {
        setMoveFrom(null)
        setMoveTo(null)
        setShowPromotionDialog(false)
        setOptionSquares({})
      }
    }
  }

  function onSquareRightClick(square: Square) {
    const colour = 'rgba(0, 0, 255, 0.4)'
    setRightClickedSquares({
      ...rightClickedSquares,
      [square]:
        rightClickedSquares[square] &&
        rightClickedSquares[square].backgroundColor === colour
          ? undefined
          : { backgroundColor: colour },
    })
  }

  return (
    <div className="relative">
      <div className="chess-board">
        <Chessboard
          position={currentPosition}
          onSquareClick={onSquareClick}
          onSquareRightClick={onSquareRightClick}
          onPromotionPieceSelect={onPromotionPieceSelect}
          promotionToSquare={moveTo}
          showPromotionDialog={showPromotionDialog}
          customSquareStyles={{
            ...optionSquares,
            ...rightClickedSquares,
          }}
          boardOrientation={playerColor}
          animationDuration={200}
          arePiecesDraggable={false} // We'll use click-to-move for now
          customBoardStyle={{
            borderRadius: '8px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          }}
        />
      </div>

      {/* Game Status Overlay */}
      {game.status !== 'active' && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
          <div className="bg-white rounded-lg p-6 text-center shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Game Over
            </h3>
            <p className="text-gray-600 mb-4">
              {game.result === '1-0' && 'White wins!'}
              {game.result === '0-1' && 'Black wins!'}
              {game.result === '1/2-1/2' && 'Draw!'}
              {game.result === '*' && 'Game abandoned'}
            </p>
            <button
              onClick={() => {
                // TODO: Go back to home page or offer rematch
              }}
              className="btn-primary"
            >
              New Game
            </button>
          </div>
        </div>
      )}

      {/* Turn Indicator */}
      {game.status === 'active' && (
        <div className="mt-4 text-center">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            isPlayerTurn
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {isPlayerTurn ? 'Your turn' : 'Opponent\'s turn'}
          </div>
        </div>
      )}
    </div>
  )
}
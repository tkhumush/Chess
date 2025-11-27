// Mock implementations for development
// TODO: Replace with actual imports when packages are installed
// import { create } from 'zustand'
// import { subscribeWithSelector } from 'zustand/middleware'

import { create, subscribeWithSelector } from '@/lib/store'
import { MockChessEngine } from '@/lib/chess'
import type {
  GameState,
  GameOffer,
  GameRecord,
  PlayerProfile,
  SkillLevel,
  GameVariant
} from '@/types/chess'
import type {
  NostrKeyPair,
  NostrProfile,
  RelayStatus
} from '@/types/nostr'

interface AppState {
  // Authentication & Identity
  keys: NostrKeyPair | null
  profile: NostrProfile | null

  // Game State
  currentGame: GameState | null
  gameHistory: GameRecord[]

  // Matchmaking
  availableGames: GameOffer[]
  myOffers: GameOffer[]

  // Network
  relayStatus: RelayStatus[]
  isConnected: boolean

  // UI State
  selectedMove: number | null
  showSpectators: boolean
  zapsEnabled: boolean
  sidePanel: 'moves' | 'spectators' | 'chat'

  // Preferences
  skillLevel: SkillLevel
  preferredVariant: GameVariant
  autoAcceptDraws: boolean
  soundEnabled: boolean
}

interface AppActions {
  // Auth actions
  setKeys: (keys: NostrKeyPair | null) => void
  setProfile: (profile: NostrProfile | null) => void

  // Game actions
  startGame: (gameState: GameState) => void
  endGame: () => void
  makeMove: (san: string) => boolean
  selectMove: (moveIndex: number | null) => void

  // Matchmaking actions
  createGameOffer: (offer: Omit<GameOffer, 'id' | 'eventId' | 'pubkey'>) => void
  acceptGameOffer: (offerId: string) => void
  cancelGameOffer: (offerId: string) => void
  updateAvailableGames: (games: GameOffer[]) => void

  // Network actions
  updateRelayStatus: (relayStatus: RelayStatus[]) => void
  setConnected: (connected: boolean) => void

  // UI actions
  setSidePanel: (panel: 'moves' | 'spectators' | 'chat') => void
  toggleSpectators: () => void
  toggleZaps: () => void

  // Preferences
  setSkillLevel: (level: SkillLevel) => void
  setPreferredVariant: (variant: GameVariant) => void
  toggleAutoAcceptDraws: () => void
  toggleSound: () => void

  // Utility actions
  reset: () => void
}

type AppStore = AppState & AppActions

const initialState: AppState = {
  // Auth
  keys: null,
  profile: null,

  // Game
  currentGame: null,
  gameHistory: [],

  // Matchmaking
  availableGames: [],
  myOffers: [],

  // Network
  relayStatus: [],
  isConnected: false,

  // UI
  selectedMove: null,
  showSpectators: false,
  zapsEnabled: true,
  sidePanel: 'moves',

  // Preferences
  skillLevel: 'intermediate',
  preferredVariant: 'classical',
  autoAcceptDraws: false,
  soundEnabled: true,
}

export const useAppStore = create<AppStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // Auth actions
    setKeys: (keys) => set({ keys }),
    setProfile: (profile) => set({ profile }),

    // Game actions
    startGame: (gameState) => set({ currentGame: gameState }),

    endGame: () => {
      const { currentGame } = get()
      if (currentGame) {
        // Add to history
        const record: GameRecord = {
          id: currentGame.id,
          pgn: currentGame.chess.pgn(),
          players: {
            white: {
              pubkey: currentGame.players.white.pubkey,
              name: currentGame.players.white.name,
              skillLevel: get().skillLevel, // TODO: get from player profile
              gamesPlayed: 0,
              gamesWon: 0,
            },
            black: {
              pubkey: currentGame.players.black.pubkey,
              name: currentGame.players.black.name,
              skillLevel: get().skillLevel, // TODO: get from player profile
              gamesPlayed: 0,
              gamesWon: 0,
            },
          },
          result: currentGame.result || '*',
          date: Date.now(),
          variant: currentGame.variant,
          eventId: '', // TODO: set archive event ID
        }

        set(state => ({
          currentGame: null,
          gameHistory: [record, ...state.gameHistory],
          selectedMove: null,
        }))
      }
    },

    makeMove: (san) => {
      const { currentGame } = get()
      if (!currentGame) return false

      try {
        // Validate and make move
        const move = currentGame.chess.move(san)
        if (!move) return false

        // Update game state
        const newMove = {
          san: move.san,
          fen: currentGame.chess.fen(),
          moveNumber: Math.ceil(currentGame.chess.history().length / 2),
          color: move.color === 'w' ? 'white' : 'black',
          timestamp: Date.now(),
          eventId: '', // TODO: set when published to Nostr
          zaps: [],
        }

        set(state => ({
          currentGame: {
            ...currentGame,
            moves: [...currentGame.moves, newMove],
            currentFen: currentGame.chess.fen(),
            result: currentGame.chess.isGameOver() ?
              (currentGame.chess.isCheckmate() ?
                (move.color === 'w' ? '1-0' : '0-1') : '1/2-1/2') :
              undefined,
          }
        }))

        return true
      } catch (error) {
        console.error('Invalid move:', error)
        return false
      }
    },

    selectMove: (moveIndex) => set({ selectedMove: moveIndex }),

    // Matchmaking actions
    createGameOffer: (offer) => {
      const { keys } = get()
      if (!keys) return

      const newOffer: GameOffer = {
        ...offer,
        id: crypto.randomUUID(),
        pubkey: keys.publicKey,
        eventId: '', // TODO: set when published
        expires: Date.now() + (5 * 60 * 1000), // 5 minutes
      }

      set(state => ({
        myOffers: [...state.myOffers, newOffer]
      }))
    },

    acceptGameOffer: (offerId) => {
      // TODO: Implement game acceptance logic
      console.log('Accepting game offer:', offerId)
    },

    cancelGameOffer: (offerId) => {
      set(state => ({
        myOffers: state.myOffers.filter(offer => offer.id !== offerId)
      }))
    },

    updateAvailableGames: (games) => set({ availableGames: games }),

    // Network actions
    updateRelayStatus: (relayStatus) => {
      const isConnected = relayStatus.some(relay => relay.connected)
      set({ relayStatus, isConnected })
    },

    setConnected: (isConnected) => set({ isConnected }),

    // UI actions
    setSidePanel: (sidePanel) => set({ sidePanel }),
    toggleSpectators: () => set(state => ({ showSpectators: !state.showSpectators })),
    toggleZaps: () => set(state => ({ zapsEnabled: !state.zapsEnabled })),

    // Preferences
    setSkillLevel: (skillLevel) => set({ skillLevel }),
    setPreferredVariant: (preferredVariant) => set({ preferredVariant }),
    toggleAutoAcceptDraws: () => set(state => ({ autoAcceptDraws: !state.autoAcceptDraws })),
    toggleSound: () => set(state => ({ soundEnabled: !state.soundEnabled })),

    // Utility
    reset: () => set(initialState),
  }))
)

// Helper function to create a new game state
export function createGameState(
  gameId: string,
  whitePlayer: { pubkey: string; name?: string },
  blackPlayer: { pubkey: string; name?: string },
  variant: GameVariant = 'classical'
): GameState {
  return {
    id: gameId,
    status: 'active',
    variant,
    players: {
      white: {
        pubkey: whitePlayer.pubkey,
        name: whitePlayer.name,
        color: 'white',
        timeRemaining: 600, // 10 minutes default
        connected: true,
      },
      black: {
        pubkey: blackPlayer.pubkey,
        name: blackPlayer.name,
        color: 'black',
        timeRemaining: 600,
        connected: true,
      },
    },
    moves: [],
    currentFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    startTime: Date.now(),
    spectatorCount: 0,
    chess: new MockChessEngine(),
  }
}
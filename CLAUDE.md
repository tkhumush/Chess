# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nostr Chess is a decentralized multiplayer chess web application built with React and TypeScript. It uses the Nostr protocol for game coordination while completely abstracting away protocol complexity from end users. The app is frontend-only with no backend required—all coordination happens through WebSocket connections to Nostr relays.

## Current Status (Last Updated: 2025-11-27)

**Phase 1: COMPLETED ✅**
- Real chess.js integration (ChessEngine wrapper)
- Real nostr-tools integration (NostrClient with SimplePool)
- Game service layer implemented
- React hooks created (useNostr, useGameOffers, useGameMoves, useGameActions)
- All components have proper React imports
- Development server running successfully
- All dependencies installed (467 packages)

**Known Issues:**
- Browser may show white page initially - requires hard refresh after fixes
- Components render but Nostr integration not yet wired to UI
- Game state management works but needs connection to live components

## Development Commands

```bash
# Start development server (runs on http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check

# Run tests
npm test
```

## Architecture Overview

### Core Design Principles

1. **Frontend-Only Architecture**: No backend server. Direct WebSocket connections to Nostr relays.
2. **Zero Nostr Exposure**: Users never see pubkeys, relays, events, or signing—only chess UI.
3. **Event-Driven State**: All game actions represented as Nostr events with deterministic ordering.
4. **Strict PGN Compliance**: All moves follow standard chess notation and validation.

### Technology Stack

- **UI**: React 18 + TypeScript, Tailwind CSS
- **Chess Engine**: chess.js (move validation, PGN generation), react-chessboard (interactive board)
- **Protocol**: nostr-tools (Nostr protocol), custom WebSocket relay pool
- **State**: Zustand (app state), React Query (event caching)
- **Build**: Vite with path alias `@/` pointing to `src/`

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ChessBoard.tsx   # Interactive chess board wrapper
│   ├── MoveList.tsx     # Game move history display
│   ├── PlayerCard.tsx   # Player info and status
│   ├── ZapButton.tsx    # Lightning tip button
│   └── ...
├── pages/               # Main application pages
│   ├── HomePage.tsx     # Landing page with matchmaking
│   └── GamePage.tsx     # Active game interface
├── stores/              # Zustand state management
│   └── appStore.ts      # Main application store (auth, game, matchmaking, network, UI)
├── lib/                 # Core libraries and utilities
│   ├── chess.ts         # Chess engine wrapper (MockChessEngine)
│   ├── nostr.ts         # Nostr client implementation (MockNostrClient)
│   ├── store.ts         # Zustand utilities (create, subscribeWithSelector)
│   └── react.ts         # React utilities
├── types/               # TypeScript type definitions
│   ├── chess.ts         # Chess-related types (GameState, GameOffer, PlayerProfile, etc.)
│   └── nostr.ts         # Nostr protocol types (event kinds, schemas)
├── utils/               # Helper functions
└── main.tsx            # Application entry point
```

## Nostr Protocol Design

### Event Kinds

The application uses custom Nostr event kinds for decentralized chess:

- **kind: 1491** - Game offers and matchmaking (create/accept games)
- **kind: 34609** - Live game state (addressable/replaceable move events)
- **kind: 64** - Final game archives (NIP-64 PGN format)
- **kind: 9734/9735** - Lightning zaps (NIP-57 tipping)

### Event Schema Details

**Game Offers (kind: 1491)**:
- Content: JSON with `{variant, skillLevel, timeControl, message}`
- Tags: `['t', 'chess-offer']`, `['skill', level]`, `['variant', type]`, `['time', control]`, `['expires', timestamp]`
- Acceptance events reference original offer via `['e', offer-event-id]` tag

**Live Moves (kind: 34609)**:
- Addressable events (prevents duplicate moves per turn)
- Content: SAN notation of move (e.g., "e4")
- Critical tags:
  - `['d', 'game-{uuid}']` - identifier for addressable events
  - `['prev', event-id]` - reference to previous move (creates unbreakable chain)
  - `['san', move]` - Standard Algebraic Notation
  - `['fen', fen-string]` - Complete board state for verification
  - `['move', number]` - Move sequence number
  - `['turn', 'white'|'black']` - Whose turn it is

**Game Archives (kind: 64)**:
- NIP-64 compliant complete PGN
- Published when game ends
- Tags include players, result, variant, move count

### Anti-Cheat Mechanisms

1. **Sequential Move Chain**: Each move MUST reference previous move's event ID via `prev` tag
2. **Fork Detection**: Multiple moves referencing same parent trigger conflict resolution
3. **Honest Player Authority**: When fork detected, valid player chooses correct move
4. **Client-Side Validation**: chess.js validates all moves before publishing to relay
5. **Timestamp Independence**: Move order determined by event chain, NOT timestamps

## State Management (Zustand)

The `appStore.ts` contains the entire application state:

**State Sections**:
- **Auth**: `keys` (NostrKeyPair), `profile` (NostrProfile)
- **Game**: `currentGame` (GameState), `gameHistory` (GameRecord[])
- **Matchmaking**: `availableGames`, `myOffers`
- **Network**: `relayStatus`, `isConnected`
- **UI**: `selectedMove`, `showSpectators`, `zapsEnabled`, `sidePanel`
- **Preferences**: `skillLevel`, `preferredVariant`, `autoAcceptDraws`, `soundEnabled`

**Key Actions**:
- Game: `startGame()`, `endGame()`, `makeMove(san)`, `selectMove(index)`
- Matchmaking: `createGameOffer()`, `acceptGameOffer()`, `cancelGameOffer()`
- Network: `updateRelayStatus()`, `setConnected()`

**Helper Function**:
- `createGameState(gameId, white, black, variant)` - Creates new game state with MockChessEngine

## Important Implementation Notes

### Current State (Phase 1 - COMPLETED)
- ✅ **Real chess.js integration** - ChessEngine wrapper with full functionality
- ✅ **Real nostr-tools integration** - NostrClient using SimplePool
- ✅ **Game service layer** - High-level API for game management
- ✅ **React hooks** - useNostr, useGameOffers, useGameMoves, useGameActions
- ✅ **Automatic key generation** - Keys stored in localStorage
- ✅ **Real relay connections** - Connected to 4 default Nostr relays

### Real Implementation Details
The app now uses production-ready implementations:
- **ChessEngine** (`lib/chess.ts`) - Wrapper around chess.js with full API
- **NostrClient** (`lib/nostr.ts`) - Uses nostr-tools SimplePool for relay management
- **GameService** (`services/gameService.ts`) - High-level service for game operations
- **React Hooks** (`hooks/useNostr.ts`) - Easy integration in components

### Move Validation Pipeline
When making a move:
1. Client validates move legality using ChessEngine (chess.js wrapper)
2. If valid, update local game state via appStore.makeMove()
3. Publish move using gameService.publishMove() which creates kind: 34609 event
4. Event automatically published to multiple relays for redundancy
5. Opponent receives move via useGameMoves() hook subscription
6. Opponent validates move using their ChessEngine before applying

### How to Use the Game Service

```typescript
// Initialize Nostr in a component
import { useNostr, useGameActions } from '@/hooks/useNostr'

function Component() {
  const { isReady, gameService } = useNostr()
  const { publishOffer, publishMove } = useGameActions()

  // Publish a game offer
  await publishOffer({
    variant: 'classical',
    skillLevel: 'intermediate',
    timeControl: '600+0',
    message: 'Looking for a game!'
  })

  // Publish a move
  await publishMove(gameId, moveNum, 'e4', fen, white, black, prevEventId)
}
```

### Relay Configuration
Default relays (see `lib/nostr.ts`):
- `wss://relay.damus.io`
- `wss://nos.lol`
- `wss://relay.snort.social`
- `wss://relay.nostr.band`

Can be overridden via environment variable `VITE_DEFAULT_RELAYS`.

## Testing Strategy

Planned testing layers (not yet fully implemented):
- **Unit tests**: Chess logic, Nostr event creation/validation, state management
- **Component tests**: Board interaction, move list, player cards, zap buttons
- **Integration tests**: Complete game flows, matchmaking, network failures
- **E2E tests**: Full user journeys, multi-client scenarios

Vite config includes test setup with globals and jsdom environment.

## Design Philosophy

### User Experience
- Progressive disclosure: don't overwhelm users with features
- Chess-first terminology: "Finding opponents" not "querying relays"
- Responsive design: mobile-first, touch-friendly piece movement
- Accessibility: screen reader support, keyboard navigation, high contrast mode

### Code Patterns
- Type safety: Strict TypeScript throughout
- Component composition: Small, focused components
- Separation of concerns: UI components don't know about Nostr internals
- Error boundaries: Graceful fallbacks for network/protocol issues

## Development Phases (from IMPLEMENTATION_PLAN.md)

1. **Phase 1 (Weeks 1-2)**: Core chess engine ✨ - MOSTLY COMPLETE
2. **Phase 2 (Weeks 3-4)**: Nostr integration 🔄 - IN PROGRESS
3. **Phase 3 (Weeks 5-6)**: Real-time gameplay 🎯 - PLANNED
4. **Phase 4 (Weeks 7-8)**: Social & Lightning features ⚡ - PLANNED
5. **Phase 5 (Weeks 9-10)**: Production & polish 🚀 - PLANNED

## Additional Resources

- **DESIGN.md**: Comprehensive technical specification including event schemas, UI design, security
- **IMPLEMENTATION_PLAN.md**: Detailed week-by-week implementation roadmap
- **SETUP.md**: Development setup guide and dependency information
- **README.md**: Project overview, features, protocol design, getting started

## Key Files to Understand

When working on specific features:
- **Chess Engine**: `src/lib/chess.ts` (ChessEngine class, move validation, PGN)
- **Nostr Client**: `src/lib/nostr.ts` (NostrClient class, event publishing, subscriptions)
- **Game Service**: `src/services/gameService.ts` (high-level game management API)
- **React Hooks**: `src/hooks/useNostr.ts` (useNostr, useGameOffers, useGameActions)
- **Game State**: `src/stores/appStore.ts` (Zustand store with makeMove, startGame, endGame)
- **Type definitions**: `src/types/chess.ts`, `src/types/nostr.ts`
- **UI layout**: `src/pages/GamePage.tsx`, `src/components/ChessBoard.tsx`
- **Move chain validation**: See anti-cheat section in DESIGN.md

## Next Steps (Priority Order)

### 1. Wire Up Nostr in App.tsx (HIGH PRIORITY)
Currently the `useNostr` hook is created but not used. Need to:
```typescript
// In App.tsx
import { useNostr } from '@/hooks/useNostr'

function App() {
  const { isReady, error } = useNostr() // Initialize Nostr connection
  // ... rest of component
}
```

### 2. Update MatchmakingPanel to Use Real Offers
Currently shows mock data. Need to:
- Use `useGameOffers()` hook to get real offers from relays
- Wire up `createGameOffer()` from `useGameActions()` when user creates offer
- Display real offers from Nostr network

### 3. Wire Up Move Publishing in ChessBoard
When a move is made:
- Call `publishMove()` from `useGameActions()` hook
- Publish to Nostr relays with proper event chain
- Update local state via `appStore.makeMove()`

### 4. Implement Game Acceptance Flow
When user accepts an offer:
- Call `acceptOffer()` from `useGameActions()`
- Create game state with `createGameState()`
- Navigate to GamePage

### 5. Subscribe to Opponent Moves
In GamePage:
- Use `useGameMoves(gameId)` hook
- Listen for opponent's moves
- Apply moves to local chess engine
- Update UI

### 6. Add Error Handling & Loading States
- Show loading spinner during Nostr connection
- Display error messages if relays fail
- Handle offline/online transitions

### 7. Add Lightning Zaps (Phase 4)
- NIP-57 zap integration
- Zap buttons on moves
- Wallet connection

## Common Patterns

### Creating Nostr Events
Events are created with proper kind, content (usually JSON), tags (metadata), and signatures. See event schema section above for specific tag requirements per event type.

### State Updates
Use Zustand actions to update state. Never mutate state directly. Most game actions publish Nostr events AND update local state optimistically.

### Component Props
Components receive minimal props. Most state comes from `useAppStore()` hook. This keeps components simple and reduces prop drilling.

## Troubleshooting

### White Page on Load
If the browser shows a white page:
1. Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
2. Check browser console (F12) for JavaScript errors
3. Ensure all components have proper React imports (`useState`, `useEffect`, etc.)
4. Check that `main.tsx` has `import React from 'react'` and `import ReactDOM from 'react-dom/client'`

### Nostr Connection Issues
If Nostr doesn't connect:
1. Check browser console for relay errors
2. Verify `VITE_DEFAULT_RELAYS` in `.env.local`
3. Check that `useNostr()` hook is called in App.tsx
4. Ensure keys are being generated (check localStorage for 'nostr-keys')

### Chess.js Errors
If chess moves fail:
1. Verify move is in valid SAN notation (e.g., 'e4', 'Nf3', 'O-O')
2. Check that ChessEngine is initialized properly
3. Ensure FEN string is valid before loading

### Build Errors
If TypeScript errors occur:
1. Run `npm run type-check` to see all errors
2. Check that all imports are correct
3. Ensure `@/` path alias is working (configured in vite.config.ts and tsconfig.json)

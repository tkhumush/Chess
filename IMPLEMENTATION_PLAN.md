# Nostr Chess - Complete Implementation Plan

This document provides the detailed technical implementation plan for building a multiplayer chess web application using the Nostr protocol.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technical Architecture](#technical-architecture)
3. [Nostr Protocol Design](#nostr-protocol-design)
4. [Implementation Phases](#implementation-phases)
5. [Security & Anti-Cheat](#security--anti-cheat)
6. [Testing Strategy](#testing-strategy)
7. [Deployment Strategy](#deployment-strategy)

## Project Overview

### Vision
Create a decentralized multiplayer chess platform that uses Nostr for game coordination while providing a seamless user experience that completely abstracts away protocol complexity.

### Core Requirements
- ✅ **Zero Nostr Exposure**: Users never see pubkeys, relays, events, or signing
- ✅ **Strict PGN Compliance**: All moves follow standard chess notation
- ✅ **Real-time Gameplay**: Live move synchronization across clients
- ✅ **Anti-Cheat Protection**: Robust fork detection and resolution
- ✅ **Lightning Integration**: Zap players and individual moves
- ✅ **Spectator Support**: Live game watching and tipping
- ✅ **Multiple Variants**: Extensible system for chess variants

## Technical Architecture

### Frontend Stack
```
┌─── UI Layer ────────────────────────────┐
│  React 18 + TypeScript                  │
│  Tailwind CSS + Custom Components       │
│  react-chessboard + chess.js           │
└─────────────────────────────────────────┘
           ⬇ ️
┌─── State Layer ─────────────────────────┐
│  Zustand (App State)                    │
│  React Query (Event Caching)            │
│  Local Storage (Preferences)            │
└─────────────────────────────────────────┘
           ⬇️
┌─── Protocol Layer ──────────────────────┐
│  nostr-tools (Event Creation)           │
│  WebSocket Pool (Relay Connections)     │
│  Event Validation & Sanitization        │
└─────────────────────────────────────────┘
           ⬇️
┌─── Network Layer ───────────────────────┐
│  Multiple Nostr Relays                  │
│  Lightning Network (NIP-57 Zaps)        │
│  IPFS/Web Storage (Optional)             │
└─────────────────────────────────────────┘
```

### Data Flow Architecture
```
User Action → State Update → Event Creation → Relay Broadcast
                    ⬆️                              ⬇️
UI Re-render ← State Sync ← Event Validation ← Relay Response
```

## Nostr Protocol Design

### Event Schema Design

#### 1. Game Offers (kind: 1491)
**Purpose**: Announce availability for new games
```json
{
  "kind": 1491,
  "content": "{\"variant\":\"classical\",\"skillLevel\":\"intermediate\",\"timeControl\":\"600+0\",\"message\":\"Looking for a good game!\"}",
  "tags": [
    ["t", "chess-offer"],
    ["skill", "intermediate"],
    ["variant", "classical"], 
    ["time", "600+0"],
    ["expires", "1640995200"]
  ]
}
```

**Validation Rules**:
- Content must be valid JSON with required fields
- Skill level must be one of: total-beginner, beginner, intermediate, advanced, master
- Time control format: `{initial_seconds}+{increment_seconds}`
- Expires must be future timestamp

#### 2. Game Acceptance (kind: 1491)
**Purpose**: Accept an existing game offer
```json
{
  "kind": 1491,
  "content": "{\"accept\":true,\"gameId\":\"uuid-v4\",\"color\":\"random\"}",
  "tags": [
    ["t", "chess-accept"],
    ["e", "original-offer-event-id"],
    ["p", "original-offerer-pubkey"],
    ["game", "uuid-v4"]
  ]
}
```

#### 3. Live Game Events (kind: 34609) 
**Purpose**: Each move in an active game (addressable/replaceable)
```json
{
  "kind": 34609,
  "content": "e4",
  "tags": [
    ["d", "game-{uuid}:move-{number}"],
    ["game", "uuid-v4"],
    ["move", "1"],
    ["turn", "white"],
    ["san", "e4"],
    ["fen", "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"],
    ["prev", "previous-move-event-id"],
    ["white", "white-player-pubkey"],
    ["black", "black-player-pubkey"]
  ]
}
```

**Critical Design Features**:
- Addressable events prevent duplicate moves
- `prev` tag creates unbreakable move chain
- FEN tag provides complete board state verification
- Move number enables ordering validation

#### 4. Game Control Events (kind: 1491)
**Purpose**: Game actions like resignation, draw offers, etc.
```json
{
  "kind": 1491,
  "content": "{\"action\":\"resign\",\"reason\":\"checkmate_inevitable\"}",
  "tags": [
    ["t", "chess-control"],
    ["game", "uuid-v4"],
    ["action", "resign|draw-offer|draw-accept|draw-decline|abandon"]
  ]
}
```

#### 5. Final Game Archive (kind: 64)
**Purpose**: Complete PGN when game ends (NIP-64 compliant)
```json
{
  "kind": 64,
  "content": "[Event \"Nostr Chess\"]\n[Site \"https://chess.nostr\"]\n[Date \"2023.12.01\"]\n[Round \"1\"]\n[White \"Alice\"]\n[Black \"Bob\"]\n[Result \"1-0\"]\n[WhiteElo \"1650\"]\n[BlackElo \"1520\"]\n[TimeControl \"600+0\"]\n[Variant \"Standard\"]\n\n1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7 1-0",
  "tags": [
    ["t", "chess-game"],
    ["game", "uuid-v4"],
    ["white", "white-player-pubkey"],
    ["black", "black-player-pubkey"],
    ["result", "1-0"],
    ["variant", "classical"],
    ["moves", "20"]
  ]
}
```

### Anti-Cheat Protocol Design

#### Move Chain Integrity
```
Move 1: e4 → Event A (no parent)
Move 2: e5 → Event B (parent: A)  
Move 3: Nf3 → Event C (parent: B)
```

**Fork Detection Example**:
```
Move 30: Qd4 (Event A, parent: Move 29)
Move 31: Qh4 (Event B, parent: Move 29) ← FORK DETECTED!
```

#### Conflict Resolution Protocol
1. **Detection**: Multiple events reference same parent
2. **Validation**: Verify both moves are from same player
3. **Resolution Options** for honest player:
   - Accept one move and continue game
   - Declare forfeit due to cheating
4. **Resolution Event**: Publish choice as next move

#### Additional Security Measures
- **Client-Side Validation**: chess.js validates all moves before publishing
- **Relay Redundancy**: Publish to multiple relays for censorship resistance  
- **Signature Verification**: All events must have valid Nostr signatures
- **Rate Limiting**: Prevent spam and DOS attacks

## Implementation Phases

### Phase 1: Foundation & Chess Engine (Weeks 1-2) ✨

**Week 1: Project Setup**
- [x] Vite + React + TypeScript configuration
- [x] Tailwind CSS integration and theming
- [x] Component architecture and design system
- [x] Basic routing and layout structure
- [ ] Chess.js integration and wrapper
- [ ] react-chessboard setup and customization

**Week 2: Core Chess Logic**
- [ ] Move validation and legal move detection
- [ ] PGN generation and parsing
- [ ] Game state management with Zustand
- [ ] Undo/redo functionality
- [ ] Basic UI for move input and display
- [ ] Time control implementation

**Deliverables**:
- Functional single-player chess with full validation
- Clean component architecture
- Type-safe state management
- Responsive UI design

### Phase 2: Nostr Integration (Weeks 3-4) 🔄

**Week 3: Protocol Foundation**
- [ ] nostr-tools integration and setup
- [ ] Event schema implementation and validation
- [ ] Relay pool management and connection handling
- [ ] Key pair generation and secure storage
- [ ] Basic event publishing and subscription

**Week 4: Matchmaking System**
- [ ] Game offer creation and broadcasting
- [ ] Offer discovery and filtering by skill level
- [ ] Game acceptance and player matching
- [ ] Timeout handling for expired offers
- [ ] Basic game session initialization

**Deliverables**:
- Players can create and accept game offers
- Real-time matchmaking system
- Stable relay connections
- Proper key management

### Phase 3: Real-time Gameplay (Weeks 5-6) 🎯

**Week 5: Live Game System**
- [ ] Move event creation and broadcasting
- [ ] Real-time move synchronization
- [ ] Game state reconstruction from events
- [ ] Turn management and validation
- [ ] Connection status monitoring

**Week 6: Advanced Features**
- [ ] Spectator mode implementation
- [ ] Game archival with NIP-64
- [ ] Basic fork detection
- [ ] Game abandonment handling
- [ ] Performance optimization

**Deliverables**:
- Full multiplayer chess gameplay
- Spectator support
- Robust state synchronization
- Basic anti-cheat protection

### Phase 4: Social & Lightning Features (Weeks 7-8) ⚡

**Week 7: Lightning Integration**
- [ ] NIP-57 zap request/receipt implementation
- [ ] Zap UI components and workflows
- [ ] Per-move zapping functionality
- [ ] Player profile zapping
- [ ] Zap display and animations

**Week 8: Social Features**
- [ ] Player profiles and statistics
- [ ] Game history and replay system
- [ ] Advanced matchmaking algorithms
- [ ] Chat system (optional)
- [ ] Leaderboards and ratings

**Deliverables**:
- Complete social chess platform
- Lightning-powered tipping system
- Rich player interactions
- Engaging user experience

### Phase 5: Production & Polish (Weeks 9-10) 🚀

**Week 9: Quality Assurance**
- [ ] Comprehensive testing suite
- [ ] Security audit and penetration testing
- [ ] Performance optimization and profiling
- [ ] Cross-browser compatibility testing
- [ ] Mobile responsiveness optimization

**Week 10: Launch Preparation**
- [ ] Production deployment setup
- [ ] Documentation completion
- [ ] User onboarding flow
- [ ] Marketing website creation
- [ ] Community launch preparation

**Deliverables**:
- Production-ready application
- Complete documentation
- Launch marketing materials
- Community engagement plan

## Security & Anti-Cheat

### Client-Side Protection
```typescript
// Move validation pipeline
function validateMove(move: string, gameState: GameState): boolean {
  // 1. Chess.js legal move validation
  const chessMove = gameState.chess.move(move)
  if (!chessMove) return false
  
  // 2. Turn validation
  if (gameState.currentTurn !== getCurrentPlayerColor()) return false
  
  // 3. Game status validation
  if (gameState.status !== 'active') return false
  
  return true
}
```

### Protocol-Level Protection
```typescript
// Event chain validation
function validateMoveChain(events: NostrEvent[]): boolean {
  for (let i = 1; i < events.length; i++) {
    const current = events[i]
    const parent = events[i - 1]
    
    // Verify parent reference
    if (!current.tags.find(tag => tag[0] === 'prev' && tag[1] === parent.id)) {
      return false
    }
    
    // Verify move sequence
    const currentMove = parseInt(getTagValue(current, 'move'))
    const parentMove = parseInt(getTagValue(parent, 'move'))
    if (currentMove !== parentMove + 1) {
      return false
    }
  }
  return true
}
```

### Fork Resolution Implementation
```typescript
function handleForkDetection(conflictingEvents: NostrEvent[], gameState: GameState) {
  const currentPlayer = getCurrentPlayer(gameState)
  const isHonestPlayer = currentPlayer.pubkey === getMyPubkey()
  
  if (isHonestPlayer) {
    // Show conflict resolution UI
    showConflictResolutionModal({
      options: conflictingEvents,
      onResolve: (chosenEvent) => {
        // Continue game with chosen move
        applyMove(chosenEvent, gameState)
        publishResolutionEvent(chosenEvent.id)
      },
      onForfeit: () => {
        // Declare opponent forfeit
        publishForfeitEvent('illegal_move_attempted')
      }
    })
  } else {
    // Wait for honest player's resolution
    showWaitingForResolutionUI()
  }
}
```

## Testing Strategy

### Unit Tests
```typescript
// Chess logic tests
describe('Chess Engine', () => {
  test('validates legal moves correctly', () => {
    const engine = createChessEngine()
    expect(engine.move('e4')).toBeTruthy()
    expect(engine.move('e5')).toBeTruthy()
    expect(engine.move('Qh5')).toBeFalsy() // Illegal move
  })
  
  test('generates correct PGN', () => {
    const engine = createChessEngine()
    engine.move('e4')
    engine.move('e5')
    expect(engine.pgn()).toBe('1. e4 e5 *')
  })
})

// Nostr event tests
describe('Event Creation', () => {
  test('creates valid game offer events', () => {
    const offer = createGameOfferEvent({
      skillLevel: 'intermediate',
      variant: 'classical',
      timeControl: { initial: 600, increment: 0 }
    })
    expect(validateEvent(offer)).toBeTruthy()
    expect(offer.kind).toBe(1491)
  })
})
```

### Integration Tests
```typescript
// Game flow tests
describe('Multiplayer Game Flow', () => {
  test('complete game from offer to archive', async () => {
    // Create game offer
    const offer = await createGameOffer(player1)
    
    // Accept offer
    const acceptance = await acceptGameOffer(offer, player2)
    
    // Play moves
    await makeMove('e4', player1)
    await makeMove('e5', player2)
    
    // Verify game state
    const gameState = await getGameState(offer.gameId)
    expect(gameState.moves).toHaveLength(2)
  })
})
```

### End-to-End Tests
```typescript
// User journey tests
describe('User Experience', () => {
  test('new user can find and play a game', async () => {
    await page.goto('/chess')
    
    // Find opponent
    await page.click('[data-testid="quick-match"]')
    await page.waitForSelector('[data-testid="game-board"]')
    
    // Make a move
    await page.click('[data-square="e2"]')
    await page.click('[data-square="e4"]')
    
    // Verify move was made
    await expect(page.locator('[data-testid="move-list"]')).toContainText('e4')
  })
})
```

## Deployment Strategy

### Build Configuration
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          chess: ['chess.js', 'react-chessboard'],
          nostr: ['nostr-tools']
        }
      }
    }
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
  }
})
```

### Environment Configuration
```bash
# Production environment
VITE_DEFAULT_RELAYS=wss://relay.damus.io,wss://nos.lol,wss://relay.snort.social
VITE_ENABLE_ZAPS=true
VITE_MOCK_DATA=false
VITE_DEBUG_MODE=false
```

### Deployment Targets

#### Static Hosting (Recommended)
- **Netlify**: Automatic deployments from GitHub
- **Vercel**: Optimized for React applications  
- **IPFS**: Decentralized hosting option
- **GitHub Pages**: Free hosting for open source

#### CDN Configuration
```yaml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[[headers]]
  for = "/assets/*"
  [headers.values]
    cache-control = "max-age=31536000"

[[headers]]
  for = "*.js"
  [headers.values]
    cache-control = "max-age=31536000"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Monitoring & Analytics
- Error tracking with Sentry
- Performance monitoring with Web Vitals
- User analytics with privacy-focused tools
- Nostr relay health monitoring

### Security Headers
```yaml
# Security headers for production
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Content-Security-Policy = "default-src 'self'; connect-src 'self' wss:; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'"
```

This implementation plan provides a comprehensive roadmap for building a world-class decentralized chess application. The phased approach ensures steady progress while maintaining high quality and security standards throughout development.
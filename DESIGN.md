# Chess App Design & Technical Specification

## Executive Summary

This document outlines the complete technical design for a multiplayer chess web application that uses Nostr protocol internally while providing a seamless user experience free from any Nostr complexity.

## 1. High-Level Architecture

### Frontend-Only Architecture
- **No Backend Required**: Pure client-side React application
- **Direct Relay Communication**: WebSocket connections to Nostr relays
- **Local State Management**: React Context + Zustand for app state
- **Event-Driven Updates**: Real-time game synchronization via Nostr events

### Technology Stack
```
Frontend:
├── React 18 + TypeScript
├── Vite (build tool)
├── Tailwind CSS (styling)
├── chess.js (move validation & PGN)
├── react-chessboard (interactive board)
├── nostr-tools (protocol implementation)
├── Zustand (state management)
└── react-query (data fetching)

Testing:
├── Vitest (unit testing)
├── Testing Library (component tests)
└── Playwright (e2e testing)
```

## 2. Nostr Event Model

### Event Types Overview

| Kind | Purpose | Description | Replacement |
|------|---------|-------------|-------------|
| 1491 | Game Offers | Matchmaking requests | No |
| 34609 | Live Moves | Real-time move events | Yes (addressable) |
| 64 | Final Archive | Completed game PGN | No |
| 9734/9735 | Zap Events | Lightning payments | No |

### 2.1 Game Offer Events (kind: 1491)

**Purpose**: Players announce availability for new games

```json
{
  "kind": 1491,
  "content": "{\"variant\":\"classical\",\"skillLevel\":\"intermediate\",\"timeControl\":\"600+0\",\"message\":\"Looking for a quick game!\"}",
  "tags": [
    ["t", "chess-offer"],
    ["skill", "intermediate"],  // total-beginner|beginner|intermediate|advanced|master
    ["variant", "classical"],   // classical|rapid|blitz|chess960|etc
    ["time", "600+0"],         // seconds+increment
    ["expires", "1640995200"]  // unix timestamp
  ],
  "created_at": 1640991600,
  "pubkey": "...",
  "id": "...",
  "sig": "..."
}
```

**Tags Explanation**:
- `t`: Topic tag for easy filtering
- `skill`: One of 5 skill levels for matchmaking
- `variant`: Chess variant type (extensible)
- `time`: Time control in seconds+increment format
- `expires`: Optional expiration timestamp

### 2.2 Game Acceptance Events (kind: 1491)

**Purpose**: Accept an existing game offer

```json
{
  "kind": 1491,
  "content": "{\"accept\":true,\"gameId\":\"uuid-v4\"}",
  "tags": [
    ["t", "chess-accept"],
    ["e", "original-offer-event-id"],
    ["p", "original-offerer-pubkey"],
    ["game", "uuid-v4"]
  ]
}
```

### 2.3 Live Game State Events (kind: 34609)

**Purpose**: Each move in an active game (addressable/replaceable)

```json
{
  "kind": 34609,
  "content": "e4",  // SAN notation
  "tags": [
    ["d", "game-{uuid}"],           // Identifier for addressable events
    ["p", "white-player-pubkey"],   // White player
    ["p", "black-player-pubkey"],   // Black player  
    ["move", "1"],                  // Move number
    ["turn", "white"],              // whose turn (white|black)
    ["san", "e4"],                  // Standard Algebraic Notation
    ["fen", "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"],
    ["e", "previous-move-event-id"] // Reference to previous move
  ],
  "created_at": 1640991700,
  "pubkey": "white-or-black-player-pubkey"
}
```

**Critical Anti-Cheat Design**:
- Each move MUST reference previous move via `e` tag
- Move order determined by event chain, NOT timestamps
- Addressable events prevent multiple moves per turn
- FEN validates complete board state

### 2.4 Game Archive Events (kind: 64)

**Purpose**: Final PGN record when game ends (NIP-64 compliant)

```json
{
  "kind": 64,
  "content": "[Event \"Nostr Chess\"]\n[Site \"https://chess.example.com\"]\n[Date \"2023.01.01\"]\n[Round \"1\"]\n[White \"Alice\"]\n[Black \"Bob\"]\n[Result \"1-0\"]\n[WhiteElo \"1500\"]\n[BlackElo \"1480\"]\n\n1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 1-0",
  "tags": [
    ["t", "chess-game"],
    ["white", "alice-pubkey"],
    ["black", "bob-pubkey"],
    ["result", "1-0"],
    ["game", "uuid-v4"],
    ["variant", "classical"]
  ]
}
```

## 3. Game State Lifecycle

### State Transitions
```
Offer Created → Match Found → Game Active → Move Exchange → Game Complete → Archived
     ↓              ↓            ↓             ↓              ↓           ↓
  kind:1491      kind:1491    kind:34609    kind:34609      kind:64    stored
  (offer)       (accept)     (game start)   (each move)    (final)    permanently
```

### 3.1 Matchmaking Flow

1. **Create Offer**: Player publishes `kind:1491` offer event
2. **Browse Offers**: Clients query for unexpired offers matching skill level
3. **Accept Offer**: Opponent publishes acceptance event referencing offer
4. **Game Initialization**: Both players watch for acceptance, game starts
5. **Prevent Double Accept**: Use event timestamps + first-seen logic

### 3.2 Game Play Flow

1. **Initial State**: Game starts from standard chess position
2. **Move Publication**: Active player creates `kind:34609` move event
3. **Move Validation**: All clients validate move legality before accepting
4. **State Synchronization**: FEN and move chain provide authoritative state
5. **Turn Management**: `turn` tag indicates whose move is next

### 3.3 Game Completion

1. **End Detection**: Client detects checkmate, stalemate, or resignation
2. **Archive Creation**: Winner/drawer publishes final `kind:64` PGN
3. **State Cleanup**: Remove temporary game state, preserve archive

## 4. Anti-Cheat & Fork Resolution

### 4.1 Fork Detection

**Fork Scenario**: Player publishes multiple moves referencing same parent
```
Move 30 (parent)
    ├── Move 31a: "Qd4" (Event A)  
    └── Move 31b: "Qh4" (Event B)  // FORK DETECTED
```

### 4.2 Resolution Protocol

**Authority**: The honest player (whose turn it is next) resolves forks

1. **Detection**: Client detects multiple events with same parent reference
2. **Conflict State**: UI shows fork detected, present options to honest player
3. **Resolution Options**:
   - **Accept Valid Move**: Choose correct move, game continues
   - **Declare Forfeit**: Mark cheater as forfeit, archive game
4. **Resolution Event**: Publish resolution choice as next move

### 4.3 Additional Safeguards

- **Signature Verification**: All events must have valid nostr signatures
- **Move Chain Integrity**: Broken chains invalidate entire game
- **Relay Redundancy**: Publish to multiple relays to prevent censorship
- **Local Move Validation**: Client-side chess.js validation before publishing

## 5. Lightning Zap Integration

### 5.1 Zappable Targets

- **Player Profiles**: Direct appreciation zaps
- **Individual Moves**: React to brilliant/terrible moves
- **Game Events**: Tip during exciting moments
- **Spectator Engagement**: Crowd participation via zaps

### 5.2 Zap Implementation

**Per-Move Zapping**:
```json
{
  "kind": 9734,  // Zap request
  "content": "Brilliant sacrifice! 🔥",
  "tags": [
    ["e", "move-event-id"],     // Target move
    ["p", "recipient-pubkey"],  // Move author
    ["amount", "1000"],         // Millisatoshis
    ["relays", "..."]
  ]
}
```

**Player Zapping**:
```json
{
  "kind": 9734,
  "content": "Great game!",
  "tags": [
    ["p", "player-pubkey"],
    ["amount", "5000"],
    ["relays", "..."]
  ]
}
```

### 5.3 Zap Display

- **Move List**: Zap badges next to moves
- **Player Cards**: Total zaps received
- **Live Reactions**: Real-time zap animations
- **Leaderboards**: Most zapped players/moves

## 6. User Interface Design

### 6.1 Layout Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Header Bar                              │
│  [🏠 Home] [⚡ Game] [👤 Profile] [⚙️ Settings]              │
├─────────────────────┬───────────────────────────────────────┤
│                     │                                       │
│   Chess Board       │        Move List & Controls           │
│                     │                                       │
│   [Interactive      │  1. e4    e5     [⚡2 ⚡1]            │
│    Drag & Drop]     │  2. Nf3   Nc6    [⚡0 ⚡3]            │
│                     │  3. Bb5   a6     [⚡1 ⚡0]            │
│                     │                                       │
│                     │  ┌─────────────────────────────────┐   │
│                     │  │    Game Controls                │   │
│  [Player Cards]     │  │ [Resign] [Draw] [⚡Zap Player]  │   │
│                     │  └─────────────────────────────────┘   │
├─────────────────────┴───────────────────────────────────────┤
│                    Status Bar                               │
│  Your Turn • Classical • 9:32 vs 8:47                     │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Key UI Components

**ChessBoard Component**:
- Interactive piece movement with drag & drop
- Legal move highlighting
- Move animation and sound effects
- Last move highlighting

**MoveList Component**:
- Numbered move pairs (White/Black)
- Individual move zap buttons and counters
- Move navigation (click to view position)
- Export PGN button

**PlayerCard Component**:
- Avatar, name, skill level
- Time remaining
- Total zaps received
- Player status (online, thinking, etc.)

**GameControls Component**:
- Resign, offer draw, request undo
- Zap player button
- Spectator count
- Chat toggle (future)

### 6.3 Nostr Abstraction

**Zero Nostr Terminology**: Users see only chess terms
- "Finding opponents" not "querying relays"
- "Game saved" not "event published"
- "Connection status" not "relay health"
- "Player tipped you" not "zap received"

## 7. Implementation Roadmap

### Phase 1: Core Chess Engine (Week 1-2) ✨

**Week 1: Foundation**
- [x] Vite + React + TypeScript setup
- [x] Install chess.js and react-chessboard
- [x] Basic board with piece movement
- [ ] Move validation and PGN generation
- [ ] Simple move list display

**Week 2: Game Logic**
- [ ] Complete game state management
- [ ] Win condition detection
- [ ] FEN import/export
- [ ] Basic UI styling with Tailwind

**Deliverable**: Functional single-player chess with full move validation

### Phase 2: Nostr Integration (Week 3-4) 🔄

**Week 3: Protocol Foundation**
- [ ] Install nostr-tools
- [ ] Event schema implementation
- [ ] Relay connection management
- [ ] Key generation and storage

**Week 4: Matchmaking**
- [ ] Game offer creation and publishing
- [ ] Offer browsing and acceptance
- [ ] Basic multiplayer move sync
- [ ] Connection status UI

**Deliverable**: Two players can find each other and play a game

### Phase 3: Multiplayer Features (Week 5-6) 🎯

**Week 5: Real-time Gameplay**
- [ ] Live move synchronization
- [ ] Spectator mode implementation
- [ ] Game state reconstruction from events
- [ ] Basic anti-cheat (fork detection)

**Week 6: Game Management**
- [ ] Game archival with NIP-64
- [ ] Game history and replay
- [ ] Improved conflict resolution
- [ ] Error handling and reconnection

**Deliverable**: Robust multiplayer chess with spectating

### Phase 4: Social Layer (Week 7-8) ⚡

**Week 7: Lightning Integration**
- [ ] NIP-57 zap implementation
- [ ] Zap UI components
- [ ] Per-move zapping
- [ ] Zap display and animations

**Week 8: Polish & Features**
- [ ] Player profiles and statistics
- [ ] Improved matchmaking (skill-based)
- [ ] Game variant support framework
- [ ] Performance optimization

**Deliverable**: Complete chess app with social features

### Phase 5: Production & Deployment (Week 9-10) 🚀

**Week 9: Production Readiness**
- [ ] Comprehensive testing suite
- [ ] Error boundaries and fallbacks
- [ ] Security audit
- [ ] Performance optimization

**Week 10: Launch Preparation**
- [ ] Documentation completion
- [ ] Deployment setup
- [ ] User onboarding flow
- [ ] Marketing site

**Deliverable**: Production-ready chess application

## 8. Security & Fair Play

### 8.1 Move Validation Pipeline

1. **Client-Side**: chess.js validates move legality
2. **Protocol-Level**: Event chain validates sequence
3. **Consensus**: Multiple relays store same event
4. **Peer Validation**: Other clients can verify game state

### 8.2 Cheating Prevention

**Impossible Moves**: Rejected at chess.js level
**Double Moves**: Prevented by addressable events
**Time Travel**: Event chains prevent backdating
**Fake Games**: Cryptographic signatures required

### 8.3 Network Security

**Key Management**: Browser-stored keys (future: hardware wallets)
**Relay Diversity**: Connect to multiple relays
**Event Verification**: Validate all signatures
**DOS Protection**: Rate limiting and filtering

## 9. State Management Architecture

### 9.1 Store Structure (Zustand)

```typescript
interface AppStore {
  // Auth & Identity
  keys: NostrKeyPair | null;
  profile: UserProfile | null;
  
  // Game State
  currentGame: GameState | null;
  gameHistory: GameRecord[];
  
  // Matchmaking
  availableGames: GameOffer[];
  myOffers: GameOffer[];
  
  // Network
  relayStatus: RelayStatus[];
  connectionState: 'connected' | 'connecting' | 'disconnected';
  
  // UI State
  selectedMove: number | null;
  showSpectators: boolean;
  zapsEnabled: boolean;
}
```

### 9.2 Event Handling

```typescript
interface EventHandlers {
  onGameOffer: (event: NostrEvent) => void;
  onGameAcceptance: (event: NostrEvent) => void;
  onMove: (event: NostrEvent) => void;
  onGameComplete: (event: NostrEvent) => void;
  onZap: (event: NostrEvent) => void;
}
```

## 10. Testing Strategy

### 10.1 Unit Tests
- Chess logic (move validation, PGN generation)
- Nostr event creation and validation
- State management functions
- Utility functions

### 10.2 Component Tests  
- Board interaction (drag & drop)
- Move list display
- Player cards and controls
- Zap buttons and counters

### 10.3 Integration Tests
- Complete game flows
- Matchmaking scenarios
- Network failure handling
- Anti-cheat mechanisms

### 10.4 End-to-End Tests
- Full user journeys
- Multi-client scenarios
- Cross-browser compatibility
- Performance benchmarks

## 11. Performance Considerations

### 11.1 Event Filtering
- Subscribe only to relevant event types
- Use time-based filters for offers
- Implement efficient move chain queries

### 11.2 State Optimization
- Lazy load game history
- Cache frequently accessed data
- Debounce real-time updates

### 11.3 Network Optimization
- Connection pooling for relays
- Retry logic with exponential backoff
- Optimistic UI updates

## 12. Accessibility & UX

### 12.1 Chess Accessibility
- Screen reader support for moves
- Keyboard navigation for board
- High contrast mode
- Move announcement audio

### 12.2 Responsive Design
- Mobile-first approach
- Touch-friendly piece movement
- Collapsible side panels
- Portrait/landscape optimization

### 12.3 User Onboarding
- Progressive disclosure of features
- Interactive tutorial mode
- Clear matchmaking instructions
- Helpful error messages

## 13. Future Extensions

### 13.1 Game Variants
- Chess960 (Fischer Random)
- King of the Hill
- Three-Check
- Atomic Chess

### 13.2 Advanced Features
- Tournament system
- ELO rating implementation
- Team competitions
- Puzzle solving mode

### 13.3 Social Enhancements
- Player following/friends
- Game sharing and embedding
- Community tournaments
- Streamer integration

This comprehensive design provides the foundation for building a world-class chess application that leverages Nostr's decentralized architecture while delivering an exceptional user experience.
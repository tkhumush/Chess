# Nostr Chess

A multiplayer chess web application that uses the Nostr protocol for decentralized gameplay while keeping all protocol details hidden from end users.

[![Edit with Shakespeare](https://shakespeare.diy/badge.svg)](https://shakespeare.diy/clone?url=https%3A%2F%2Fgithub.com%2Ftkhumush%2FChess.git)

## Overview

This chess application provides a seamless multiplayer experience where players can:
- Start new games and select chess variants
- Choose skill levels for balanced matchmaking
- Play with legal move validation and visual feedback
- Watch live games as spectators
- Send Lightning zaps to players and individual moves
- View complete game history in standard PGN format

All Nostr protocol interactions (relays, events, signing) are completely abstracted away - users interact with a standard chess interface.

## Features

### Core Gameplay
- **Interactive Visual Board**: Drag-and-drop piece movement with legal move highlighting
- **Strict PGN Compliance**: All moves validated and stored in standard chess notation
- **Real-time Updates**: Live synchronization of moves across all connected clients
- **Multiple Variants**: Extensible system starting with classical chess

### Matchmaking System  
- **Skill-Based Matching**: 5-tier skill system (Total Beginner → Master)
- **Game Offers**: Create and browse available games
- **Quick Join**: Auto-match with similar skill players

### Social Features
- **Live Spectating**: Watch ongoing games in real-time
- **Lightning Zaps**: Tip players or react to brilliant moves
- **Move Commentary**: Players can add annotations and comments

### Security & Fair Play
- **Anti-Cheat Protection**: Fork detection and resolution for conflicting moves
- **Move Validation**: Client-side and protocol-level validation of all moves
- **Canonical Game State**: Deterministic move ordering using event chains

## Technical Architecture

### Frontend Stack
- **React 18** with TypeScript for the main UI
- **chess.js** for move validation and PGN generation
- **react-chessboard** for the interactive board component
- **Tailwind CSS** for responsive styling
- **Vite** for fast development and building

### Nostr Protocol Integration
- **Custom Event Kinds**:
  - `kind:1491` - Game offers and matchmaking
  - `kind:34609` - Live game state (addressable events)
  - `kind:64` - Final PGN archives (NIP-64)
- **Lightning Integration**: NIP-57 zap support for tipping
- **Real-time Updates**: WebSocket relay connections for live gameplay

### Game State Management
- **Event-Driven Architecture**: All game actions as Nostr events
- **Deterministic Ordering**: Move sequence based on event references, not timestamps
- **Conflict Resolution**: Built-in handling for network forks and cheating attempts

## Development Phases

### Phase 1: Core Chess Engine ✨
- [x] Project setup and build configuration
- [x] Chess board UI with piece movement
- [x] Move validation using chess.js
- [x] PGN generation and display
- [ ] Basic game state management

### Phase 2: Nostr Integration 🔄
- [ ] Event schema design and implementation
- [ ] Relay connection management
- [ ] Game offer creation and matching
- [ ] Real-time move synchronization

### Phase 3: Multiplayer Features 🎯
- [ ] Live spectator mode
- [ ] Move conflict detection and resolution
- [ ] Game archival with NIP-64
- [ ] Anti-cheating safeguards

### Phase 4: Social Layer ⚡
- [ ] Lightning zap integration (NIP-57)
- [ ] Move annotations and comments  
- [ ] Player profiles and statistics
- [ ] Tournament and rating system

## Protocol Design

### Event Schema

#### Game Offers (kind: 1491)
```json
{
  "kind": 1491,
  "content": "{\"variant\":\"classical\",\"skillLevel\":\"intermediate\",\"timeControl\":\"10+0\"}",
  "tags": [
    ["t", "chess-offer"],
    ["skill", "intermediate"],
    ["variant", "classical"],
    ["time", "600+0"]
  ]
}
```

#### Live Games (kind: 34609) 
```json
{
  "kind": 34609,
  "content": "e4",
  "tags": [
    ["d", "game-{uuid}"],
    ["p", "{white-pubkey}"],
    ["p", "{black-pubkey}"],
    ["move", "1"],
    ["san", "e4"],
    ["e", "{parent-move-id}"]
  ]
}
```

#### Final Archives (kind: 64)
Standard NIP-64 PGN format for completed games.

### Anti-Cheat Mechanisms

1. **Sequential Move Chain**: Each move must reference the previous move's event ID
2. **Timestamp Independence**: Move order determined by event references, never timestamps
3. **Fork Detection**: Multiple moves referencing same parent trigger conflict resolution
4. **Honest Player Authority**: Valid player chooses correct move when opponent creates forks

### Zap Integration

- **Per-Move Zapping**: Each move in the game log is zappable
- **Player Appreciation**: Direct zaps to player profiles
- **Spectator Engagement**: Live tipping during exciting moments
- **Move Reactions**: Zap brilliant moves, blunders, or amazing saves

## Getting Started

### Development Setup

```bash
# Clone repository
git clone https://github.com/tkhumush/Chess.git
cd Chess

# Install dependencies
npm install

# Start development server
npm run dev
```

### Building for Production

```bash
# Create optimized build
npm run build

# Preview production build
npm run preview
```

### Environment Configuration

Create `.env.local` with your preferred Nostr relays:

```env
VITE_DEFAULT_RELAYS=wss://relay.damus.io,wss://nos.lol,wss://relay.snort.social
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Roadmap

- **v1.0**: Core chess gameplay with Nostr backend
- **v1.1**: Lightning zap integration and social features
- **v1.2**: Advanced variants (Chess960, King of the Hill, etc.)
- **v1.3**: Tournament system and ELO ratings
- **v2.0**: Mobile app and offline play support

---

Built with ⚡ by the Nostr community
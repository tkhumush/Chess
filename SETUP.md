# Nostr Chess - Setup Guide

This guide will help you set up and run the Nostr Chess application locally.

## Quick Demo

To see a visual demo of the application interface, open `demo.html` in your browser. This shows the UI design and layout without requiring any dependencies.

## Prerequisites

- Node.js 18+ 
- npm or yarn package manager
- Git

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/tkhumush/Chess.git
   cd Chess
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your preferred settings:
   ```env
   VITE_DEFAULT_RELAYS="wss://relay.damus.io,wss://nos.lol,wss://relay.snort.social"
   VITE_ENABLE_ZAPS="true"
   VITE_MOCK_DATA="true"
   ```

## Development

1. **Start the development server**
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:3000`

2. **Run type checking**
   ```bash
   npm run type-check
   ```

3. **Run tests**
   ```bash
   npm test
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

## Package Dependencies

The application requires the following key dependencies:

### Core Dependencies
- `react` - UI framework
- `react-dom` - React DOM renderer
- `typescript` - Type safety
- `vite` - Build tool and dev server

### Chess Engine
- `chess.js` - Chess move validation and PGN generation
- `react-chessboard` - Interactive chess board component

### Nostr Protocol
- `nostr-tools` - Nostr protocol implementation
- WebSocket connections to Nostr relays

### State Management
- `zustand` - Lightweight state management
- `@tanstack/react-query` - Data fetching and caching

### UI & Styling
- `tailwindcss` - Utility-first CSS framework
- `lucide-react` - Icon components
- `clsx` - Conditional class names

### Development Tools
- `@vitejs/plugin-react` - Vite React plugin
- `eslint` - Code linting
- `vitest` - Unit testing
- `@types/*` - TypeScript definitions

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ChessBoard.tsx   # Interactive chess board
│   ├── MoveList.tsx     # Game move history
│   ├── PlayerCard.tsx   # Player info display
│   ├── ZapButton.tsx    # Lightning tip button
│   └── ...
├── pages/               # Main application pages
│   ├── HomePage.tsx     # Landing and matchmaking
│   └── GamePage.tsx     # Active game interface
├── stores/              # State management
│   └── appStore.ts      # Main application store
├── types/               # TypeScript type definitions
│   ├── chess.ts         # Chess-related types
│   └── nostr.ts         # Nostr protocol types
├── lib/                 # Core libraries and utilities
│   ├── chess.ts         # Chess engine wrapper
│   ├── nostr.ts         # Nostr client implementation
│   └── store.ts         # Store utilities
├── utils/               # Helper functions
│   └── index.ts         # General utilities
└── main.tsx            # Application entry point
```

## Key Features Implementation Status

### ✅ Completed (Phase 1)
- [x] Project structure and build configuration
- [x] TypeScript setup with strict typing
- [x] Tailwind CSS styling system
- [x] Component architecture design
- [x] State management with Zustand
- [x] Chess board UI mockup
- [x] Move list and PGN display
- [x] Player cards and game controls
- [x] Responsive layout design

### 🔄 In Progress (Phase 2)
- [ ] Real chess.js integration
- [ ] Nostr event schema implementation
- [ ] Relay connection management
- [ ] Game offer creation and matching
- [ ] Move synchronization

### 🎯 Planned (Phase 3)
- [ ] Live spectator mode
- [ ] Anti-cheat mechanisms
- [ ] Game archival with NIP-64
- [ ] Fork detection and resolution

### ⚡ Future (Phase 4)
- [ ] Lightning zap integration
- [ ] Move annotations
- [ ] Player profiles and stats
- [ ] Tournament system

## Architecture Overview

### Frontend-Only Design
The application is designed as a pure frontend application that communicates directly with Nostr relays via WebSocket connections. No backend server is required.

### Nostr Integration
- **Game Offers** (kind: 1491): Matchmaking and game creation
- **Live Games** (kind: 34609): Real-time move events (addressable)
- **Final Archives** (kind: 64): Completed games in PGN format (NIP-64)
- **Lightning Zaps** (kinds: 9734/9735): Tip players and moves (NIP-57)

### Anti-Cheat Design
- Move validation using chess.js on all clients
- Event chain ordering (not timestamp-based)
- Fork detection for conflicting moves
- Honest player authority for conflict resolution

### State Management
- Zustand store for application state
- React Query for Nostr event caching
- Local storage for user preferences
- WebSocket management for real-time updates

## Development Workflow

1. **Feature Development**
   - Create feature branch from main
   - Implement components with TypeScript
   - Add tests for new functionality
   - Update documentation

2. **Testing**
   - Unit tests for chess logic
   - Component tests for UI
   - Integration tests for Nostr events
   - E2E tests for game flows

3. **Code Quality**
   - ESLint for code style
   - TypeScript for type safety
   - Prettier for formatting
   - Husky for pre-commit hooks

## Deployment

The application can be deployed to any static hosting service:

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy the `dist` directory to:**
   - Netlify
   - Vercel  
   - GitHub Pages
   - IPFS
   - Any static file host

## Environment Configuration

### Development
- Mock Nostr events for testing
- Local storage for game state
- Hot reload for rapid development

### Production  
- Real Nostr relay connections
- Event validation and sanitization
- Error boundaries and fallbacks
- Performance optimizations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is open source under the MIT License. See `LICENSE` for details.

## Support

- GitHub Issues: Report bugs and feature requests
- Documentation: See README.md for project overview
- Demo: Open demo.html for visual preview

---

Built with ⚡ by the Nostr community
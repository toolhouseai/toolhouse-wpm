# Toolhouse WPM - Multiplayer Typing Game

A real-time multiplayer Words Per Minute (WPM) typing game built with modern web technologies.

## Overview

Race against up to 9 other players in real-time typing challenges. Type as fast and accurately as possible within 60 seconds to earn your score. Anonymous, no accounts required—just create a room and start playing!

## Features

- 🎮 **Real-time multiplayer** - Up to 10 players per room
- ⚡ **Instant gameplay** - No signup required
- 📊 **Live leaderboards** - See rankings in real-time
- 🔒 **Private rooms** - Share 6-character codes with friends
- 📱 **Built on Cloudflare** - Edge computing for low latency

## Technology Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Cloudflare Workers + Durable Objects
- **Database**: Cloudflare D1 (SQLite)
- **Real-time**: WebSockets
- **Testing**: Vitest

## Quick Start

### Prerequisites

- Node.js 18+
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- Cloudflare account (free tier works)

### Installation

```bash
# Install dependencies
npm install
cd web && npm install && cd ..

# Create D1 database
wrangler d1 create wpm_game_db

# Update database_id in wrangler.toml with your database ID

# Initialize database schema
wrangler d1 execute wpm_game_db --local --file=./src/db/schema.sql

# Seed passages (see docs/DATABASE.md for full seed data)
wrangler d1 execute wpm_game_db --local --file=seed_passages.sql
```

### Development

Start backend and frontend in separate terminals:

```bash
# Terminal 1: Backend (port 8787)
npm run dev

# Terminal 2: Frontend (port 3000)
cd web && npm run dev
```

Open http://localhost:3000 to play!

### Testing

```bash
npm test              # Run tests
npm test -- --watch   # Watch mode
```

## Game Flow

1. **Create Room** - Get a 6-character room code (e.g., ABC123)
2. **Share Code** - Friends join using the room code
3. **Start Game** - Leader starts when ready
4. **Type Fast** - 60-second challenge
5. **View Results** - Leaderboard shows WPM rankings

## Documentation

- 📖 **[API Reference](docs/API.md)** - Endpoints and WebSocket events
- 🏗️ **[Architecture](ARCHITECTURE.md)** - System design and patterns
- 🗄️ **[Database](docs/DATABASE.md)** - Schema, seeding, and cleanup
- 🚀 **[Deployment](DEPLOYMENT.md)** - Production deployment guide
- 🔧 **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues and fixes

## Project Structure

```
toolhouse-wpm/
├── src/                    # Backend (Cloudflare Workers)
│   ├── index.ts           # Worker entry point
│   ├── api/               # REST API endpoints
│   ├── game/              # Game logic & Durable Objects
│   ├── db/                # Database schema & passages
│   └── cleanup.ts         # Optional cleanup worker
├── web/                   # Frontend (React + Vite)
│   └── src/
├── docs/                  # Documentation
├── wrangler.toml          # Cloudflare config
└── README.md
```

## Deployment

Quick deployment to Cloudflare:

```bash
# Build
npm run build

# Deploy
wrangler publish
```

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for complete production deployment guide.

## Contributing

Development happens on feature branches. Follow the patterns in [ARCHITECTURE.md](ARCHITECTURE.md) for new features.

## License

MIT

---

**Need help?** Check the [Troubleshooting Guide](docs/TROUBLESHOOTING.md) or open an issue.

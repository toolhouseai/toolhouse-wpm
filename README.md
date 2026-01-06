# Toolhouse WPM - Multiplayer Typing Game

A real-time multiplayer Words Per Minute (WPM) typing game built with modern web technologies.

## Overview

Race against up to 9 other players in real-time typing challenges. Type as fast and accurately as possible within 60 seconds to earn your score. Anonymous, no accounts required—just create a room and start playing!

## Technology Stack

- **Frontend**: React 18 + Vite
- **Backend**: Node.js running on Cloudflare Workers
- **Real-time Communication**: WebSockets via Cloudflare Durable Objects
- **Database**: SQLite (Cloudflare D1)
- **Styling**: Tailwind CSS
- **Testing**: Vitest

## Project Structure

```
toolhouse-wpm/
├── src/                          # Backend (Cloudflare Workers)
│   ├── index.ts                 # Worker entry point & router
│   ├── api/
│   │   ├── rooms.ts             # Room creation/joining endpoints
│   │   └── passages.ts          # Passages library endpoint
│   ├── game/
│   │   ├── gameRoom.ts          # Durable Object for game sessions
│   │   ├── gameRoom.test.ts
│   │   ├── types.ts             # Game type definitions
│   │   ├── scoring.ts           # WPM & accuracy calculations
│   │   ├── scoring.test.ts
│   │   ├── utils.ts             # Utility functions
│   │   └── utils.test.ts
│   └── db/
│       ├── schema.sql           # Database schema
│       ├── passages.ts          # Sample passages library
│       └── passages.test.ts
├── web/                          # Frontend (React + Vite)
│   ├── src/
│   │   ├── main.tsx             # React entry point
│   │   ├── App.tsx              # Main app component
│   │   ├── index.css            # Tailwind directives
│   │   ├── App.css
│   │   └── types/
│   │       └── index.ts         # Shared types
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
├── wrangler.toml                # Cloudflare Workers config
├── package.json                 # Root dependencies
├── tsconfig.json
├── vitest.config.ts
├── ARCHITECTURE.md              # Detailed architecture docs
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js 18+
- npm or yarn
- Wrangler CLI (`npm install -g wrangler`)
- Cloudflare account (free tier works)

### Installation

1. **Clone and install dependencies:**

```bash
npm install
cd web && npm install && cd ..
```

2. **Set up Cloudflare D1 Database:**

```bash
wrangler d1 create wpm_game_db
```

Update the `database_id` in `wrangler.toml` with your database ID.

3. **Initialize database schema:**

```bash
wrangler d1 execute wpm_game_db --file=./src/db/schema.sql
```

### Development

#### Run Tests

```bash
npm test
```

Monitor tests during development:

```bash
npm test -- --watch
```

#### Start Backend (Cloudflare Workers)

```bash
npm run dev
```

This runs the Worker on `http://localhost:8787`

#### Start Frontend (React + Vite)

In a separate terminal:

```bash
cd web && npm run dev
```

Frontend runs on `http://localhost:3000`

#### Build for Production

```bash
npm run build
```

Builds both backend and frontend. Output:
- Backend: `dist/index.js`
- Frontend: `public/`

#### Deploy to Cloudflare

```bash
wrangler publish
```

## API Endpoints

### Create Room
**POST** `/api/rooms`

Response:
```json
{
  "roomId": "ABC123",
  "sessionId": "uuid",
  "passage": {
    "id": "passage_001",
    "text": "The quick brown fox...",
    "difficulty": "easy",
    "wordCount": 28
  },
  "wsUrl": "ws://localhost:8787/ws/rooms/ABC123"
}
```

### Get Passages
**GET** `/api/passages?action=random`

Response:
```json
{
  "id": "passage_001",
  "text": "...",
  "difficulty": "easy",
  "wordCount": 28
}
```

### WebSocket Connection
**WS** `/ws/rooms/{roomId}`

#### Events (Client → Server)
- `player_joined` - Player enters the room
- `game_start` - Leader starts the game
- `typing_update` - Send typing progress
- `player_left` - Player disconnects

#### Events (Server → Client)
- `connection_established` - Initial connection confirmation
- `player_list_updated` - Updated player list
- `game_started` - Game timer begins
- `player_update` - Another player's progress
- `game_ended` - Results are ready
- `leaderboard` - Final rankings

## Game Flow

1. **Room Creation**: Player creates a room (gets 6-char ID like "ABC123")
2. **Waiting**: Other players join via room ID
3. **Game Start**: Leader clicks "Start Game"
4. **Active**: 60-second countdown, all players type
5. **Results**: Leaderboard shows final rankings by WPM

## Scoring Calculation

**WPM (Words Per Minute):**
```
WPM = (Characters Typed / 5) / (Seconds Elapsed / 60)
```

**Accuracy:**
```
Accuracy = (Correct Characters / Total Characters Typed) × 100
```

**Placement:** Ranked by WPM (descending)

## Database Schema

### `passages`
- `id`: TEXT PRIMARY KEY
- `text`: TEXT (passage content)
- `difficulty`: TEXT (easy/medium/hard)
- `word_count`: INTEGER

### `game_sessions`
- `id`: TEXT PRIMARY KEY
- `room_id`: TEXT UNIQUE
- `passage_id`: TEXT FK
- `leader_id`: TEXT
- `status`: TEXT (waiting/active/completed)
- `started_at`, `ended_at`: TIMESTAMP

### `game_results`
- `id`: TEXT PRIMARY KEY
- `session_id`: TEXT FK
- `player_id`: TEXT
- `wpm`: REAL
- `accuracy`: REAL
- `chars_typed`: INTEGER
- `correct_chars`: INTEGER
- `completed`: BOOLEAN

## Testing Strategy

- **Unit Tests**: Scoring, utilities, passages
- **Integration Tests**: GameRoom Durable Object, WebSocket flow
- **Run tests**: `npm test`

Tests are written before implementation (TDD approach) to ensure reliability.

## Future Enhancements

- [ ] User accounts & authentication
- [ ] Global leaderboards
- [ ] Multiple difficulty levels (with varied passages)
- [ ] Player rejoin capability
- [ ] Replay system
- [ ] Mobile responsiveness
- [ ] Social features (share results, challenges)
- [ ] Achievements/badges
- [ ] Rate limiting & abuse prevention

## Performance Considerations

- **Durable Objects**: Handle ~1000 concurrent connections per instance
- **Message Size**: Keep WebSocket messages minimal (~200 bytes)
- **Broadcast**: Only send relevant updates to reduce bandwidth
- **Database**: Indexed queries on `room_id`, `session_id` for fast lookups

## Troubleshooting

### "Room not found" error
- Ensure the room ID format is exactly 6 uppercase alphanumeric characters
- Room may have expired after a period of inactivity

### WebSocket connection fails
- Check that both frontend and backend servers are running
- Verify proxy settings in `web/vite.config.ts`

### Database errors
- Run `wrangler d1 execute wpm_game_db --file=./src/db/schema.sql` to reinitialize
- Check D1 database ID in `wrangler.toml`

## Contributing

Development happens on feature branches. Follow the architecture in `ARCHITECTURE.md` for any new features.

## License

MIT

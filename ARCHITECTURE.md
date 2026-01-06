# Multiplayer WPM Typing Game - Architecture & Implementation Plan

## Project Overview

A real-time multiplayer Words Per Minute typing game where:
- Players join anonymous sessions (no accounts)
- A session leader creates a room and starts the game
- Maximum 10 players per game session
- 60-second time limit
- Session-based leaderboard showing speeds at game end
- No rejoin, pause, or chat features initially
- Desktop-only, hosted on Cloudflare Workers

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React |
| Backend | Node.js (Cloudflare Workers) |
| Real-time | WebSockets (Cloudflare Durable Objects) |
| Database | PostgreSQL |
| Hosting | Cloudflare Workers + D1 (or external PostgreSQL) |

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (React)                           │
│  ┌─────────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Room Creation   │  │  Game Arena  │  │ Leaderboard View │  │
│  │ & Waiting Room  │  │  (60 seconds)│  │  (Results)       │  │
│  └─────────────────┘  └──────────────┘  └──────────────────┘  │
└────────────────┬──────────────────────────────────────────────┘
                 │
                 │ WebSocket (Durable Objects)
                 │
┌────────────────▼──────────────────────────────────────────────┐
│             CLOUDFLARE WORKERS (Backend)                      │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Worker Routes:                                           │ │
│  │ - POST /api/rooms (create room)                          │ │
│  │ - GET /api/rooms/:roomId (join room)                     │ │
│  │ - GET /api/passages (get text to type)                   │ │
│  │ - WebSocket endpoint → Durable Object                    │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ DURABLE OBJECT (Game Session State)                      │ │
│  │ - Manages per-room state                                 │ │
│  │ - Tracks player connections                             │ │
│  │ - Synchronizes typing progress                          │ │
│  │ - Handles 60-second timer                               │ │
│  │ - Calculates final scores                               │ │
│  └──────────────────────────────────────────────────────────┘ │
└─────────────────────┬──────────────────────────────────────────┘
                      │
                      │ SQL Queries
                      │
         ┌────────────▼──────────┐
         │   PostgreSQL (D1)     │
         │ - Game Results        │
         │ - Passages Library    │
         │ - Session Leaderboard │
         └───────────────────────┘
```

---

## Database Schema

### `passages` Table
```sql
CREATE TABLE passages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  difficulty VARCHAR(20) DEFAULT 'easy',
  word_count INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### `game_sessions` Table
```sql
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id VARCHAR(10) UNIQUE NOT NULL,
  passage_id UUID NOT NULL REFERENCES passages(id),
  leader_id VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'waiting', -- waiting, active, completed
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### `game_results` Table
```sql
CREATE TABLE game_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES game_sessions(id),
  player_id VARCHAR(50) NOT NULL,
  wpm DECIMAL(5, 2),
  accuracy DECIMAL(5, 2),
  chars_typed INT,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Game Flow & State Management

### Room States
1. **WAITING** - Players joining, waiting for leader to start
2. **ACTIVE** - Game running, 60-second timer counting down
3. **COMPLETED** - Game finished, showing leaderboard

### Client-Server Communication

#### Room Creation (HTTP)
```
Client → POST /api/rooms
Response: { roomId: "ABC123", passages: {...} }
```

#### Join Room (HTTP)
```
Client → GET /api/rooms/:roomId
Response: { roomId, players: [...], status, passage }
```

#### WebSocket Events (Durable Object)

**Client → Server:**
- `player_joined` - Player enters the game
- `game_start` - Leader signals game start
- `typing_update` - Send keystroke progress { playerId, charsTyped, accuracy }
- `player_left` - Player disconnects

**Server → Client:**
- `player_list_updated` - List of all players in room
- `game_started` - Game has begun (60-second timer)
- `player_update` - Another player's progress
- `timer_tick` - Remaining seconds (optional, for UI)
- `game_ended` - Time's up, send final results
- `leaderboard` - Final scores { playerId, wpm, accuracy, placement }

---

## Scoring Calculation

**WPM (Words Per Minute):**
```
WPM = (Characters Typed / 5) / (Seconds Elapsed / 60)
```

**Accuracy:**
```
Accuracy = (Correct Characters / Total Typed) * 100
```

**Placement:**
Ranked by WPM (descending)

---

## Implementation Phases

### Phase 1: Core Infrastructure
- [ ] Set up Cloudflare Workers project
- [ ] Create PostgreSQL schema
- [ ] Set up React frontend scaffolding
- [ ] Implement basic routes (room creation, join)
- [ ] Create Durable Object for game state

### Phase 2: Real-time Communication
- [ ] Implement WebSocket connection via Durable Objects
- [ ] Handle player join/leave events
- [ ] Broadcast player list to all clients
- [ ] Implement typing progress synchronization

### Phase 3: Game Logic
- [ ] Implement 60-second timer
- [ ] Calculate WPM and accuracy in real-time
- [ ] Handle game end (time expired)
- [ ] Calculate final rankings

### Phase 4: Frontend UI
- [ ] Room creation screen
- [ ] Waiting/lobby screen (showing players)
- [ ] Game arena (passage display + input field)
- [ ] Live player stats (optional: show all players typing)
- [ ] Leaderboard/results screen

### Phase 5: Polish & Deployment
- [ ] Error handling & edge cases
- [ ] Performance optimization
- [ ] Testing across browsers (desktop)
- [ ] Deploy to Cloudflare

---

## Key Implementation Details

### Durable Object Structure
```javascript
export class GameRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.players = new Map();
    this.gameState = 'waiting'; // waiting, active, completed
    this.startTime = null;
    this.duration = 60000; // 60 seconds in ms
  }

  async handleMessage(sender, message) {
    const { type, payload } = message;

    switch(type) {
      case 'player_joined':
        this.addPlayer(sender, payload);
        this.broadcast('player_list_updated', this.getPlayerList());
        break;
      case 'game_start':
        this.startGame();
        break;
      case 'typing_update':
        this.updatePlayerProgress(sender, payload);
        this.broadcast('player_update', payload);
        break;
      // ... more cases
    }
  }

  startGame() {
    this.gameState = 'active';
    this.startTime = Date.now();
    this.broadcast('game_started', { duration: this.duration });

    // Schedule game end
    setTimeout(() => this.endGame(), this.duration);
  }

  endGame() {
    this.gameState = 'completed';
    const results = this.calculateResults();
    this.broadcast('game_ended', { results });
    // Save to database
  }
}
```

### Room ID Generation
Use 6-character alphanumeric codes: "ABC123", "XYZ789"
- Simple for players to share/remember
- Low collision risk for 10 players max
- Generate with: `Math.random().toString(36).substring(2, 8).toUpperCase()`

### Passages Library
Start with a simple set of passages (15-20 diverse texts)
- Mix of difficulty levels (all 'easy' to start)
- Vary in length (30-100 words)
- Different topics/styles

---

## Error Handling & Edge Cases

1. **Player Disconnects**
   - Remove from active game (no rejoin)
   - Update player list for others
   - Still count their final score if game ends

2. **Leader Disconnects Before Game Starts**
   - Assign leadership to another player, or
   - Allow any remaining player to start game

3. **All Players Disconnect**
   - Clean up Durable Object
   - Mark session as abandoned

4. **Network Latency**
   - Client-side optimistic typing feedback
   - Server-side truth for final score

---

## Development Workflow

1. Create local development environment with Wrangler (Cloudflare CLI)
2. Use `wrangler dev` for local testing
3. Test with multiple browser windows/tabs for multiplayer simulation
4. Deploy with `wrangler publish`

---

## Future Enhancements (Post-MVP)

- [ ] User accounts & global leaderboards
- [ ] Multiple difficulty levels
- [ ] Different passage categories
- [ ] Player rejoin capability
- [ ] Chat during gameplay
- [ ] Mobile responsiveness
- [ ] Replay system
- [ ] Achievements/badges
- [ ] Social sharing
- [ ] Rate limiting & abuse prevention

---

## Performance Considerations

- **Durable Objects**: Can handle real-time updates efficiently (tested to ~1000 concurrent connections)
- **Message Size**: Keep typing updates minimal (just playerId, charsTyped, accuracy)
- **Broadcast**: Use selective broadcasting (only relevant data to each player)
- **Database**: Index on `room_id`, `session_id` for quick queries

---

## Security Notes (Start Simple)

- Room IDs are not secrets (simple 6-char codes, discovery not a concern)
- Anonymous players (no auth needed initially)
- Cheating detection: defer until Phase 2
- Rate limiting on endpoint creation (prevent spam room creation)


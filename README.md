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

## Deployment Guide

### Phase 4: Production Deployment

This section covers deploying Toolhouse WPM to production on Cloudflare.

#### Prerequisites for Deployment

- Cloudflare account (free or paid)
- Domain registered (optional, can use Cloudflare free domain)
- Git repository pushed to GitHub/GitLab
- Environment variables configured

#### Step 1: Configure Environment Variables

Create `.env.production` in the root directory:

```bash
cp .env.example .env.production
```

Update with production values:

```env
# Backend (.env.production)
D1_DATABASE_ID=your-prod-database-id
D1_DATABASE_NAME=wpm_game_db_prod
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token
ENVIRONMENT=production
```

Create `web/.env.production` for frontend:

```bash
cp web/.env.example web/.env.production
```

```env
# Frontend (web/.env.production)
VITE_API_URL=https://your-domain.com
VITE_WS_URL=wss://your-domain.com
VITE_DEBUG=false
```

#### Step 2: Set Up Cloudflare D1 Database

1. **Create production database:**

```bash
wrangler d1 create wpm_game_db_prod
```

2. **Note the database ID** and update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "wpm_game_db_prod"
database_id = "YOUR_DATABASE_ID"
```

3. **Initialize database schema:**

```bash
wrangler d1 execute wpm_game_db_prod --file=./src/db/schema.sql --remote
```

4. **Populate sample data (optional):**

```bash
wrangler d1 execute wpm_game_db_prod --command "INSERT INTO passages (id, text, difficulty, word_count) VALUES ('passage_001', 'The quick brown fox...', 'easy', 28)"
```

#### Step 3: Configure Cloudflare Workers

Update `wrangler.toml` for production:

```toml
name = "toolhouse-wpm-prod"
main = "src/index.ts"
compatibility_date = "2024-12-12"

# Production database binding
[[d1_databases]]
binding = "DB"
database_name = "wpm_game_db_prod"
database_id = "YOUR_PROD_DATABASE_ID"

# Durable Objects for game sessions
[[durable_objects.bindings]]
name = "GAME_ROOM"
class_name = "GameRoom"
script_name = "toolhouse-wpm-prod"

# Routes for production domain
[env.production]
routes = [
  { pattern = "api/*", zone_name = "your-domain.com" },
  { pattern = "*.your-domain.com/*", zone_name = "your-domain.com" }
]

[build]
command = "npm run build"
```

#### Step 4: Build and Deploy

1. **Build both frontend and backend:**

```bash
npm run build
cd web && npm run build && cd ..
```

2. **Deploy to Cloudflare:**

```bash
# Deploy with environment variables
wrangler publish --env production
```

3. **Verify deployment:**

```bash
# Check worker status
wrangler deployments list

# Test API endpoint
curl https://your-domain.com/api/passages
```

#### Step 5: Configure Domain & DNS

1. **Point domain to Cloudflare:**
   - Update your domain registrar's nameservers to Cloudflare's nameservers

2. **Configure Cloudflare DNS:**
   - Go to Cloudflare Dashboard → DNS
   - Add DNS record for worker:
     - Type: CNAME
     - Name: your-domain
     - Target: your-worker.workers.dev

3. **Enable Cloudflare features:**
   - SSL/TLS: Full (strict)
   - Caching: Standard
   - Enable Auto Minify (CSS, JS, HTML)

#### Step 6: Database Migration (if upgrading from existing)

For existing deployments, migrate data safely:

```bash
# Export existing data
wrangler d1 execute wpm_game_db --command "SELECT * FROM game_results LIMIT 1000" > backup.json

# Import to new database
wrangler d1 execute wpm_game_db_prod --file=./import.sql --remote
```

#### Step 7: Health Checks & Monitoring

Set up monitoring for your deployment:

```bash
# Monitor Durable Objects
wrangler tail --env production

# Check recent deployments
wrangler deployments list
```

Create a simple health check endpoint:

```typescript
// In src/index.ts
if (pathname === '/health') {
  return new Response(JSON.stringify({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
```

#### Step 8: Enable Rate Limiting (Optional)

Prevent abuse by adding rate limiting:

```bash
# In Cloudflare Dashboard
# Security → Rate Limiting

# Add rule:
- Path: /api/rooms
- Requests: 10 per minute per IP
- Action: Block
```

#### Step 9: Setup Monitoring & Analytics

1. **Enable Cloudflare Analytics:**
   - Dashboard → Analytics

2. **Monitor WebSocket connections:**
   - Durable Objects → Inspector
   - View real-time activity

3. **Error tracking:**
   - Set up error notifications in Cloudflare Workers settings

#### Troubleshooting Deployment

**"Worker script error"**
- Check `wrangler logs` for errors
- Verify TypeScript builds without errors: `npm run build`
- Ensure all environment variables are set

**"Database connection failed"**
- Verify database ID in `wrangler.toml`
- Check database exists: `wrangler d1 list`
- Initialize schema: `wrangler d1 execute wpm_game_db_prod --file=./src/db/schema.sql --remote`

**"WebSocket connection refused"**
- Ensure Durable Objects are properly configured
- Check domain DNS settings
- Verify SSL/TLS is set to "Full (strict)"

**"CORS errors"**
- Verify CORS headers in Worker: `Access-Control-Allow-Origin: *`
- Check frontend API URL matches deployed backend

#### Rollback Procedure

If deployment has issues:

```bash
# Rollback to previous version
wrangler deployments list
wrangler rollback --message "Rollback to stable version"
```

#### Production Checklist

- [ ] Environment variables configured
- [ ] D1 database created and initialized
- [ ] Database schema applied
- [ ] Durable Objects configured
- [ ] Frontend built (`npm run build`)
- [ ] Backend deployed (`wrangler publish`)
- [ ] DNS configured correctly
- [ ] SSL/TLS enabled
- [ ] Health endpoint responding
- [ ] WebSocket connections working
- [ ] Error monitoring enabled
- [ ] Rate limiting configured
- [ ] Backups scheduled

### Continuous Deployment (CI/CD)

Set up automated deployments with GitHub Actions:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install dependencies
        run: |
          npm install
          cd web && npm install && cd ..

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        run: wrangler publish --env production
```

## Contributing

Development happens on feature branches. Follow the architecture in `ARCHITECTURE.md` for any new features.

## License

MIT

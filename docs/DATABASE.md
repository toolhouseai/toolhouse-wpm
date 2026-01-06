# Database Documentation

Complete guide to database schema, seeding, and maintenance.

## Schema

The application uses Cloudflare D1 (SQLite) with three main tables.

### Tables

#### passages

Stores typing passages for games.

```sql
CREATE TABLE IF NOT EXISTS passages (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'easy',
  word_count INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Fields:**
- `id` - Unique passage identifier (e.g., "passage_001")
- `text` - The passage text players will type
- `difficulty` - Difficulty level: easy, medium, hard
- `word_count` - Number of words in the passage
- `created_at` - When passage was added

**Indexes:**
- Primary key on `id`

---

#### game_sessions

Tracks each game room and its state.

```sql
CREATE TABLE IF NOT EXISTS game_sessions (
  id TEXT PRIMARY KEY,
  room_id TEXT UNIQUE NOT NULL,
  passage_id TEXT NOT NULL,
  leader_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting',
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (passage_id) REFERENCES passages(id)
);
```

**Fields:**
- `id` - Unique session identifier (UUID)
- `room_id` - 6-character room code (e.g., "ABC123")
- `passage_id` - Reference to passages table
- `leader_id` - Player ID of room leader
- `status` - Session status: waiting, active, completed
- `started_at` - When game started
- `ended_at` - When game ended
- `created_at` - When session was created

**Indexes:**
- Primary key on `id`
- Unique index on `room_id`
- Index on `status`

---

#### game_results

Stores player performance for completed games.

```sql
CREATE TABLE IF NOT EXISTS game_results (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  wpm REAL,
  accuracy REAL,
  chars_typed INTEGER,
  correct_chars INTEGER,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES game_sessions(id)
);
```

**Fields:**
- `id` - Unique result identifier (UUID)
- `session_id` - Reference to game_sessions table
- `player_id` - Player identifier
- `wpm` - Words per minute score
- `accuracy` - Accuracy percentage
- `chars_typed` - Total characters typed
- `correct_chars` - Correct characters typed
- `completed` - Whether player finished
- `created_at` - When result was recorded

**Indexes:**
- Primary key on `id`
- Index on `session_id`

---

## Seeding Data

### Initial Setup

Create and seed the database for local development:

```bash
# Initialize schema
wrangler d1 execute wpm_game_db --local --file=./src/db/schema.sql
```

### Seed Passages

The application includes 15 sample passages. Create a seed file:

```bash
cat > seed_passages.sql << 'EOF'
INSERT OR IGNORE INTO passages (id, text, difficulty, word_count) VALUES
('passage_001', 'The quick brown fox jumps over the lazy dog. This sentence contains every letter of the alphabet, making it a perfect pangram for testing typing skills.', 'easy', 28),
('passage_002', 'Coffee is one of the most popular beverages in the world. Whether you prefer it hot or cold, black or with cream, there is no denying its appeal to millions of people every day.', 'easy', 38),
('passage_003', 'Technology has transformed the way we communicate, work, and learn. From smartphones to artificial intelligence, innovations continue to shape our daily lives in remarkable ways.', 'easy', 32),
('passage_004', 'The ancient library of Alexandria was one of the most important centers of learning in the classical world. Scholars from all regions came to study its vast collection of scrolls and manuscripts.', 'medium', 34),
('passage_005', 'In the heart of the rainforest, biodiversity reaches its peak. Countless species, from microscopic organisms to massive jaguars, coexist in an intricate web of interdependence and ecological balance.', 'medium', 33),
('passage_006', 'The phenomenon of bioluminescence has fascinated scientists for centuries. Certain organisms, including fireflies, anglerfish, and dinoflagellates, produce their own light through complex biochemical reactions.', 'medium', 32),
('passage_007', 'Quantum mechanics revolutionized our understanding of the subatomic world. The probabilistic nature of quantum phenomena challenged classical physics and introduced concepts like superposition and entanglement.', 'hard', 28),
('passage_008', 'Metamorphosis represents one of nature''s most extraordinary transformations. The caterpillar''s journey into a butterfly involves a profound reorganization of its cellular structure through the remarkable process of pupation.', 'hard', 32),
('passage_009', 'The Renaissance marked a pivotal transition from medieval to modern times. Characterized by intellectual curiosity and artistic innovation, this epoch witnessed extraordinary achievements in literature, science, and philosophy.', 'hard', 31),
('passage_010', 'Neural networks have become instrumental in advancing artificial intelligence. Their architecture mimics biological brain structures, enabling machines to learn patterns, recognize images, and process information with unprecedented sophistication.', 'hard', 33),
('passage_011', 'Mountains form through tectonic activity over millions of years. Plate collisions, volcanic eruptions, and erosion continuously reshape the landscape, creating the spectacular ranges we see today.', 'easy', 30),
('passage_012', 'The human body contains approximately sixty trillion cells. Each cell performs specialized functions, and together they create a complex system capable of thought, movement, healing, and countless other vital processes.', 'medium', 32),
('passage_013', 'Photosynthesis is the process by which plants convert sunlight into chemical energy. This fundamental biological mechanism feeds nearly all life on Earth and produces the oxygen we depend on for survival.', 'medium', 31),
('passage_014', 'The internet''s exponential growth has fundamentally altered human interaction and commerce. What began as a military communication network has become an indispensable infrastructure connecting billions of people worldwide.', 'medium', 30),
('passage_015', 'Linguistics explores how humans communicate through language. Researchers study syntax, semantics, phonology, and pragmatics to understand the remarkable cognitive abilities that allow us to express infinite ideas with finite words.', 'hard', 32);
EOF
```

Execute the seed file:

```bash
# Local
wrangler d1 execute wpm_game_db --local --file=seed_passages.sql

# Production
wrangler d1 execute wpm_game_db_prod --remote --file=seed_passages.sql
```

---

## Room Lifecycle & Cleanup

### Automatic Cleanup

**Durable Objects (In-Memory Rooms):**

Rooms are stored in Cloudflare Durable Objects and clean up automatically:

1. **During game**: Room is active with WebSocket connections
2. **Game ends**: Results calculated and saved to database
3. **Wait 5 minutes**: Allow players to view results
4. **Cleanup triggered**:
   - All WebSocket connections closed
   - In-memory state cleared
   - Players removed from room
5. **~30 seconds later**: Cloudflare evicts inactive Durable Object

**Database Records:**

- Game sessions and results persist indefinitely by default
- Deploy optional cleanup worker to remove old data

---

### Database Cleanup Worker

The cleanup worker (`src/cleanup.ts`) removes old database records.

#### Deployment

1. **Deploy cleanup worker:**

```bash
wrangler publish src/cleanup.ts --name toolhouse-wpm-cleanup
```

2. **Configure schedule in Cloudflare Dashboard:**
   - Go to Workers & Pages → toolhouse-wpm-cleanup → Triggers
   - Add Cron Trigger: `0 0 * * *` (daily at midnight)

3. **Or add to wrangler.toml:**

```toml
[triggers]
crons = ["0 0 * * *"]
```

#### Cleanup Policy

The worker removes:

- **Game sessions** older than 30 days
- **Orphaned results** (results without matching session)
- **Stale waiting rooms** (never started) older than 7 days

#### Manual Cleanup

Trigger cleanup via HTTP:

```bash
curl -X POST https://toolhouse-wpm-cleanup.your-account.workers.dev/cleanup
```

---

## Database Queries

### Useful Queries

**Get recent games:**
```sql
SELECT
  gs.room_id,
  gs.status,
  gs.created_at,
  COUNT(gr.id) as player_count
FROM game_sessions gs
LEFT JOIN game_results gr ON gs.id = gr.session_id
WHERE gs.created_at > datetime('now', '-1 day')
GROUP BY gs.id
ORDER BY gs.created_at DESC
LIMIT 10;
```

**Get top scores:**
```sql
SELECT
  player_id,
  MAX(wpm) as best_wpm,
  AVG(accuracy) as avg_accuracy,
  COUNT(*) as games_played
FROM game_results
WHERE completed = 1
GROUP BY player_id
ORDER BY best_wpm DESC
LIMIT 10;
```

**Get passage usage stats:**
```sql
SELECT
  p.id,
  p.difficulty,
  COUNT(gs.id) as times_used
FROM passages p
LEFT JOIN game_sessions gs ON p.id = gs.passage_id
GROUP BY p.id
ORDER BY times_used DESC;
```

---

## Migrations

For schema changes, create migration files:

```bash
# Example migration
cat > migrations/001_add_passage_category.sql << 'EOF'
ALTER TABLE passages ADD COLUMN category TEXT DEFAULT 'general';
EOF

# Apply migration
wrangler d1 execute wpm_game_db --file=migrations/001_add_passage_category.sql
```

---

## Backup & Restore

### Backup

```bash
# Export all tables
wrangler d1 export wpm_game_db --output=backup.sql

# Export specific table
wrangler d1 execute wpm_game_db --command="SELECT * FROM game_results" > results_backup.json
```

### Restore

```bash
# Restore from backup
wrangler d1 execute wpm_game_db --file=backup.sql
```

---

## Performance Tips

1. **Indexes**: Already optimized for common queries
2. **Cleanup regularly**: Prevent table bloat
3. **Archive old data**: Move to separate storage if needed
4. **Monitor size**: D1 free tier has storage limits
5. **Use local DB**: For development to avoid API limits

---

## Troubleshooting

**"no such table" error:**
```bash
wrangler d1 execute wpm_game_db --local --file=./src/db/schema.sql
```

**"FOREIGN KEY constraint failed":**
```bash
# Seed passages first
wrangler d1 execute wpm_game_db --local --file=seed_passages.sql
```

**Database ID mismatch:**
```bash
# List databases
wrangler d1 list

# Update wrangler.toml with correct ID
```

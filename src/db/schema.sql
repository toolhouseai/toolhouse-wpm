-- Passages table: library of texts to type
CREATE TABLE IF NOT EXISTS passages (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'easy',
  word_count INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Game sessions table: tracks each game room
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

-- Game results table: stores player scores
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

-- Create indexes for frequently queried fields
CREATE INDEX IF NOT EXISTS idx_game_sessions_room_id ON game_sessions(room_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON game_sessions(status);
CREATE INDEX IF NOT EXISTS idx_game_results_session_id ON game_results(session_id);

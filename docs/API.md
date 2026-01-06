# API Reference

Complete reference for REST API endpoints and WebSocket events.

## REST API Endpoints

### Create Room

Creates a new game room and returns room details with a passage.

**Endpoint:** `POST /api/rooms`

**Response:**
```json
{
  "roomId": "ABC123",
  "sessionId": "uuid-v4",
  "passage": {
    "id": "passage_001",
    "text": "The quick brown fox...",
    "difficulty": "easy",
    "wordCount": 28
  },
  "wsUrl": "ws://localhost:8787/ws/rooms/ABC123"
}
```

**Status Codes:**
- `201` - Room created successfully
- `500` - Server error

---

### Join Room

Get information about an existing room.

**Endpoint:** `GET /api/rooms/{roomId}`

**Parameters:**
- `roomId` - 6-character alphanumeric room code (uppercase)

**Response:**
```json
{
  "roomId": "ABC123",
  "sessionId": "uuid-v4",
  "status": "waiting",
  "passage": {
    "id": "passage_001",
    "text": "The quick brown fox...",
    "difficulty": "easy",
    "wordCount": 28
  },
  "wsUrl": "ws://localhost:8787/ws/rooms/ABC123"
}
```

**Status Codes:**
- `200` - Room found
- `400` - Invalid room ID format
- `404` - Room not found
- `500` - Server error

---

### Get Passages

Retrieve typing passages.

**Endpoint:** `GET /api/passages`

**Query Parameters:**
- `action=random` - Get a random passage
- (no params) - Get all passages

**Response (single passage):**
```json
{
  "id": "passage_001",
  "text": "The quick brown fox...",
  "difficulty": "easy",
  "wordCount": 28
}
```

**Response (all passages):**
```json
{
  "passages": [
    {
      "id": "passage_001",
      "text": "...",
      "difficulty": "easy",
      "wordCount": 28
    }
  ]
}
```

---

### Health Check

Check API health status.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "environment": "development"
}
```

---

## WebSocket API

### Connection

**Endpoint:** `WS /ws/rooms/{roomId}`

Connect to a game room via WebSocket for real-time updates.

**Connection Flow:**
1. Client connects to WebSocket endpoint
2. Server sends `connection_established` with player ID
3. Client sends `player_joined` to join the room
4. Server sends `player_list_updated` with current players
5. Game proceeds with real-time events

---

## WebSocket Events

### Client → Server Events

#### player_joined

Player enters the room.

```json
{
  "type": "player_joined",
  "payload": {
    "playerId": ""
  }
}
```

**Note:** `playerId` can be empty, server assigns one.

---

#### game_start

Leader requests to start the game.

```json
{
  "type": "game_start",
  "payload": {}
}
```

**Authorization:** Only the room leader can start the game.

---

#### typing_update

Send typing progress during gameplay.

```json
{
  "type": "typing_update",
  "payload": {
    "playerId": "player_abc123",
    "charsTyped": 150,
    "correctChars": 145
  }
}
```

**Frequency:** Send updates every few characters typed or periodically.

---

#### player_left

Notify server that player is leaving (optional - connection close triggers this).

```json
{
  "type": "player_left",
  "payload": {
    "playerId": "player_abc123"
  }
}
```

---

### Server → Client Events

#### connection_established

Initial confirmation when WebSocket connects.

```json
{
  "type": "connection_established",
  "payload": {
    "playerId": "player_abc123"
  }
}
```

---

#### player_list_updated

Updated list of players in the room.

```json
{
  "type": "player_list_updated",
  "payload": {
    "players": [
      {
        "id": "player_abc123",
        "joinedAt": 1640000000000
      }
    ],
    "leader": "player_abc123",
    "count": 1,
    "maxPlayers": 10
  }
}
```

**Triggers:**
- Player joins
- Player leaves
- Leader changes

---

#### game_started

Game has begun, timer started.

```json
{
  "type": "game_started",
  "payload": {
    "duration": 60000,
    "startTime": 1640000000000
  }
}
```

**Fields:**
- `duration` - Game length in milliseconds (60000 = 60 seconds)
- `startTime` - Unix timestamp when game started

---

#### player_update

Another player's typing progress.

```json
{
  "type": "player_update",
  "payload": {
    "playerId": "player_xyz789",
    "charsTyped": 200,
    "correctChars": 195
  }
}
```

**Frequency:** Sent when other players send `typing_update` events.

---

#### game_ended

Game completed, results available.

```json
{
  "type": "game_ended",
  "payload": {
    "results": [
      {
        "playerId": "player_abc123",
        "wpm": 75.5,
        "accuracy": 98.5,
        "charsTyped": 250,
        "placement": 1
      }
    ]
  }
}
```

**Fields:**
- `wpm` - Words per minute (chars / 5 / minutes)
- `accuracy` - Percentage of correct characters
- `charsTyped` - Total characters typed
- `placement` - Ranking (1 = first place)

---

#### error

Error message from server.

```json
{
  "type": "error",
  "payload": {
    "message": "Room is full"
  }
}
```

---

## Scoring Formulas

### WPM (Words Per Minute)

```
WPM = (Characters Typed / 5) / (Seconds Elapsed / 60)
```

Standard typing test formula where 5 characters = 1 word.

### Accuracy

```
Accuracy = (Correct Characters / Total Characters Typed) × 100
```

Percentage of characters typed correctly.

### Placement

Ranked by WPM in descending order:
- Highest WPM = 1st place
- Second highest = 2nd place
- etc.

---

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 400 | Invalid room ID format | Room ID must be 6 uppercase alphanumeric characters |
| 404 | Room not found | Room doesn't exist or has expired |
| 500 | Failed to create room | Server error during room creation |
| 500 | Failed to join room | Server error when joining |
| WS 1000 | Game completed | Normal WebSocket closure after game ends |
| WS 1006 | Connection lost | Abnormal connection termination |

---

## Rate Limits

Currently no rate limiting is enforced. For production deployments, consider:

- **Room creation**: 10 requests per minute per IP
- **Join room**: 20 requests per minute per IP
- **WebSocket connections**: 5 concurrent per IP

See [Deployment Guide](DEPLOYMENT.md) for rate limiting configuration.

# Troubleshooting Guide

Common issues and their solutions.

## Development Issues

### "Failed to fetch" / CORS Errors

**Symptom:** Browser console shows CORS policy errors when accessing API.

**Cause:** Backend server not running or CORS headers not configured.

**Solution:**

1. Ensure backend is running:
```bash
npm run dev
# Should show: Ready on http://localhost:8787
```

2. Check CORS headers in `src/api/utils.ts`:
```typescript
'Access-Control-Allow-Origin': '*'
```

3. Restart backend server to apply changes

---

### Database Errors

#### "no such table: game_sessions"

**Cause:** Database schema not initialized.

**Solution:**

```bash
wrangler d1 execute wpm_game_db --local --file=./src/db/schema.sql
```

---

#### "FOREIGN KEY constraint failed"

**Cause:** Passages table is empty (passages must exist before creating game sessions).

**Solution:**

```bash
# Seed passages
wrangler d1 execute wpm_game_db --local --file=seed_passages.sql
```

See [DATABASE.md](DATABASE.md) for complete seed data.

---

#### "D1_ERROR: no such table"

**Cause:** Wrong database or database not initialized.

**Solution:**

1. Check database ID in `wrangler.toml`:
```bash
wrangler d1 list
```

2. Update `wrangler.toml` with correct database_id

3. Initialize schema:
```bash
wrangler d1 execute wpm_game_db --local --file=./src/db/schema.sql
```

---

### WebSocket Connection Issues

#### "WebSocket connection failed"

**Symptom:** Players stuck on "Connecting to room..." screen.

**Cause:** WebSocket endpoint not accessible or Durable Object not configured.

**Solutions:**

1. **Check backend is running:**
```bash
# Should show: Ready on http://localhost:8787
npm run dev
```

2. **Verify Durable Object configuration in wrangler.toml:**
```toml
[[durable_objects.bindings]]
name = "GAME_ROOM"
class_name = "GameRoom"
script_name = "toolhouse-wpm"
```

3. **Test WebSocket endpoint:**
```bash
# Install wscat: npm install -g wscat
wscat -c ws://localhost:8787/ws/rooms/TEST01
```

4. **Check browser console for detailed error messages**

---

#### "Error: Network connection lost"

**Cause:** Server restarted or connection interrupted.

**Solution:**
- Frontend automatically attempts to reconnect
- Refresh page if reconnection fails
- Check server logs for errors

---

### "Room not found" Error

**Symptom:** Cannot join room with valid-looking code.

**Causes & Solutions:**

1. **Room expired:**
   - Rooms cleanup 5 minutes after game ends
   - Create a new room

2. **Wrong room code:**
   - Room codes are case-sensitive
   - Must be exactly 6 characters (uppercase letters/numbers)

3. **Room in different environment:**
   - Development rooms only exist locally
   - Production rooms only on deployed server

---

### Players Stuck in Waiting Room

**Symptom:** Leader starts game but other players don't transition.

**Cause:** Frontend not listening to `game_started` WebSocket event.

**Solution:**

1. Check browser console for errors
2. Verify WebSocket connection is active
3. Refresh page and rejoin room

**Code fix** (if issue persists):

Check `web/src/App.tsx` for game state transition:

```typescript
useEffect(() => {
  if (gameRoom.gameState === 'active' && currentPage === 'waiting') {
    setCurrentPage('game');
  }
}, [gameRoom.gameState, currentPage]);
```

---

### Port Already in Use

**Symptom:** `EADDRINUSE` error when starting dev server.

**Solution:**

```bash
# Find process using port 8787
lsof -i:8787

# Kill the process
kill -9 <PID>

# Or use different port in wrangler.toml
```

---

## Production Issues

### Deployment Failures

#### "Worker script error"

**Cause:** TypeScript compilation or runtime errors.

**Solutions:**

1. **Check build locally:**
```bash
npm run build
# Look for TypeScript errors
```

2. **View deployment logs:**
```bash
wrangler tail --env production
```

3. **Check wrangler logs:**
```bash
wrangler deployments list
wrangler deployments view <deployment-id>
```

---

#### "Database connection failed"

**Cause:** Database ID mismatch or database not initialized.

**Solutions:**

1. **Verify database exists:**
```bash
wrangler d1 list
```

2. **Check wrangler.toml has correct database_id**

3. **Initialize production database:**
```bash
wrangler d1 execute wpm_game_db_prod --remote --file=./src/db/schema.sql
```

4. **Seed passages:**
```bash
wrangler d1 execute wpm_game_db_prod --remote --file=seed_passages.sql
```

---

### WebSocket Issues in Production

#### "WebSocket connection refused"

**Causes & Solutions:**

1. **SSL/TLS misconfigured:**
   - Go to Cloudflare Dashboard → SSL/TLS
   - Set to "Full (strict)"

2. **Durable Objects not configured:**
```toml
[[durable_objects.bindings]]
name = "GAME_ROOM"
class_name = "GameRoom"
script_name = "toolhouse-wpm-prod"
```

3. **Frontend using wrong URL:**
   - Check `web/.env.production`
   - Should use `wss://` (not `ws://`)

---

### High Latency / Slow Performance

**Causes & Solutions:**

1. **Database query slow:**
   - Check indexes exist (see DATABASE.md)
   - Enable cleanup worker to remove old data

2. **Too many WebSocket messages:**
   - Reduce typing_update frequency
   - Only send updates when needed

3. **Large passages:**
   - Keep passages under 500 words
   - Passages are sent to all players

---

### Rate Limiting

#### "Too Many Requests" (429)

**Cause:** Hitting rate limits.

**Solutions:**

1. **For development:**
   - Wait a minute before retrying
   - Use local development environment

2. **For production:**
   - Configure rate limiting in Cloudflare Dashboard
   - Implement client-side debouncing
   - Cache API responses

---

## Testing Issues

### Tests Failing

#### "Cannot find module" errors

**Solution:**

```bash
# Install dependencies
npm install
cd web && npm install && cd ..

# Clear cache
rm -rf node_modules
npm install
```

---

#### Vitest hanging

**Solution:**

```bash
# Run with timeout
npm test -- --testTimeout=10000

# Run specific test
npm test -- gameRoom.test.ts
```

---

## Browser-Specific Issues

### Safari WebSocket Issues

**Symptom:** WebSocket connections fail in Safari only.

**Solution:**

1. Enable Developer menu → Disable local file restrictions
2. Check Safari console for specific errors
3. Ensure backend uses secure WebSocket (wss://) in production

---

### Chrome ERR_CONNECTION_REFUSED

**Cause:** Mixed content (HTTP page trying to connect to HTTPS WebSocket).

**Solution:**

1. Ensure frontend uses same protocol as backend
2. In development, both should use http:// / ws://
3. In production, both should use https:// / wss://

---

## Data Issues

### Missing Passages

**Symptom:** "Failed to create room" error after database initialization.

**Solution:**

```bash
# Check if passages exist
wrangler d1 execute wpm_game_db --command "SELECT COUNT(*) FROM passages"

# If count is 0, seed passages
wrangler d1 execute wpm_game_db --local --file=seed_passages.sql
```

---

### Database Full

**Symptom:** "Database storage limit exceeded"

**Solution:**

1. **Deploy cleanup worker:**
```bash
wrangler publish src/cleanup.ts --name toolhouse-wpm-cleanup
```

2. **Manual cleanup:**
```bash
# Delete old sessions
wrangler d1 execute wpm_game_db --command "DELETE FROM game_sessions WHERE created_at < date('now', '-30 days')"
```

3. **Upgrade to paid D1 plan** if needed

---

## Getting More Help

### Useful Commands

```bash
# View backend logs
wrangler tail

# List databases
wrangler d1 list

# Check database contents
wrangler d1 execute wpm_game_db --command "SELECT * FROM game_sessions LIMIT 5"

# View recent deployments
wrangler deployments list

# Check worker status
wrangler deployments view
```

### Debug Mode

Enable debug logging:

**Frontend** (`web/.env.local`):
```env
VITE_DEBUG=true
```

**Backend** (add to code):
```typescript
console.log('Debug:', someVariable);
```

View logs:
```bash
wrangler tail
```

---

### Still Having Issues?

1. Check [GitHub Issues](https://github.com/your-repo/issues)
2. Review [Cloudflare Status](https://www.cloudflarestatus.com/)
3. Consult [Cloudflare Docs](https://developers.cloudflare.com/)
4. Ask in [Cloudflare Discord](https://discord.gg/cloudflaredev)

---

## Common Error Messages Reference

| Error | Meaning | Solution |
|-------|---------|----------|
| `EADDRINUSE` | Port already in use | Kill process or use different port |
| `D1_ERROR` | Database error | Check database exists and schema initialized |
| `CORS policy` | CORS headers missing | Check backend CORS configuration |
| `429` | Rate limited | Wait and retry, implement rate limiting |
| `500` | Server error | Check wrangler logs for details |
| `101 Switching Protocols` | WebSocket upgrade successful | This is normal/good! |
| `1006` | Abnormal WebSocket close | Connection lost, will auto-reconnect |

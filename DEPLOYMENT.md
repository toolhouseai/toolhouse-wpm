# Deployment Guide - Toolhouse WPM

Complete step-by-step guide for deploying Toolhouse WPM to production on Cloudflare.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Setup](#local-setup)
3. [Database Setup](#database-setup)
4. [Configuration](#configuration)
5. [Building](#building)
6. [Deployment](#deployment)
7. [Verification](#verification)
8. [Monitoring](#monitoring)
9. [Troubleshooting](#troubleshooting)
10. [CI/CD Setup](#cicd-setup)

## Prerequisites

### Required Accounts & Tools

- **Cloudflare Account**: Free or paid tier (free tier works for MVP)
- **Domain Name**: Optional (can use Cloudflare free domain)
- **Git Repository**: GitHub, GitLab, or similar
- **Command Line Tools**:
  - Node.js 18+
  - npm or yarn
  - Wrangler CLI: `npm install -g wrangler@latest`
  - Git

### Verify Installation

```bash
# Check versions
node --version      # Should be v18+
npm --version       # Should be v8+
wrangler --version  # Should be v3+

# Test Wrangler
wrangler whoami      # Should show your Cloudflare account
```

## Local Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/toolhouse-wpm.git
cd toolhouse-wpm
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd web && npm install && cd ..

# Verify installation
npm test
```

### 3. Configure Local Environment

```bash
# Copy environment templates
cp .env.example .env.local
cp web/.env.example web/.env.local

# Update .env.local with local values (leave defaults for development)
# VITE_API_URL=http://localhost:8787
# VITE_WS_URL=ws://localhost:8787
```

### 4. Test Locally

```bash
# Terminal 1: Run backend
npm run dev

# Terminal 2: Run frontend (in separate terminal)
cd web && npm run dev

# Terminal 3: Run tests (in another terminal)
npm test

# Access application
# Frontend: http://localhost:3000
# Backend: http://localhost:8787
# Health: http://localhost:8787/health
```

## Database Setup

### Development Database

For local development, use Cloudflare D1:

```bash
# Create local development database
wrangler d1 create wpm_game_db --local

# Initialize schema
wrangler d1 execute wpm_game_db --file=./src/db/schema.sql --local

# Verify tables created
wrangler d1 execute wpm_game_db --command "SELECT name FROM sqlite_master WHERE type='table'" --local
```

### Production Database

```bash
# Create production database
wrangler d1 create wpm_game_db_prod

# Note the database_id from output
# Update wrangler.toml with the database_id

# Initialize schema
wrangler d1 execute wpm_game_db_prod --file=./src/db/schema.sql --remote

# Verify schema
wrangler d1 execute wpm_game_db_prod --command "SELECT name FROM sqlite_master WHERE type='table'" --remote
```

## Configuration

### 1. Update wrangler.toml

```toml
name = "toolhouse-wpm"
main = "src/index.ts"
compatibility_date = "2024-12-12"
compatibility_flags = ["nodejs_compat"]

# Database bindings
[[d1_databases]]
binding = "DB"
database_name = "wpm_game_db"
database_id = "YOUR_DATABASE_ID"

# Durable Objects
[[durable_objects.bindings]]
name = "GAME_ROOM"
class_name = "GameRoom"
script_name = "toolhouse-wpm"

[build]
command = "npm run build"

[build.upload]
format = "service-worker"

# Development environment
[env.development]
d1_databases = [{binding = "DB", database_name = "wpm_game_db", database_id = "YOUR_DEV_DB_ID"}]

# Production environment
[env.production]
d1_databases = [{binding = "DB", database_name = "wpm_game_db_prod", database_id = "YOUR_PROD_DB_ID"}]
routes = [
  {pattern = "your-domain.com/*", zone_name = "your-domain.com"}
]
```

### 2. Environment Variables

#### Backend (.env.local for local development)

```env
# Cloudflare configuration
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token

# D1 Database
D1_DATABASE_ID=your-database-id
D1_DATABASE_NAME=wpm_game_db

# Environment
ENVIRONMENT=development
DEBUG=true
```

#### Frontend (web/.env.local)

```env
# API configuration
VITE_API_URL=http://localhost:8787
VITE_WS_URL=ws://localhost:8787

# Features
VITE_DEBUG=true
```

### 3. Cloudflare Dashboard Settings

#### SSL/TLS
- Go to **SSL/TLS** → **Overview**
- Set to **Full (Strict)**

#### Security
- Go to **Security** → **Settings**
- Enable **Bot Fight Mode** (free plan)
- Set **Challenge Passage** to 2 days

#### Caching
- Go to **Caching** → **Configuration**
- Set **Browser Cache TTL** to 30 minutes
- Enable **Cache Everything**

#### Performance
- Go to **Speed** → **Optimization**
- Enable **Auto Minify** (CSS, JS, HTML)
- Enable **Rocket Loader** (JavaScript)

## Building

### Frontend Build

```bash
cd web

# Development build
npm run build

# Check output
ls dist/

# Should contain index.html, assets/main.*.js, etc.
```

### Backend Build

```bash
# Root directory
npm run build

# Check output
ls dist/index.js
```

### Full Build

```bash
# Build everything at once
npm run build

# Verify outputs
ls -la dist/           # Backend build
ls -la public/         # Frontend build (if configured)
```

## Deployment

### 1. Authenticate with Cloudflare

```bash
wrangler login

# Follow prompts to authenticate
# Browser will open for authorization
```

### 2. Deploy Backend

```bash
# Staging deployment
wrangler publish --env staging

# Production deployment
wrangler publish --env production
```

### 3. Deploy Frontend

The frontend should be served by the Cloudflare Worker or configured separately:

#### Option A: Serve from Worker (Recommended)

```bash
# Build frontend
cd web && npm run build && cd ..

# Copy to public directory
mkdir -p public
cp -r web/dist/* public/

# Update wrangler.toml to serve static files
```

#### Option B: Use Cloudflare Pages

```bash
# Install Pages plugin
npm install -D wrangler-pages-plugin

# Deploy to Pages
wrangler pages deploy web/dist/
```

### 4. Verify Deployment

```bash
# Check deployment status
wrangler deployments list

# Test health endpoint
curl https://your-domain.com/health

# Should return:
# {
#   "status": "healthy",
#   "timestamp": "2024-01-06T...",
#   "version": "1.0.0"
# }
```

## Verification

### API Endpoints

```bash
# Create room
curl -X POST https://your-domain.com/api/rooms

# Get passages
curl https://your-domain.com/api/passages?action=random

# Health check
curl https://your-domain.com/health

# Status check
curl https://your-domain.com/status
```

### WebSocket Connection

```bash
# Using websocat (install with: cargo install websocat)
websocat wss://your-domain.com/ws/rooms/ABC123

# Should see connection message:
# {"type":"connection_established","payload":{"playerId":"player_..."}}
```

### Database Verification

```bash
# Check tables in production database
wrangler d1 execute wpm_game_db_prod --command "SELECT name FROM sqlite_master WHERE type='table'" --remote

# Should show:
# passages
# game_sessions
# game_results
```

## Monitoring

### Health Checks

Set up Cloudflare Workers monitoring:

```bash
# Enable tail logging
wrangler tail --env production

# View real-time logs as requests come in
```

### Analytics

In Cloudflare Dashboard:

1. **Analytics** → **Overview**
   - Monitor request volume
   - Check error rates
   - View traffic patterns

2. **Analytics** → **Durable Objects**
   - Monitor game sessions
   - Check connection counts
   - View resource usage

3. **Workers & Pages** → **Analytics**
   - CPU time
   - Requests
   - Errors

### Set Up Alerts

```bash
# In Cloudflare Dashboard
# Notifications → Notification policies

# Create alert for:
# - Worker errors
# - High error rate (>1%)
# - Unusual traffic patterns
```

## Troubleshooting

### Build Issues

**Error: "TypeScript error"**

```bash
# Check for errors
npm run build

# Fix errors individually
npm run typecheck

# Ensure all dependencies installed
npm install
```

**Error: "Module not found"**

```bash
# Reinstall dependencies
rm -rf node_modules web/node_modules
npm install
cd web && npm install && cd ..
```

### Deployment Issues

**Error: "Invalid wrangler.toml"**

```bash
# Validate configuration
wrangler publish --dry-run

# Check syntax:
wrangler publish --env production --dry-run
```

**Error: "D1 database not found"**

```bash
# List databases
wrangler d1 list

# Verify database_id in wrangler.toml matches output
# Recreate if needed:
wrangler d1 create wpm_game_db_prod
```

**Error: "Durable Object binding not found"**

```bash
# Verify in wrangler.toml:
# [[durable_objects.bindings]]
# name = "GAME_ROOM"
# class_name = "GameRoom"
# script_name = "toolhouse-wpm"

# Redeploy with migrations
wrangler publish --compatibility-flags nodejs_compat
```

### Runtime Issues

**"WebSocket connection refused"**

```bash
# Check worker logs
wrangler tail --env production

# Verify Durable Objects are running:
# Cloudflare Dashboard → Workers → Inspector

# Ensure domain is correctly configured
```

**"Database connection timeout"**

```bash
# Test database connection
wrangler d1 execute wpm_game_db_prod --command "SELECT 1" --remote

# Check database query limits
# D1 free tier: 100k queries/day
```

**"CORS errors on frontend"**

```bash
# Verify CORS headers in src/index.ts:
# 'Access-Control-Allow-Origin': '*'

# Check frontend API URL:
# echo $VITE_API_URL
# Should be: https://your-domain.com
```

## CI/CD Setup

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test-and-build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: |
        npm install
        cd web && npm install && cd ..

    - name: Run tests
      run: npm test

    - name: Build
      run: npm run build

    - name: Check build output
      run: |
        test -f dist/index.js
        test -d web/dist || true

  deploy:
    needs: test-and-build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'

    steps:
    - uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: |
        npm install
        cd web && npm install && cd ..

    - name: Build
      run: npm run build

    - name: Deploy to Cloudflare
      env:
        CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
      run: npx wrangler@latest publish --env production
```

### Set Up Secrets in GitHub

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add secrets:
   - `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token
   - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID

### Create API Token

1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click **Create Token**
3. Use **Edit Cloudflare Workers** template
4. Set permissions:
   - Account > Cloudflare Workers > Edit
   - Zone > D1 > Edit (if using D1)
5. Copy token and add to GitHub secrets

## Production Checklist

Before going live, verify:

- [ ] All tests passing (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] TypeScript errors resolved (`npm run typecheck`)
- [ ] Environment variables configured
- [ ] D1 database created and initialized
- [ ] Database schema applied
- [ ] Durable Objects configured in wrangler.toml
- [ ] CORS headers configured
- [ ] Frontend API URL matches backend domain
- [ ] SSL/TLS set to "Full (Strict)"
- [ ] Health endpoint responding
- [ ] WebSocket connection working
- [ ] Error monitoring enabled
- [ ] Rate limiting configured (optional)
- [ ] Backups configured
- [ ] CI/CD pipeline working
- [ ] Team notified of deployment

## Rollback Procedure

If issues occur in production:

```bash
# View recent deployments
wrangler deployments list

# Identify last stable version
# Example output:
# │ Deployment ID │ Version │ Timestamp │
# │ abcd1234 │ 2 │ 2024-01-06T15:30Z │
# │ efgh5678 │ 1 │ 2024-01-05T10:20Z │

# Rollback to previous version
wrangler rollback --version 1 --message "Rollback due to database issue"

# Monitor logs after rollback
wrangler tail --env production
```

## Post-Deployment

### Update Monitoring

1. Update monitoring dashboard with new deployment
2. Notify team of new version
3. Monitor error rates for 24 hours
4. Review analytics for unusual patterns

### Documentation

1. Update team wiki with deployment info
2. Document any custom configurations
3. Add new endpoints to API documentation
4. Update runbooks for operations team

## Support

For issues or questions:

1. Check logs: `wrangler tail --env production`
2. Review Cloudflare status: https://www.cloudflarestatus.com/
3. Check GitHub issues for known problems
4. Contact Cloudflare support for platform issues

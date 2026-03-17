# Spec Hub

A collaborative specification management system for research teams. Track requirements, decisions, definitions, rules, and releases across multiple projects with real-time sync.

## Quick Start (Local)

### Prerequisites

- **Node.js** 20+
- **PostgreSQL** (via Homebrew: `brew install postgresql@17 && brew services start postgresql@17`)

### 1. Set up the database

```bash
psql -d postgres -c "CREATE USER spec WITH PASSWORD 'changeme';"
psql -d postgres -c "CREATE DATABASE spec_hub OWNER spec;"
```

### 2. Install dependencies

```bash
npm install
cd server && npm install && cd ..
```

### 3. Start the backend

```bash
cd server
DATABASE_URL="postgresql://spec:changeme@localhost:5432/spec_hub" npm start
```

The server auto-initializes the database schema and loads seed data on first run.

### 4. Start the frontend (new terminal)

```bash
npm run dev
```

### 5. Open in browser

Go to **http://localhost:5173** and click **Try Demo** to enter immediately.

To create your own account, click **Sign Up** instead.

## Features

- **Multi-project hub** with sidebar navigation and project wizard
- **5 item types**: Requirements, Decisions, Definitions, Rules, Releases
- **Spec Board**: Kanban-style overview grouped by module
- **Detail panel**: Full item view with comments, activity log, status changes
- **Real-time sync**: WebSocket-based — changes appear instantly for all users
- **Persistent data**: PostgreSQL storage survives restarts
- **Multi-user auth**: JWT-based signup/signin

## Production Deployment (Docker)

See `docker-compose.prod.yml` for Docker-based deployment with Watchtower auto-updates. Push to `main` triggers GitHub Actions to build and push images to GHCR.

```bash
cp .env.example .env
# Edit .env with your DB_PASSWORD, JWT_SECRET, IMAGE_PREFIX
docker compose -f docker-compose.prod.yml up -d
```

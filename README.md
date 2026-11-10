# CSA Workbench

A collaborative workbench for Cloud Solution Architects. Capture requirements, NFRs, ADRs, RAID items and architecture components per customer engagement, get a rule-based Well-Architected health check with one-click fixes, and generate customer-ready deliverables. Multi-cloud (Azure / AWS / GCP) with real-time sync.

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

- **Engagement wizard** — pick a template (Migration, Modernization, Greenfield, Landing Zone, Data & AI, PoC), target clouds and workloads; optionally start with a WAF NFR checklist, template requirements/RAID and a landing-zone baseline on the primary cloud
- **5 CSA item types**: Requirements (MoSCoW), NFRs (per pillar, metric + target), ADRs (context / options / decision / consequences), RAID log (likelihood × impact), Architecture components (provider, layer, service, SKU, HA/DR, monthly cost)
- **Architecture health check** (`src/lib/health.js`) — scores the 5 Well-Architected pillars plus governance, lists next best actions, each with a one-click fix (prefilled form, open item, or jump to page)
- **Phase gates** — Discovery → Design → Build → Handover exit criteria computed from the data
- **Architecture view** by layer with per-provider cost roll-up vs. budget NFR; **traceability matrix** (click to link requirements/NFRs to components)
- **Multi-cloud catalog** — service suggestions per provider/layer and Azure/AWS/GCP equivalents on every component
- **Smart note import** — paste workshop notes; each line is auto-classified (type, pillar, RAID type, provider) into a triage inbox
- **Deliverables** — High-Level Design, ADR pack (MADR), weekly status report, multi-cloud mapping (Markdown) and RAID log (CSV)
- **Real-time sync** (WebSocket), PostgreSQL persistence, JWT multi-user auth
- Shortcut: press `N` to add an item of the current page's type; `⌘↵` saves a form

Existing databases are migrated automatically (`projects.meta` column). Seed data (`db/seed.sql`) loads only on a fresh database.

## Production Deployment (Docker)

See `docker-compose.prod.yml` for Docker-based deployment with Watchtower auto-updates. Push to `main` triggers GitHub Actions to build and push images to GHCR.

```bash
cp .env.example .env
# Edit .env with your DB_PASSWORD, JWT_SECRET, IMAGE_PREFIX
docker compose -f docker-compose.prod.yml up -d
```

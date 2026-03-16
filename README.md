# SAP HANA Monitor

A web application for monitoring SAP HANA database instances. Built with a **Next.js** frontend and **Nest.js** backend, using **PostgreSQL** to store configuration and historical data, and the **hdb** driver to connect to HANA instances.

---

## Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Set Up PostgreSQL](#2-set-up-postgresql)
  - [3. Configure Environment Variables](#3-configure-environment-variables)
  - [4. Install Dependencies](#4-install-dependencies)
  - [5. Run Database Migrations](#5-run-database-migrations)
  - [6. Start the Application](#6-start-the-application)
- [Default Credentials](#default-credentials)
- [Features](#features)
- [API Reference](#api-reference)
  - [Authentication](#authentication)
  - [HANA Instances](#hana-instances)
  - [Metric Definitions](#metric-definitions)
  - [Schedules](#schedules)
  - [Live Metrics (SSE)](#live-metrics-sse)
- [Database Schema](#database-schema)
- [Frontend Pages](#frontend-pages)
- [Scripts Reference](#scripts-reference)
- [Roadmap](#roadmap)

---

## Architecture

```
┌──────────────────┐        ┌──────────────────┐        ┌──────────────┐
│                  │  HTTP   │                  │ Prisma │              │
│  Next.js App     │◄──────►│  Nest.js API     │◄──────►│  PostgreSQL  │
│  (Port 3000)     │  SSE   │  (Port 3001)     │        │  (Port 5432) │
│                  │        │                  │        │              │
└──────────────────┘        └────────┬─────────┘        └──────────────┘
                                     │
                                     │ hdb driver
                                     ▼
                            ┌──────────────────┐
                            │  SAP HANA        │
                            │  Instances       │
                            └──────────────────┘
```

- **Frontend** — Handles the UI: login, sidebar navigation, drag-and-drop dashboard with live metrics, instance/metric/schedule management.
- **Backend** — Exposes a REST API with JWT-based authentication. Streams live metrics via SSE. Runs a background scheduler for historical data collection.
- **PostgreSQL** — Stores HANA instance configs, metric definitions, schedules, and historical metric snapshots.
- **SAP HANA** — Target databases being monitored. The backend connects to them using the `hdb` Node.js driver for both live streaming and scheduled collection.

---

## Tech Stack

| Layer     | Technology                        | Version |
|-----------|-----------------------------------|---------|
| Frontend  | Next.js (App Router)              | 16.x    |
| Frontend  | React                             | 19.x    |
| Frontend  | Tailwind CSS                      | 4.x     |
| Frontend  | react-grid-layout                 | 2.x     |
| Frontend  | TypeScript                        | 5.x     |
| Backend   | Nest.js                           | 11.x    |
| Backend   | Prisma ORM                        | 6.x     |
| Backend   | Passport + JWT                    | -       |
| Backend   | hdb (SAP HANA driver)             | -       |
| Database  | PostgreSQL                        | 18.x    |

---

## Project Structure

```
.
├── backend/                    # Nest.js API server
│   ├── prisma/
│   │   ├── migrations/         # Database migration files
│   │   └── schema.prisma       # Prisma schema definition
│   ├── src/
│   │   ├── auth/               # Authentication module (JWT + Passport)
│   │   ├── instances/          # HANA instances CRUD + connectivity test
│   │   ├── metric-definitions/ # Metric definitions CRUD (name, query, unit, etc.)
│   │   ├── metrics/            # Live metrics SSE streaming
│   │   ├── schedules/          # Schedules CRUD + background runner
│   │   ├── prisma/             # Prisma database service
│   │   ├── types/
│   │   │   └── hdb.d.ts        # Type declarations for hdb driver
│   │   ├── app.module.ts
│   │   └── main.ts             # Application entry point
│   ├── .env                    # Environment variables (not committed)
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                   # Next.js web application
│   ├── src/
│   │   ├── app/
│   │   │   ├── dashboard/
│   │   │   │   ├── instances/
│   │   │   │   │   └── page.tsx    # Manage HANA instances
│   │   │   │   ├── metrics/
│   │   │   │   │   └── page.tsx    # Manage metric definitions
│   │   │   │   ├── schedules/
│   │   │   │   │   └── page.tsx    # Manage collection schedules
│   │   │   │   ├── layout.tsx      # Dashboard layout with sidebar + header
│   │   │   │   └── page.tsx        # Live dashboard with drag-and-drop cards
│   │   │   ├── globals.css
│   │   │   ├── layout.tsx          # Root layout
│   │   │   └── page.tsx            # Login page
│   │   └── components/
│   │       ├── connection-context.tsx  # React Context for instance/connection state
│   │       └── sidebar.tsx            # Sidebar navigation
│   ├── package.json
│   └── tsconfig.json
│
├── .gitignore
└── README.md
```

---

## Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x
- **PostgreSQL** >= 14.x (running locally or remotely)

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/thiagofcs/hana-monitor.git
cd hana-monitor
```

### 2. Set Up PostgreSQL

Create the application database:

```bash
psql -h localhost -U postgres -c "CREATE DATABASE sap_monitor;"
```

### 3. Configure Environment Variables

Create the backend `.env` file:

```bash
cat > backend/.env << 'EOF'
DATABASE_URL="postgresql://postgres:admin@localhost:5432/sap_monitor?schema=public"
JWT_SECRET="sap-monitor-secret-key"
ENCRYPTION_KEY="a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6"
EOF
```

| Variable         | Description                                   | Default                          |
|------------------|-----------------------------------------------|----------------------------------|
| `DATABASE_URL`   | PostgreSQL connection string                  | *(required)*                     |
| `JWT_SECRET`     | Secret key for signing JWT tokens             | `sap-monitor-secret-key`         |
| `ENCRYPTION_KEY` | AES key for encrypting stored HANA passwords  | *(required for production)*      |

### 4. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 5. Run Database Migrations

```bash
cd backend
npx prisma migrate dev
```

This creates the `hana_instances`, `metrics`, `schedules`, and `metric_snapshots` tables.

### 6. Start the Application

Open two terminals:

```bash
# Terminal 1 — Backend (port 3001)
cd backend
npm run start:dev

# Terminal 2 — Frontend (port 3000)
cd frontend
npm run dev
```

Open your browser at **http://localhost:3000**.

---

## Default Credentials

| Username | Password |
|----------|----------|
| `admin`  | `admin`  |

> **Note:** Authentication currently uses a mock user defined in `backend/src/auth/auth.service.ts`. This will be replaced by a proper user table in a future iteration.

---

## Features

### Live Dashboard
- Drag-and-drop, resizable metric cards using `react-grid-layout`
- Real-time metric streaming via Server-Sent Events (SSE)
- Shared HANA connection per instance — multiple browser tabs share a single poller
- Instance selector and connection status in the header bar
- Layout persisted to localStorage with a reset option

### Manage Instances
- CRUD for SAP HANA database connections (host, port, credentials, SSL)
- Test connectivity to HANA instances directly from the UI
- Passwords are stripped from API responses

### Manage Metrics
- User-defined SQL metrics (not hardcoded) — any `SELECT` query that returns a single value
- Configure display properties: name, unit, refresh interval, color, default card size

### Schedules
- Schedule any metric to run against any instance at a configurable interval (5s–24h)
- Background runner manages HANA connections and timers, syncs dynamically on CRUD changes
- Historical snapshots stored in PostgreSQL as JSON (supports future multi-value metrics)
- Snapshots include direct `metricId` and `instanceId` foreign keys for self-contained history
- Enable/disable schedules without deleting them

---

## API Reference

All endpoints (except login) require a JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

SSE endpoints also accept the token as a query parameter (`?token=<token>`) since `EventSource` cannot set headers.

### Authentication

| Method | Endpoint         | Body                                    | Description             |
|--------|------------------|-----------------------------------------|-------------------------|
| POST   | `/auth/login`    | `{ "username": "...", "password": "..." }` | Returns JWT token       |
| GET    | `/auth/profile`  | -                                       | Returns current user    |

**Login response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "username": "admin"
}
```

### HANA Instances

| Method | Endpoint                | Body                          | Description                          |
|--------|-------------------------|-------------------------------|--------------------------------------|
| GET    | `/instances`            | -                             | List all instances (passwords omitted) |
| GET    | `/instances/:id`        | -                             | Get a single instance                |
| POST   | `/instances`            | `CreateInstanceDto`           | Create a new instance                |
| PATCH  | `/instances/:id`        | `UpdateInstanceDto`           | Update an instance                   |
| DELETE | `/instances/:id`        | -                             | Delete an instance                   |
| POST   | `/instances/:id/test`   | -                             | Test HANA connectivity               |

**CreateInstanceDto:**
```json
{
  "name": "Production HANA",
  "host": "hana-server.example.com",
  "port": 30015,
  "username": "SYSTEM",
  "password": "secret",
  "useSsl": false
}
```

### Metric Definitions

| Method | Endpoint         | Body                | Description                |
|--------|------------------|---------------------|----------------------------|
| GET    | `/metrics`       | -                   | List all metric definitions |
| GET    | `/metrics/:id`   | -                   | Get a single metric        |
| POST   | `/metrics`       | `CreateMetricDto`   | Create a metric definition |
| PATCH  | `/metrics/:id`   | `UpdateMetricDto`   | Update a metric            |
| DELETE | `/metrics/:id`   | -                   | Delete a metric            |

**CreateMetricDto:**
```json
{
  "name": "Memory Usage",
  "query": "SELECT \"Memory Usage\" FROM (SELECT ROUND(INSTANCE_TOTAL_MEMORY_USED_SIZE/1024/1024/1024, 2) AS \"Memory Usage\" FROM M_HOST_RESOURCE_UTILIZATION)",
  "unit": "GB",
  "refreshInterval": 5,
  "color": "blue",
  "defaultW": 4,
  "defaultH": 3
}
```

| Field             | Type    | Required | Default | Description                              |
|-------------------|---------|----------|---------|------------------------------------------|
| `name`            | string  | yes      | -       | Display name for the metric              |
| `query`           | string  | yes      | -       | SQL query to execute on HANA             |
| `unit`            | string  | no       | `""`    | Unit label (e.g., GB, %, ms)            |
| `refreshInterval` | integer | no       | `5`     | Live polling interval in seconds (1–300) |
| `color`           | string  | no       | `blue`  | Card color theme                         |
| `defaultW`        | integer | no       | `4`     | Default card width in grid units (2–12)  |
| `defaultH`        | integer | no       | `3`     | Default card height in grid units (2–8)  |

### Schedules

| Method | Endpoint          | Body                  | Description                |
|--------|-------------------|-----------------------|----------------------------|
| GET    | `/schedules`      | -                     | List all schedules (with metric and instance) |
| GET    | `/schedules/:id`  | -                     | Get a single schedule      |
| POST   | `/schedules`      | `CreateScheduleDto`   | Create a schedule          |
| PATCH  | `/schedules/:id`  | `UpdateScheduleDto`   | Update interval or toggle  |
| DELETE | `/schedules/:id`  | -                     | Delete a schedule          |

**CreateScheduleDto:**
```json
{
  "metricId": "uuid",
  "instanceId": "uuid",
  "intervalSeconds": 60,
  "enabled": true
}
```

| Field             | Type    | Required | Default | Description                              |
|-------------------|---------|----------|---------|------------------------------------------|
| `metricId`        | string  | yes      | -       | ID of the metric definition              |
| `instanceId`      | string  | yes      | -       | ID of the HANA instance                  |
| `intervalSeconds` | integer | no       | `60`    | Collection interval in seconds (5–86400) |
| `enabled`         | boolean | no       | `true`  | Whether the schedule is active           |

### Live Metrics (SSE)

| Method | Endpoint                              | Description                              |
|--------|---------------------------------------|------------------------------------------|
| GET    | `/instances/:id/metrics/stream`       | SSE stream of live metric values         |

Accepts `?token=<jwt>` query parameter for authentication. Returns a stream of `MessageEvent` objects with JSON data:

```json
{
  "metricId": "uuid",
  "value": 42.5,
  "timestamp": "2026-03-16T12:00:00.000Z"
}
```

---

## Database Schema

### `hana_instances`

| Column       | Type        | Description                        |
|--------------|-------------|------------------------------------|
| `id`         | UUID        | Primary key (auto-generated)       |
| `name`       | VARCHAR     | Display name for the instance      |
| `host`       | VARCHAR     | HANA server hostname or IP         |
| `port`       | INTEGER     | HANA SQL port (default: 30015)     |
| `username`   | VARCHAR     | HANA database username             |
| `password`   | VARCHAR     | HANA database password             |
| `use_ssl`    | BOOLEAN     | Whether to use TLS (default: false)|
| `created_at` | TIMESTAMP   | Record creation timestamp          |
| `updated_at` | TIMESTAMP   | Last update timestamp              |

### `metrics`

| Column             | Type        | Description                              |
|--------------------|-------------|------------------------------------------|
| `id`               | UUID        | Primary key (auto-generated)             |
| `name`             | VARCHAR     | Metric display name                      |
| `query`            | TEXT        | SQL query to execute on HANA             |
| `unit`             | VARCHAR     | Unit label (default: "")                 |
| `refresh_interval` | INTEGER     | Live polling interval in seconds         |
| `color`            | VARCHAR     | Card color theme (default: "blue")       |
| `default_w`        | INTEGER     | Default card width (default: 4)          |
| `default_h`        | INTEGER     | Default card height (default: 3)         |
| `created_at`       | TIMESTAMP   | Record creation timestamp                |
| `updated_at`       | TIMESTAMP   | Last update timestamp                    |

### `schedules`

| Column             | Type        | Description                              |
|--------------------|-------------|------------------------------------------|
| `id`               | UUID        | Primary key (auto-generated)             |
| `metric_id`        | UUID (FK)   | References `metrics.id`                  |
| `instance_id`      | UUID (FK)   | References `hana_instances.id`           |
| `interval_seconds` | INTEGER     | Collection interval (default: 60)        |
| `enabled`          | BOOLEAN     | Whether active (default: true)           |
| `created_at`       | TIMESTAMP   | Record creation timestamp                |
| `updated_at`       | TIMESTAMP   | Last update timestamp                    |

### `metric_snapshots`

| Column        | Type        | Description                              |
|---------------|-------------|------------------------------------------|
| `id`          | UUID        | Primary key (auto-generated)             |
| `schedule_id` | UUID (FK)   | References `schedules.id`                |
| `metric_id`   | UUID (FK)   | References `metrics.id` (denormalized)   |
| `instance_id` | UUID (FK)   | References `hana_instances.id` (denormalized) |
| `value`       | JSON        | Query result stored as JSON              |
| `timestamp`   | TIMESTAMP   | When the snapshot was collected           |

Indexed on `(schedule_id, timestamp)`, `(metric_id, timestamp)`, and `(instance_id, timestamp)`.

---

## Frontend Pages

| Route                    | Page                  | Description                                       |
|--------------------------|-----------------------|---------------------------------------------------|
| `/`                      | Login                 | Username/password authentication form              |
| `/dashboard`             | Dashboard             | Live metric cards with drag-and-drop layout        |
| `/dashboard/instances`   | Manage Instances      | CRUD table for HANA instances with connection test |
| `/dashboard/metrics`     | Manage Metrics        | CRUD for user-defined SQL metric definitions       |
| `/dashboard/schedules`   | Schedules             | CRUD for scheduled historical data collection      |

---

## Scripts Reference

### Backend (`backend/`)

| Command                | Description                              |
|------------------------|------------------------------------------|
| `npm run start:dev`    | Start in watch mode (development)        |
| `npm run start`        | Start in production mode                 |
| `npm run build`        | Compile TypeScript to `dist/`            |
| `npm run lint`         | Lint and auto-fix source files           |
| `npm run test`         | Run unit tests                           |
| `npm run test:e2e`     | Run end-to-end tests                     |
| `npx prisma migrate dev` | Run pending database migrations       |
| `npx prisma studio`    | Open Prisma Studio (database GUI)        |

### Frontend (`frontend/`)

| Command           | Description                    |
|-------------------|--------------------------------|
| `npm run dev`     | Start development server       |
| `npm run build`   | Create optimized production build |
| `npm run start`   | Serve production build         |
| `npm run lint`    | Run ESLint                     |

---

## Roadmap

- [x] HANA instance management with connectivity testing
- [x] User-defined SQL metric definitions
- [x] Real-time dashboard with SSE streaming and drag-and-drop layout
- [x] Shared HANA poller (multiple tabs share one connection)
- [x] Scheduled historical data collection with JSON snapshots
- [ ] Historical data viewer with charts and time-range queries
- [ ] Data retention policy for metric_snapshots
- [ ] Multi-value metric queries (multiple columns per snapshot)
- [ ] Replace mock authentication with a proper user table in PostgreSQL
- [ ] Encrypt stored HANA passwords at rest (AES-256)
- [ ] HANA alert monitoring and notifications
- [ ] Role-based access control (RBAC)
- [ ] Docker Compose setup for one-command deployment

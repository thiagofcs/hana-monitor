# SAP HANA Monitor

A web application for monitoring SAP HANA database instances. Built with a **Next.js** frontend and **Nest.js** backend, using **PostgreSQL** to store configuration data and the **hdb** driver to connect to HANA instances.

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
- [API Reference](#api-reference)
  - [Authentication](#authentication)
  - [HANA Instances](#hana-instances)
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
│  (Port 3000)     │        │  (Port 3001)     │        │  (Port 5432) │
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

- **Frontend** — Handles the UI: login, sidebar navigation, dashboard, and instance management.
- **Backend** — Exposes a REST API with JWT-based authentication. Manages HANA instance CRUD operations and tests live connectivity to HANA databases.
- **PostgreSQL** — Stores application data (HANA instance connection configurations).
- **SAP HANA** — Target databases being monitored. The backend connects to them on-demand using the `hdb` Node.js driver.

---

## Tech Stack

| Layer     | Technology                        | Version |
|-----------|-----------------------------------|---------|
| Frontend  | Next.js (App Router)              | 16.x    |
| Frontend  | React                             | 19.x    |
| Frontend  | Tailwind CSS                      | 4.x     |
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
│   │   ├── auth/               # Authentication module
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── jwt.strategy.ts
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── login.dto.ts
│   │   ├── instances/          # HANA instances CRUD + connectivity test
│   │   │   ├── dto/
│   │   │   │   ├── create-instance.dto.ts
│   │   │   │   └── update-instance.dto.ts
│   │   │   ├── instances.controller.ts
│   │   │   ├── instances.module.ts
│   │   │   └── instances.service.ts
│   │   ├── prisma/             # Prisma database service
│   │   │   ├── prisma.module.ts
│   │   │   └── prisma.service.ts
│   │   ├── types/
│   │   │   └── hdb.d.ts        # Type declarations for hdb driver
│   │   ├── app.module.ts
│   │   ├── app.controller.ts
│   │   ├── app.service.ts
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
│   │   │   │   ├── layout.tsx      # Dashboard layout with sidebar
│   │   │   │   └── page.tsx        # Dashboard overview
│   │   │   ├── globals.css
│   │   │   ├── layout.tsx          # Root layout
│   │   │   └── page.tsx            # Login page
│   │   └── components/
│   │       └── sidebar.tsx         # Sidebar navigation
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
git clone <repository-url>
cd sap-hana-monitor
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

This creates the `hana_instances` table in your PostgreSQL database.

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

## API Reference

All endpoints (except login) require a JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

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

**Test connection response:**
```json
{
  "success": true,
  "message": "Connection successful"
}
```

---

## Database Schema

### `hana_instances` table

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

---

## Frontend Pages

| Route                    | Page                  | Description                                       |
|--------------------------|-----------------------|---------------------------------------------------|
| `/`                      | Login                 | Username/password authentication form              |
| `/dashboard`             | Dashboard             | Overview with placeholder monitoring cards         |
| `/dashboard/instances`   | Manage Instances      | CRUD table for HANA instances with connection test |

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

- [ ] Replace mock authentication with a proper user table in PostgreSQL
- [ ] Encrypt stored HANA passwords at rest (AES-256)
- [ ] Real-time dashboard with HANA system metrics (CPU, memory, disk)
- [ ] HANA alert monitoring and notifications
- [ ] SQL query explorer for connected instances
- [ ] Role-based access control (RBAC)
- [ ] Docker Compose setup for one-command deployment

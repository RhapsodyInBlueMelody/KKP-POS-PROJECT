# KOSAI POS — Android Point of Sale System

A full-stack Point of Sale (POS) system built for **KOSAI TB 1**, a cooperative unit in Tambun, Bekasi. The project was developed as part of a Kerja Praktek (KP) project at Universitas Pelita Bangsa.

The system is designed to replace manual transaction recording with a structured workflow for product management, cashier authentication, checkout, inventory updates, and transaction history.

## Tech Stack

### Mobile

- React Native
- Expo
- TypeScript
- React Navigation
- React Native Paper
- TanStack Query

### Backend

- Bun
- ElysiaJS
- TypeScript
- Prisma ORM 7
- PostgreSQL
- Docker / Docker Compose
- JWT authentication
- bcrypt password hashing

## Current Features

- JWT-based authentication
- Admin and Kasir roles
- Protected API endpoints using Bearer authentication
- Product listing and category filtering
- Admin-only product creation, editing, and deletion
- Product audit fields tied to the authenticated user
- Checkout with Cash, QRIS, and Transfer payment-method values
- Server-authoritative product pricing
- Historical transaction-item pricing
- Atomic inventory decrement inside a database transaction
- Transaction history for the authenticated cashier
- PostgreSQL-backed persistence

## Security and Reliability Work

The repository has undergone a security-focused cleanup before being prepared as a portfolio project.

Notable backend protections include:

- Client applications cannot choose the price used for a transaction. The backend reads the current product price from PostgreSQL and records that value as the transaction-item price snapshot.
- Checkout requests are validated at the API boundary.
- Duplicate products are rejected within a single checkout request.
- Stock decrements use a conditional database update so concurrent checkouts cannot decrement stock below the requested quantity.
- Product administration is restricted to the `ADMIN` role.
- Product audit fields use the authenticated user's ID rather than a client-supplied user ID.
- Authentication failures use a generic response so the API does not reveal whether a username exists.
- Secrets and local development credentials were removed from repository history and protected by repository ignore rules.

## Architecture

```text
React Native / Expo
        │
        │ HTTP + Bearer JWT
        ▼
┌──────────────────────┐
│      Elysia API      │
│       (Bun)          │
├──────────────────────┤
│ Authentication       │
│ Authorization / RBAC │
│ Request validation   │
│ Transaction logic    │
└──────────┬───────────┘
           │ Prisma
           ▼
┌──────────────────────┐
│     PostgreSQL       │
├──────────────────────┤
│ Users                │
│ Products             │
│ Categories           │
│ Transactions         │
│ Transaction Items    │
│ Suppliers            │
└──────────────────────┘
```

The repository also contains project diagrams under `Diagram Projeck POS/`.

## API Endpoints

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| `POST` | `/login` | Authenticate a user and issue a JWT | Public |
| `GET` | `/profile` | Get the authenticated user's profile | Authenticated |
| `GET` | `/products` | List products, optionally filtered by category code | Authenticated |
| `POST` | `/products` | Create a product | Admin |
| `PATCH` | `/product/:id` | Update a product | Admin |
| `DELETE` | `/product/:id` | Delete a product | Admin |
| `POST` | `/transaction` | Process a checkout | Authenticated |
| `GET` | `/transactions` | Retrieve the authenticated cashier's transaction history | Authenticated |

## Project Structure

```text
KKP-POS-PROJECT/
├── Android/                 # React Native / Expo application
├── Backend API/
│   ├── .env.example         # Safe environment-variable template
│   ├── docker-compose.yml   # PostgreSQL development service
│   └── backend/
│       ├── prisma/          # Prisma schema and seed data
│       └── src/             # Elysia API source
└── Diagram Projeck POS/     # System and database diagrams
```

## Local Development

### Prerequisites

- Bun
- Docker or Podman with Compose support
- PostgreSQL (provided through the Compose setup)
- Expo-compatible React Native development environment

### Backend

```bash
cd "Backend API"

# Create your local environment file from the safe template.
cp .env.example .env

# Start PostgreSQL.
docker compose up -d

# Install backend dependencies.
cd backend
bun install

# Generate the Prisma client and apply the project's database setup.
bunx prisma generate
bunx prisma migrate dev

# Start the API in development mode.
bun run dev
```

> **Note:** Prisma's precompiled engines currently have compatibility limitations on NixOS. If you use NixOS, Prisma CLI generation may require a supported engine/runtime setup. This is an environment limitation rather than an application feature requirement.

### Mobile

```bash
cd Android
bun install
bun start
```

Configure the API base URL for the mobile environment as required by your local network/device setup.

## Verification Status

The repository-side security and API hardening work has been completed. Local end-to-end verification still depends on the development environment, database availability, and Prisma engine compatibility.

Known follow-up work includes:

- migrating `TransactionItem.priceAtTime` from floating-point storage to the same decimal representation used for other monetary fields;
- completing automated backend tests for authentication, authorization, checkout, and concurrent stock updates;
- validating the complete Android-to-API transaction flow on a physical device or emulator.

These items are documented deliberately rather than presented as completed functionality.

## Project Context

**Institution:** Universitas Pelita Bangsa  
**Program:** Teknik Informatika  
**Project:** Kerja Praktek (KP)  
**Location:** Cikarang / Bekasi, West Java, Indonesia

## Author

**Syeddinul Faiz Caniggia**  
Teknik Informatika — Universitas Pelita Bangsa

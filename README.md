# 🛒 KOSAI POS — Point of Sale System for Android

A full-stack Android Point of Sale application built for **KOSAI TB 1** (Koperasi Otomotif Sejahtera Indonesia), a cooperative unit in Tambun, Bekasi. Developed as part of an internship (Kerja Praktek) project at Universitas Pelita Bangsa.

> Built to replace manual transaction recording with a structured, role-based digital system covering product management, consignment supplier tracking, transaction processing, and sales analytics.

---

## Tech Stack

**Mobile (Frontend)**
- React Native + Expo

**Backend**
- Bun runtime + ElysiaJS
- Prisma ORM + PostgreSQL
- Docker (containerized deployment)

**Auth & Security**
- JWT (JSON Web Token)
- bcrypt password hashing
- RBAC — Role-Based Access Control (Admin / Kasir)

---

## Features

### ✅ Implemented
| Feature | Description |
|---|---|
| Authentication | Login with JWT, role-based routing (Admin / Kasir) |
| Product Management | Add, edit, delete products with category assignment |
| Category Management | Organize products into categories |
| Supplier Management | Track consignment suppliers (mitra konsinyasi) |
| Transaction Processing | Checkout with Cash payment, atomic via Prisma `$transaction` |
| Transaction History | View transaction records per session |
| Digital Receipt | Receipt generated per transaction (digital) |
| Sales Statistics | Revenue overview, sales trends, best-selling products |
| Supplier Report | Consignment revenue sharing report per supplier |
| RBAC Enforcement | Kasir role restricted from Admin-only menus |

### 🚧 In Development
| Feature | Status |
|---|---|
| QRIS & Bank Transfer payment | Schema ready (ENUM), UI not yet implemented |
| Thermal printer integration | Digital receipt works; physical print pending |
| Kasir account management | Blocked by DB connectivity issue |
| PPOB / Digital products | Blocked by external provider integration |

---

## Architecture

The system uses a **multi-tenant data model** with `Store` as the root entity, isolating all operational data (products, categories, transactions, suppliers) per store instance. New store registration is handled manually by the platform owner — there is no self-registration flow by design.

```
Store
├── Users (Admin / Kasir)
├── Products → Categories
├── Suppliers (Consignment)
└── Transactions → Transaction Items
                └── Receipts
```

---

## API Overview

Built with **ElysiaJS on Bun**, the REST API covers:

- `POST /auth/login` — authenticate and receive JWT
- `GET/POST/PUT/DELETE /products` — product CRUD
- `GET/POST/PUT/DELETE /categories` — category CRUD
- `GET/POST/PUT/DELETE /suppliers` — supplier CRUD
- `POST /transactions` — process checkout (atomic)
- `GET /transactions` — transaction history
- `GET /statistics` — sales analytics
- `GET /supplier-reports` — consignment revenue reports

All protected endpoints require `Authorization: Bearer <token>` and enforce RBAC at the middleware level.

---

## Running Locally

### Prerequisites
- [Bun](https://bun.sh/) >= 1.0
- Docker & Docker Compose
- Node.js (for Expo)

### Backend

```bash
# Clone and install
git clone https://github.com/RhapsodyInBlueMelody/KKP-POS-PROJECT.git
cd KKP-POS-PROJECT/backend

# Copy environment variables
cp .env.example .env

# Start database
docker-compose up -d

# Run migrations
bunx prisma migrate dev

# Start server
bun run dev
```

### Mobile

```bash
cd ../Android

npm install

npx expo start
```

---

## Project Context

This project was developed as a **Kerja Praktek (KP)** assignment at:

- **University:** Universitas Pelita Bangsa (UPB), Cikarang
- **Program:** Teknik Informatika, Semester 7
- **Internship Site:** KOSAI TB 1, Tambun, Bekasi
- **Supervisor:** Pak Sanudin

The system was designed around the real operational constraints of the cooperative: a single admin managing both inventory and consignment suppliers, with kasir (cashier) staff handling day-to-day transactions.

---

## Author

**Syeddinul Faiz Caniggia**
Teknik Informatika — Universitas Pelita Bangsa
[GitHub](https://github.com/RhapsodyInBlueMelody) · [Portfolio](https://faizcan.vercel.app)

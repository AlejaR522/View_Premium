# View Premium

View Premium is a full-stack executive contact directory with authentication, profile management, premium memberships, PDF handling, and an admin dashboard for inventory and sales tracking. The project combines a React/Vite client with an Express API and a PostgreSQL database, making it a practical portfolio piece for user management, paid-feature workflows, and operational admin tooling.

## Preview

![Executive directory](docs/screenshots/executive-directory.png)

![Premium profile modal](docs/screenshots/premium-profile-modal.png)

![Admin inventory and cashier dashboard](docs/screenshots/admin-inventory-cashier.png)

## Highlights

- Secure account flow with registration, login, email verification, password recovery, JWT sessions, and protected admin routes.
- Executive directory where authenticated users can search profiles, open public profile details, and manage their own personal area.
- Premium membership purchase flow with form validation, RUT PDF upload, profile color customization, invoice generation, and a 10-day membership window.
- Premium self-service tools that let users view membership data, update premium contact details, download their RUT, and open invoices.
- Admin dashboard for managing users, reviewing premium clients, downloading user documents, updating membership stock, and exporting sales history to PDF.
- PostgreSQL-backed persistence for users, premium clients, products, and sales records.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite, React Router, Tailwind CSS |
| Backend | Node.js, Express 5, JWT, bcryptjs, Nodemailer |
| Database | PostgreSQL, designed for hosted providers such as Neon |
| Documents | PDFKit for backend invoices, jsPDF for admin sales exports |
| Tooling | ESLint, npm scripts |

## Project Structure

```text
.
├── Backend/
│   ├── Config/Postgres.js        # PostgreSQL connection pool
│   ├── middleware/               # JWT authentication middleware
│   ├── routes/                   # Auth and premium API routes
│   ├── scripts/createAdmin.js    # Admin user helper script
│   └── Server.js                 # Express app entry point
├── Frontend/
│   ├── src/components/           # Reusable UI and route protection
│   ├── src/lib/                  # API and auth helpers
│   ├── src/pages/                # App pages and workflows
│   └── src/assets/               # Static frontend assets
├── docs/screenshots/             # README screenshots
└── README.md
```

## Main Features

### Authentication and Profiles

Users can create an account, verify their email, log in, recover a password, and edit profile information such as name, email, description, avatar, and premium profile color. Session data is stored on the frontend and authenticated requests use a JWT bearer token.

### Executive Directory

The `/home` page presents a searchable directory of users. Cards highlight contact data, premium status, avatars, and quick navigation to public profile pages. Users can also enter their personal profile area at `/me`.

### Premium Memberships

Premium activation is handled through the backend transactionally:

- validates identification, phone, address, and RUT PDF data;
- checks available membership stock;
- creates a premium client record;
- creates a sales record and invoice number;
- decreases product stock;
- stores a generated PDF invoice;
- marks the user as premium for 10 days.

Active premium users can reopen the premium modal to view details, edit client information, download RUT data, and access their invoice.

### Admin Panel

The admin panel at `/Admin` includes:

- user management;
- premium client review;
- RUT and invoice downloads;
- sales totals and accumulated cash;
- premium membership inventory updates;
- sales history filtering and PDF export.

## Database Overview

The API uses PostgreSQL through the `pg` package. The project creates or updates several fields and tables from the route layer to keep local setup simple.

### `users`

Core authentication and profile table. Important fields used by the application include:

- `id`
- `nombre`
- `email`
- `password`
- `rol`
- `es_premium`
- `avatar_url`
- `descripcion`
- `perfil_bg_color`
- `premium_until`
- `email_verificado`
- `verification_token`
- `reset_token`
- `reset_token_expires`
- `create_at`

### `clientes`

Stores premium client data connected to a user.

- `id`
- `user_id`
- `cedula`
- `telefono`
- `direccion`
- `rut_pdf_url`
- `rut_pdf_data`
- `fact_pdf`
- `create_at`

### `productos`

Stores sellable products, currently focused on `Membresia Premium`.

- `id`
- `nombre`
- `precio`
- `stock`
- `create_at`

### `ventas`

Stores premium purchases and invoice references.

- `id`
- `cliente_id`
- `producto_id`
- `precio_pagado`
- `numero_factura`
- `fecha`

## API Overview

The frontend defaults to `http://localhost:5000/api`.

### Auth Routes

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Register a new user |
| `GET` | `/api/auth/verify-email/:token` | Verify email address |
| `POST` | `/api/auth/login` | Authenticate and return JWT session data |
| `POST` | `/api/auth/forgot-password` | Request password reset |
| `POST` | `/api/auth/reset-password/:token` | Reset password |
| `GET` | `/api/auth/usuarios` | List users |
| `GET` | `/api/auth/usuarios/:id` | Get one user |
| `PUT` | `/api/auth/usuarios/:id` | Update a user |
| `DELETE` | `/api/auth/usuarios/:id` | Delete a user |

### Premium Routes

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/premium/activar` | Activate premium membership |
| `GET` | `/api/premium/mis-datos` | Get current user's premium data |
| `PUT` | `/api/premium/mi-cliente` | Update current user's premium client data |
| `GET` | `/api/premium/clientes` | Admin: list premium clients |
| `GET` | `/api/premium/caja` | Admin: get sales, products, and totals |
| `PUT` | `/api/premium/productos/:id` | Admin: update product stock, name, or price |

Invoices are served statically from:

```text
http://localhost:5000/facturas/<filename>
```

## Environment Variables

Create a `.env` file inside `Backend/`:

```env
PORT=5000
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
JWT_SECRET=replace-with-a-secure-secret
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-email-app-password
FRONTEND_URL=http://localhost:5173
```

Create a `.env` file inside `Frontend/` if you need to override the default API URL:

```env
VITE_API_URL=http://localhost:5000/api
```

## Getting Started

### Prerequisites

- Node.js 20 or newer
- npm
- PostgreSQL database URL, for example from Neon

### Backend

```bash
cd Backend
npm install
node Server.js
```

The API should run on `http://localhost:5000`.

To create an admin user, configure the database first and then run:

```bash
npm run create-admin
```

### Frontend

Open a second terminal:

```bash
cd Frontend
npm install
npm run dev
```

The Vite app should run on `http://localhost:5173`.

### Build

```bash
cd Frontend
npm run build
```

### Lint

```bash
cd Frontend
npm run lint
```

## Suggested Demo Flow

1. Register and verify a user account.
2. Log in and open `/home` to explore the executive directory.
3. Open `/me` to update profile details.
4. Activate premium with identification, phone, address, color, and a PDF RUT file.
5. Reopen the premium modal to edit premium data and download documents.
6. Log in as an admin and open `/Admin` to review premium clients, update stock, and export sales history.

## Implementation Notes

- Premium status is treated as active only when `es_premium` is true and `premium_until` is empty or still in the future.
- Premium purchase creation uses a database transaction to keep clients, sales, stock, invoices, and user premium state consistent.
- RUT files are stored as base64 data in PostgreSQL, while generated invoice PDFs are saved under the backend uploads folder and exposed through Express static hosting.
- The premium membership product is seeded automatically as `Membresia Premium` with a price of `29000`.

## Recruiter Notes

This project demonstrates full-stack product thinking beyond basic CRUD: authentication, protected roles, paid membership state, file handling, transactional backend logic, PDF generation, admin reporting, and a polished React interface. It is designed as a compact but realistic business workflow where users, premium customers, inventory, and revenue data all interact.

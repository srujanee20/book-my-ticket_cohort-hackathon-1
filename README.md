# Book My Ticket

A RESTful seat booking API built with **Express.js** and **PostgreSQL**, featuring JWT-based stateless authentication with access and refresh token management.

## Features

- **Layered Architecture** — routes, services, and middleware are cleanly separated
- **JWT Authentication** — short-lived access tokens (15m) and long-lived refresh tokens (7d)
- **Dedicated Auth Token Storage** — refresh tokens are stored in a separate `auth_tokens` table, keeping user data and session management decoupled
- **Multi-Session Support** — users can be logged in from multiple devices simultaneously
- **Transactional Seat Booking** — uses PostgreSQL `FOR UPDATE` row-level locking to prevent race conditions and double bookings
- **Input Validation** — Joi schema validation on all endpoints before reaching business logic
- **Password Hashing** — bcrypt with 10 salt rounds

## Project Structure

```
├── index.mjs                          # Express routes
├── package.json
└── src/
    ├── configs/
    │   └── database.mjs               # PostgreSQL pool configuration
    ├── middlewares/
    │   ├── auth.middleware.mjs         # JWT Bearer token verification
    │   └── validate.middleware.mjs     # Joi schema validation
    ├── validators/
    │   ├── auth.validator.mjs          # Schemas for auth endpoints
    │   └── seat.validator.mjs          # Schema for seat booking
    └── services/
        ├── user.service.mjs            # User CRUD operations
        ├── auth.service.mjs            # Authentication logic
        └── seat.service.mjs            # Seat queries and booking
```

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Express.js | HTTP server and routing |
| PostgreSQL | Relational database |
| pg | PostgreSQL client for Node.js |
| jsonwebtoken | JWT generation and verification |
| bcrypt | Password hashing |
| joi | Request validation |
| cors | Cross-origin resource sharing |

## Prerequisites

- Node.js v14+
- PostgreSQL

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/srujanee20/book-my-ticket_cohort-hackathon-1.git
cd book-my-ticket_cohort-hackathon-1
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
NODE_ENV=example
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=your_password
DB_NAME=sql_class_2_db
DB_POOL_MAX_SIZE=10
DB_IDLE_TIMEOUT_MILLIS=30000
DB_CONNECTION_TIMEOUT_MILLIS=2000
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

### 4. Initialize the database

Connect to PostgreSQL and run the following SQL:

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user'
);

CREATE TABLE auth_tokens (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    UNIQUE(user_id, refresh_token_hash)
);

CREATE TABLE seats (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    isbooked INT DEFAULT 0,
    user_id INT REFERENCES users(id)
);

INSERT INTO seats (isbooked)
SELECT 0 FROM generate_series(1, 20);
```

### 5. Start the server

```bash
npm run dev
```

The server runs on `http://localhost:8080`.

---

## API Reference

### Authentication

#### Register

```
POST /register
```

| Body Field | Type | Required | Validation |
|------------|------|----------|------------|
| name | string | Yes | 2–255 characters |
| email | string | Yes | Valid email, must be unique |
| password | string | Yes | 6–128 characters |
| role | string | No | `user` or `admin`, defaults to `user` |

#### Login

```
POST /login
```

| Body Field | Type | Required |
|------------|------|----------|
| email | string | Yes |
| password | string | Yes |

Returns `token`, `refreshToken`, and `user` object.

#### Refresh Token

```
POST /refresh
```

| Body Field | Type | Required |
|------------|------|----------|
| refreshToken | string | Yes |

Returns a new `token`.

#### Logout

```
POST /logout
```

Requires `Authorization: Bearer <access_token>` header.

| Body Field | Type | Required | Description |
|------------|------|----------|-------------|
| refreshToken | string | No | If omitted, all sessions are cleared |

### Seats

#### Get All Seats

```
GET /seats
```

No authentication required.

#### Book a Seat

```
PUT /:id/:name
```

Requires `Authorization: Bearer <access_token>` header.

| Param | Type | Validation |
|-------|------|------------|
| id | number | Positive integer |
| name | string | 1–255 characters |

---

## Testing with curl

**Register:**
```bash
curl -X POST http://localhost:8080/register \
  -H "Content-Type: application/json" \
  -d '{"name": "John", "email": "john@example.com", "password": "pass123456"}'
```

**Login:**
```bash
curl -X POST http://localhost:8080/login \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com", "password": "pass123456"}'
```

**Get all seats:**
```bash
curl http://localhost:8080/seats
```

**Book a seat** (replace `<TOKEN>` with the access token from login):
```bash
curl -X PUT http://localhost:8080/1/John \
  -H "Authorization: Bearer <TOKEN>"
```

**Refresh access token** (replace `<REFRESH_TOKEN>` with the refresh token from login):
```bash
curl -X POST http://localhost:8080/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "<REFRESH_TOKEN>"}'
```

**Logout:**
```bash
curl -X POST http://localhost:8080/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"refreshToken": "<REFRESH_TOKEN>"}'
```

---

## Database Schema

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│    users     │       │   auth_tokens    │       │    seats     │
├──────────────┤       ├──────────────────┤       ├──────────────┤
│ id (PK)      │◄──────│ user_id (FK)     │       │ id (PK)      │
│ name         │       │ id (PK)          │       │ name         │
│ email        │       │ refresh_token_   │       │ isbooked     │
│ password     │       │   hash           │       │ user_id (FK) │──►users(id)
│ role         │       │ created_at       │       └──────────────┘
└──────────────┘       │ expires_at       │
                       └──────────────────┘
```

## License

[MIT](LICENSE)

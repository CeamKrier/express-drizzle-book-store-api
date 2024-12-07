# Express + Drizzle API Example

A RESTful API for a library management system using Express.js, Drizzle ORM, and PostgreSQL.

## Prerequisites
- Node.js v20+
- Docker & Docker Compose
- pnpm

## Quick Start

1. Install dependencies:
```bash
pnpm install
```

2. Spin up database only:
```bash
docker compose -f docker-compose-db-only.yml up -d
```

3. Run migrations:
```bash
pnpm db:migrate
```

4. Create a `.env` file:

```
PG_DB_URL=postgres://admin:password@localhost:5432/localdb
```

5. Start development server:
```bash
pnpm dev
```

Alternatively, run the entire stack in Docker:
```bash
docker compose up -d
```

## Available Endpoints
- `GET /users` - List all users
- `GET /users/:id` - Get user details with borrow history
- `POST /users` - Create new user
- `GET /books` - List all books
- `GET /books/:id` - Get book details with ratings
- `POST /books` - Create new book
- `POST /users/:userId/borrow/:bookId` - Borrow a book
- `POST /users/:userId/return/:bookId` - Return a book with rating

## License
MIT
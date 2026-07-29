# Agentic AI

A Node.js/Express backend application providing AI agent capabilities with real-time chat, workspace management, and document handling.

## Project Overview

Agentic AI is a backend service that powers AI agent interactions with the following features:

- **Authentication** — JWT-based auth system
- **Real-time Chat** — Socket.IO-powered chat API
- **Workspace Management** — Multi-workspace support
- **Document Handling** — Upload, storage, and retrieval via MinIO (S3-compatible)
- **Job Queue** — RabbitMQ-based async job processing
- **SQLite Database** — Lightweight persistent storage

## Tech Stack

- **Runtime:** Node.js (CommonJS)
- **Framework:** Express.js
- **Database:** SQLite (better-sqlite3)
- **Queue:** RabbitMQ
- **Storage:** MinIO (S3-compatible)
- **Real-time:** Socket.IO
- **Auth:** JWT

## Setup

### Prerequisites

- Node.js (v18+)
- RabbitMQ server
- MinIO server

### Installation

```bash
npm install
```

### Configuration

Copy `.env.example` to `.env` and configure:

```env
JWT_SIGNATURE_KEY=your-secret-key
PORT=3001
RABBITMQ_URL=amqp://localhost:5672
QUEUE_NAME=agentic-ai
S3_ENDPOINT=127.0.0.1
S3_PORT=9100
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_BUCKET=agentic-ai
```

### Running

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

The server starts on `http://localhost:3001`.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| POST | `/api/auth/*` | Authentication routes |
| POST | `/v1/chat/*` | Chat routes |
| GET/POST | `/api/workspaces/*` | Workspace management |
| GET/POST | `/api/documents/*` | Document handling |

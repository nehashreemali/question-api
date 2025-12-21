# Quiz Question Generator

Generate quiz questions from TV shows, movies, history, science, and more.

## Quick Start

```bash
# Install dependencies
bun install

# Start web server
bun start

# Open http://localhost:3000
```

## Architecture

**SQLite-only design** - no JSON files for data storage.

```
data/
├── registry.db       # Central topic registry (5,214 topics)
├── tv-shows.db       # TV show questions
└── [category].db     # Per-category question databases

src/
├── server.ts         # Web server
└── lib/
    ├── registry.ts   # Registry database
    ├── database.ts   # Question databases
    ├── tv-scraper.ts # Transcript scraper
    └── adapters/     # Content adapters
```

## Features

- **5,214 topics** across 44 categories
- **Web UI** for browsing and managing questions
- **REST API** for programmatic access
- **Functional architecture** - no classes, pure functions

## Commands

| Command | Description |
|---------|-------------|
| `bun start` | Start web server on port 3000 |
| `bun run kill` | Kill process on port 3000 |

## API Endpoints

- `GET /api/categories` - List categories
- `GET /api/topics/:category` - List topics
- `GET /api/questions/:category/:topic` - Get questions
- `POST /api/stats/regenerate` - Refresh statistics

## Documentation

- [CLAUDE.md](./CLAUDE.md) - Project conventions and architecture
- [HOWTO.md](./HOWTO.md) - Usage guide

## Tech Stack

- **Runtime:** Bun
- **Database:** SQLite
- **Scraping:** Cheerio + Axios

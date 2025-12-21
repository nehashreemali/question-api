# How to Use the Quiz Generator

A quick guide to the current SQLite-based architecture.

---

## Prerequisites

```bash
# Install dependencies
bun install
```

---

## Start the Web Server

```bash
# Start server on port 3000
bun start

# Kill anything on port 3000 (if needed)
bun run kill
```

---

## Web UI

Open `http://localhost:3000` in your browser to:
- Browse categories and topics
- View generated questions
- Regenerate statistics

---

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/categories` | List all categories with topic counts |
| `GET /api/categories/:slug` | Get single category details |
| `GET /api/topics/:category` | List topics in a category |
| `GET /api/questions/:category/:topic` | Get questions for a topic |
| `POST /api/stats/regenerate` | Regenerate all statistics |

---

## Database Structure

```
data/
├── registry.db       # 5,214 topics across 44 categories
├── tv-shows.db       # Questions for TV shows
└── [category].db     # Per-category question databases
```

---

## Exploring the Registry

```bash
# View all categories
sqlite3 data/registry.db "SELECT slug, name, topic_count FROM categories ORDER BY topic_count DESC"

# View topics in a category
sqlite3 data/registry.db "SELECT slug, name FROM topics WHERE category = 'tv-shows' LIMIT 20"

# Count total topics
sqlite3 data/registry.db "SELECT COUNT(*) FROM topics"
```

---

## Question Database

```bash
# View questions for a topic
sqlite3 data/tv-shows.db "SELECT question, difficulty FROM questions WHERE topic = 'friends' LIMIT 5"

# Count questions per topic
sqlite3 data/tv-shows.db "SELECT topic, COUNT(*) as count FROM questions GROUP BY topic ORDER BY count DESC"
```

---

## Source Files

| File | Purpose |
|------|---------|
| `src/server.ts` | Web server with API |
| `src/lib/registry.ts` | Registry database operations |
| `src/lib/database.ts` | Question database operations |
| `src/lib/tv-scraper.ts` | TV transcript scraper |
| `src/lib/adapters/` | Content adapters |

---

## Adding New Topics

Topics are added programmatically using the registry functions:

```typescript
import { ensureTopic } from './lib/registry';

ensureTopic({
  category: 'tv-shows',
  subcategory: 'sitcoms',
  slug: 'friends',
  name: 'Friends',
  depth: 'immense'
});
```

---

## Notes

- **No external API keys needed** for browsing/viewing
- **Transcripts** are stored in `generation/transcripts/`
- **Old scripts** are archived in `/garbage/`

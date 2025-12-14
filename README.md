# Simple Quiz Generator

Generate quiz questions from multiple sources using AI. Supports TV shows, movies, cricket, current affairs, science, and custom content.

---

## What is Bun?

**Bun** is a modern JavaScript runtime (like Node.js but much faster):
- Starts up instantly
- All-in-one: runtime + package manager + bundler + test runner
- Compatible with npm packages
- Built for speed

Install Bun: https://bun.sh

---

## Quick Start

```bash
# 1. Install dependencies
bun install

# 2. Add your Groq API key to config.json
# Edit config.json and add: "groq": "your_key_here"

# 3. Run the scraper (coming soon)
bun run scrape --genre tv-shows --show "Friends"
```

---

## Project Overview

This project scrapes content from various sources and uses AI to generate high-quality MCQ questions.

### Supported Genres

1. **TV Shows** - Friends, Big Bang Theory, etc.
2. **Movies** - Any movie with available transcripts
3. **Cricket** - Stats, records, match history
4. **Current Affairs** - Latest news and events
5. **Science** - Physics, Chemistry, Biology, Space, etc.
6. **Custom** - Your own PDFs, documents, URLs

### Question Format

- Multiple Choice (4 options)
- Difficulty levels: Easy, Medium, Hard
- JSON format with metadata

Example:
```json
{
  "question": "What is Ross's profession?",
  "options": ["Chef", "Paleontologist", "Actor", "Lawyer"],
  "correct_answer": "Paleontologist",
  "difficulty": "easy"
}
```

---

## Configuration Files

### manifest.json
Database of all questions, sources, and metadata

### config.json
Your settings and API keys

### SOURCES.md
Research documentation - best sources for each genre

---

## How It Works

### For TV Shows/Movies:
1. Scrape transcripts from Subslikescript, Forever Dreaming, etc.
2. Cache transcript (30 days)
3. Send to Groq AI
4. Generate 20 MCQs per episode (easy/medium/hard mix)
5. Save to data/tv-shows/[genre]/[show]/

### For Cricket:
1. Fetch from CricAPI or scrape ESPNcricinfo
2. Extract stats, records, match info
3. Send to Groq AI
4. Generate trivia questions
5. Save to data/cricket/

### For Current Affairs:
1. Fetch news from NewsAPI or RSS feeds
2. Filter by category
3. Send to Groq AI
4. Generate current affairs questions
5. Save to data/current-affairs/

### For Science:
1. Fetch from NASA APIs, Wikipedia
2. Extract educational content
3. Send to Groq AI
4. Generate science questions
5. Save to data/science/

### For Custom Content:
1. Upload your PDF/text/URL
2. Extract content
3. Send to Groq AI
4. Generate questions
5. Save to data/custom/

---

## Project Structure

```
simple-quiz-generator/
├── config.json              # Settings & API keys
├── manifest.json            # Question database
├── SOURCES.md              # Research docs
│
├── src/                    # Source code (to be built)
│   ├── scrapers/
│   │   ├── tv-shows.js
│   │   ├── cricket.js
│   │   ├── news.js
│   │   ├── science.js
│   │   └── custom.js
│   ├── ai/groq.js         # AI integration
│   └── utils/             # Cache, rate limiter, logger
│
├── data/                   # Generated questions
│   ├── tv-shows/
│   ├── cricket/
│   ├── current-affairs/
│   ├── science/
│   └── custom/
│
├── cache/                  # Cached transcripts
└── logs/                   # Scraper logs
```

---

## Best Sources (Research Summary)

**TV Shows/Movies:**
- Subslikescript.com (best)
- Forever Dreaming
- IMSDb (movies)

**Cricket:**
- CricAPI (free, generous limits)
- ESPNcricinfo (web scraping)

**Current Affairs:**
- NewsAPI (80K sources)
- Google News RSS
- BBC RSS

**Science:**
- NASA APIs (space)
- Wikipedia API (all topics)

See [SOURCES.md](./SOURCES.md) for full details.

---

## Features

✅ Multiple content sources
✅ AI-powered question generation
✅ Smart caching (avoid re-scraping)
✅ Rate limiting (respectful scraping)
✅ 3 difficulty levels
✅ Organized file structure
✅ Manual trigger control

---

## Development Status

### Completed:
- [x] Project structure
- [x] Configuration system
- [x] Source research
- [x] Documentation

### In Progress:
- [ ] Base scraper architecture
- [ ] Groq AI integration

### To Do:
- [ ] TV shows scraper
- [ ] Cricket scraper
- [ ] News scraper
- [ ] Science scraper
- [ ] Custom resource processor
- [ ] CLI interface

---

## API Keys Needed

**Groq** (Required): https://console.groq.com - Free tier available
**NewsAPI** (Optional): https://newsapi.org - Free: 100 requests/day

Add to `config.json`:
```json
{
  "api_keys": {
    "groq": "your_key_here",
    "newsapi": "your_key_here"
  }
}
```

---

## Contributing

Found a bug? Have a suggestion? Open an issue!

Want to add a new genre? Submit a pull request!

---

**License**: MIT
**Happy Quiz Generating!**

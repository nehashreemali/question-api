# TV Show Quiz Generator

Generate quiz questions from TV show episodes using AI.

## 🚀 Quick Start

```bash
# 1. Install
bun install

# 2. Add Groq API key to config.json

# 3. Scrape transcript
bun src/scrape-tv.ts "Friends" 1 3

# 4. Generate questions
bun src/generate-questions.ts "Friends" 1 3
```

## 📂 Output Structure

```
data/tv-shows/{show}/season-{N}/episode-{N}/
├── transcript.json      # Full transcript
├── questions.json       # Questions with answers
└── rawQuestions.json    # Just question text
```

## 🛠️ Architecture

**Functional code - no classes!**

```
src/lib/
├── logger.ts
├── http.ts
├── tv-scraper.ts
└── question-generator.ts
```

Simple, clean, easy to understand! 🎉

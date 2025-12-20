# TV Show Quiz Generator

Generate quiz questions from TV show episodes using AI.

## 🚀 Quick Start

```bash
# 1. Install dependencies
bun install

# 2. Setup configuration
cp config.example.json config.json
# Edit config.json and add your Groq API key

# 3. Generate questions for a single episode
bun index.ts "Friends" 1 1

# 4. Generate questions for entire season
bun index.ts "Friends" 1
```

## ⚙️ Configuration

1. Copy `config.example.json` to `config.json`
2. Add your [Groq API key](https://console.groq.com/)
3. Adjust settings:
   - `questions_per_transcript`: 20 (recommended for rate limits)
   - `model`: "llama-3.3-70b-versatile"
   - `temperature`: 0.7

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

# Simple Quiz Generator

Generate quiz questions from Wikipedia using AI. No database - just JSON files.

## Quick Start

```bash
# 1. Install dependencies
bun install

# 2. Add your Groq API key to .env
# GROQ_API_KEY=your_key_here

# 3. Scrape Wikipedia
bun scrape.ts "Stranger Things"

# 4. Generate questions
bun generate.ts stranger_things.json 10
```

Done! Questions saved to `questions/` folder.

## Examples

```bash
bun scrape.ts "Jawan (2023 film)"
bun generate.ts jawan_2023_film_.json 5

bun scrape.ts "IPL 2024"
bun generate.ts ipl_2024.json 15
```

## What It Does

1. **Scrape** → Get Wikipedia content → Save JSON
2. **Generate** → Send to AI → Get questions → Save JSON

That's it. No complexity.

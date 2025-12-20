# How to Generate Questions

A quick guide to generating quiz questions using the adapters.

---

## Prerequisites

### 1. Install Dependencies
```bash
bun install
```

### 2. Set Up API Keys
Create a `.env` file or export environment variables:

```bash
# Option 1: Claude API (recommended - better quality)
export ANTHROPIC_API_KEY=your_key_here

# Option 2: Groq API (faster, free tier available)
export GROQ_API_KEY=your_key_here
```

You only need one of these. Claude is preferred if both are set.

---

## Basic Usage

```bash
bun src/generate.ts <category> <topic> [subcategory] [--count=N] [--force]
```

| Argument | Required | Description |
|----------|----------|-------------|
| `category` | Yes | Main category (tv-shows, movies, history, etc.) |
| `topic` | Yes | Topic slug from registry |
| `subcategory` | No | Auto-detected from registry if not provided |
| `--count=N` | No | Number of questions (default: 25) |
| `--force` | No | Regenerate even if questions exist |

---

## Examples by Category

### TV Shows
```bash
# Generate 25 questions for Friends
bun src/generate.ts tv-shows friends

# Generate 50 questions for Breaking Bad
bun src/generate.ts tv-shows breaking-bad --count=50

# Regenerate Game of Thrones questions
bun src/generate.ts tv-shows game-of-thrones --force
```

### Movies
```bash
# Marvel Cinematic Universe
bun src/generate.ts movies marvel-mcu franchises

# Individual film (The Godfather)
bun src/generate.ts movies the-godfather-trilogy franchises

# Christopher Nolan's filmography
bun src/generate.ts movies christopher-nolan directors
```

### History
```bash
# Ancient Egypt
bun src/generate.ts history ancient-egypt ancient-civilizations

# World War II - European Theater
bun src/generate.ts history ww2-european-theater world-wars

# Indian Freedom Movement
bun src/generate.ts history indian-independence-movement indian-history
```

### Science (NCERT)
```bash
# Class 10 - Electricity
bun src/generate.ts science electricity ncert-class-10

# Class 12 - Electrochemistry
bun src/generate.ts science electrochemistry ncert-class-12

# General Physics
bun src/generate.ts science classical-mechanics physics
```

### Sports
```bash
# Cricket World Cups
bun src/generate.ts sports cricket-world-cups cricket

# Formula 1
bun src/generate.ts sports formula-1 motorsport

# FIFA World Cup
bun src/generate.ts sports fifa-world-cup football
```

### General Knowledge
```bash
# Mahabharata
bun src/generate.ts general-knowledge mahabharata indian-epics

# Indian Constitution
bun src/generate.ts general-knowledge indian-constitution india
```

---

## Output

Questions are saved to:
```
data/<category>/<topic>/questions.json
```

Example output structure:
```json
{
  "category": "tv-shows",
  "subcategory": "sitcoms",
  "topic": "friends",
  "title": "Friends",
  "source": "Subslikescript",
  "generatedAt": "2024-12-20T...",
  "questionCount": 25,
  "questions": [
    {
      "question": "What is the name of the coffee shop where the friends hang out?",
      "options": ["Central Perk", "Java Joe's", "The Coffee House", "Mocha Lounge"],
      "correct_answer": "Central Perk",
      "difficulty": "easy",
      "explanation": "Central Perk is the iconic coffee shop..."
    }
  ]
}
```

---

## Finding Topics

### List All Categories
```bash
cat data-generation/registry.json | jq 'keys'
```

### List Topics in a Category
```bash
# List all TV show topics
cat data-generation/registry.json | jq '.categories["tv-shows"].subcategories[].topics | keys[]'

# List topics in a specific subcategory
cat data-generation/registry.json | jq '.categories["history"].subcategories["world-wars"].topics | keys[]'
```

### Search for a Topic
```bash
# Find topics containing "batman"
grep -i "batman" data-generation/registry.json
```

---

## Tips

### Start with High-Depth Topics
Topics with `immense` or `massive` depth have more content for better questions:
```bash
# Check a topic's depth
cat data-generation/registry.json | jq '.categories["tv-shows"].subcategories["sitcoms"].topics["friends"]'
```

### Batch Generation
Generate multiple topics:
```bash
# Generate for multiple shows
for show in friends seinfeld the-office parks-and-recreation; do
  bun src/generate.ts tv-shows $show --count=50
done
```

### Check Existing Questions
```bash
# See what's already generated
ls -la data/tv-shows/*/questions.json

# Count total generated questions
find data -name "questions.json" | wc -l
```

---

## Troubleshooting

### "Topic not found in registry"
- Check spelling of topic slug
- Topic may exist under a different subcategory
- Use `grep` to search registry

### "No API key set"
- Ensure `ANTHROPIC_API_KEY` or `GROQ_API_KEY` is exported
- Check `.env` file exists and is loaded

### "Questions already exist"
- Use `--force` flag to regenerate
- Or delete existing `questions.json` file

### Rate Limiting
- Claude API: ~50 requests/minute
- Groq API: Check your tier limits
- Add delays between batch requests if needed

---

## Quick Reference

| Category | Example Topic | Adapter |
|----------|--------------|---------|
| tv-shows | friends, breaking-bad | tv-adapter |
| movies | marvel-mcu, inception | movies-adapter |
| history | roman-empire, ww2-pacific | wikipedia-adapter |
| science | electricity, photosynthesis | ncert-adapter |
| sports | ipl, fifa-world-cup | sports-adapter |
| geography | indian-states, world-capitals | wikipedia-adapter |
| entertainment | rock-music-history, video-games | wikipedia-adapter |
| technology | artificial-intelligence, apple | wikipedia-adapter |
| general-knowledge | mahabharata, indian-constitution | wikipedia-adapter |
| mathematics | calculus, statistics | ncert-adapter |

#!/usr/bin/env bun

/**
 * TV Show Question Generator
 *
 * Generates quiz questions from TV show transcripts using Claude API.
 *
 * Usage:
 *   bun scripts/generate-tv-questions.ts <show-slug> <season>
 *
 * Examples:
 *   bun scripts/generate-tv-questions.ts friends 5
 *   bun scripts/generate-tv-questions.ts game-of-thrones 2
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import axios from 'axios';
import { insertQuestion, getCategoryDatabase, type Question } from '../src/lib/database';

const TRANSCRIPTS_DIR = join(process.cwd(), 'generation', 'transcripts');

interface TranscriptData {
  show: string;
  season: number;
  episode: number;
  title: string;
  transcript: string;
  source: string;
  sourceUrl: string;
  wordCount: number;
}

interface GeneratedQuestion {
  question: string;
  options: string[];
  correct_answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  explanation?: string;
}

// Show slug to subcategory mapping
const SUBCATEGORY_MAP: Record<string, string> = {
  'friends': 'sitcoms',
  'the-office-us': 'sitcoms',
  'the-big-bang-theory': 'sitcoms',
  'how-i-met-your-mother': 'sitcoms',
  'seinfeld': 'sitcoms',
  'brooklyn-nine-nine': 'sitcoms',
  'parks-and-recreation': 'sitcoms',
  'modern-family': 'sitcoms',
  'schitts-creek': 'sitcoms',
  'arrested-development': 'sitcoms',
  'game-of-thrones': 'drama',
  'breaking-bad': 'drama',
  'the-sopranos': 'drama',
  'stranger-things': 'drama',
  'the-wire': 'drama',
  'the-simpsons': 'animation',
  'south-park': 'animation',
  'family-guy': 'animation',
};

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateQuestionsForEpisode(
  transcript: TranscriptData,
  questionsCount: number = 25,
  useAnthropic: boolean = false,
  maxRetries: number = 5
): Promise<GeneratedQuestion[]> {
  const prompt = `You are an expert quiz question generator for TV shows. Generate ${questionsCount} high-quality multiple-choice questions based on this episode transcript.

**Show:** ${transcript.show}
**Season ${transcript.season}, Episode ${transcript.episode}:** ${transcript.title}

**QUESTION QUALITY STANDARDS:**

Good Questions (DO create these):
- Test memorable moments, plot points, and character interactions
- Reference specific dialogue, jokes, or key scenes
- Ask about character motivations, relationships, and decisions
- Focus on what actually happens in the episode
- Answerable by someone who watched attentively

Bad Questions (DO NOT create these):
- Colors of clothing or background objects
- Exact counts ("How many times did X happen?")
- Minor background details or props
- Anything requiring freeze-frame analysis
- Trick questions with ambiguous answers

**DIFFICULTY DISTRIBUTION (${questionsCount} total):**
- **Easy (40%, ~${Math.round(questionsCount * 0.4)} questions):** Basic plot points, main character actions, obvious jokes
- **Medium (40%, ~${Math.round(questionsCount * 0.4)} questions):** Specific dialogue, character motivations, secondary plots
- **Hard (20%, ~${Math.round(questionsCount * 0.2)} questions):** Subtle callbacks, minor details, nuanced character moments

**FORMAT RULES:**
- Exactly 4 options per question
- One clearly correct answer
- Wrong answers should be plausible but definitively incorrect
- correct_answer MUST match one option exactly
- Brief explanations referencing the scene

**TRANSCRIPT:**
${transcript.transcript.substring(0, 30000)}

**Output Format (JSON only, no other text):**
{
  "questions": [
    {
      "question": "string",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "exact match to one option",
      "difficulty": "easy|medium|hard",
      "explanation": "Brief explanation with scene reference"
    }
  ]
}`;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (useAnthropic) {
        // Use Anthropic Claude API
        const response = await axios.post(
          'https://api.anthropic.com/v1/messages',
          {
            model: 'claude-sonnet-4-20250514',
            max_tokens: 8192,
            messages: [{ role: 'user', content: prompt }],
            system: 'You are a professional TV quiz question generator. Generate accurate, engaging questions. Return ONLY valid JSON.',
          },
          {
            headers: {
              'x-api-key': process.env.ANTHROPIC_API_KEY,
              'anthropic-version': '2023-06-01',
              'Content-Type': 'application/json',
            },
          }
        );
        const content = response.data.content[0].text;
        const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
        return JSON.parse(jsonStr).questions;
      } else {
        // Use Groq API
        const response = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            model: 'llama-3.3-70b-versatile',
            messages: [
              {
                role: 'system',
                content: 'You are a professional TV quiz question generator. Generate accurate, engaging questions. Return ONLY valid JSON.',
              },
              { role: 'user', content: prompt },
            ],
            temperature: 0.7,
            max_tokens: 8000,
            response_format: { type: 'json_object' },
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );
        return JSON.parse(response.data.choices[0].message.content).questions;
      }
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 429 && attempt < maxRetries) {
        // Rate limited - wait with exponential backoff
        const waitTime = Math.pow(2, attempt) * 10000; // 20s, 40s, 80s, 160s...
        console.log(`  Rate limited. Waiting ${waitTime / 1000}s before retry ${attempt + 1}/${maxRetries}...`);
        await sleep(waitTime);
        continue;
      }
      throw err;
    }
  }
  throw new Error('Max retries exceeded');
}

function getEpisodeTranscripts(showSlug: string, season: number): TranscriptData[] {
  const showDir = join(TRANSCRIPTS_DIR, showSlug);

  if (!existsSync(showDir)) {
    throw new Error(`No transcripts found for "${showSlug}" at ${showDir}`);
  }

  const files = readdirSync(showDir)
    .filter(f => f.startsWith(`s${String(season).padStart(2, '0')}e`) && f.endsWith('.json'))
    .sort();

  if (files.length === 0) {
    throw new Error(`No Season ${season} transcripts found for "${showSlug}"`);
  }

  return files.map(file => {
    const data = JSON.parse(readFileSync(join(showDir, file), 'utf8'));
    return data as TranscriptData;
  });
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log(`
TV Show Question Generator

Usage:
  bun scripts/generate-tv-questions.ts <show-slug> <season>

Examples:
  bun scripts/generate-tv-questions.ts friends 5
  bun scripts/generate-tv-questions.ts friends 5 --start=12
  bun scripts/generate-tv-questions.ts game-of-thrones 2
`);
    process.exit(1);
  }

  const showSlug = args[0];
  const season = parseInt(args[1], 10);
  let questionsPerEpisode = 25;
  let startEpisode = 1;

  // Parse optional arguments
  for (let i = 2; i < args.length; i++) {
    if (args[i].startsWith('--start=')) {
      startEpisode = parseInt(args[i].split('=')[1], 10);
    } else if (!args[i].startsWith('--')) {
      questionsPerEpisode = parseInt(args[i], 10);
    }
  }

  if (isNaN(season) || season < 1) {
    console.error('Invalid season number');
    process.exit(1);
  }

  // Check for API keys
  const useAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const useGroq = !!process.env.GROQ_API_KEY;

  if (!useAnthropic && !useGroq) {
    console.error('No API key found. Set ANTHROPIC_API_KEY or GROQ_API_KEY');
    process.exit(1);
  }

  const apiProvider = useAnthropic ? 'Claude (Anthropic)' : 'Llama 3.3 (Groq)';

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Generating questions for ${showSlug} Season ${season}`);
  if (startEpisode > 1) {
    console.log(`Starting from episode ${startEpisode}`);
  }
  console.log(`Using: ${apiProvider}`);
  console.log(`${'='.repeat(60)}\n`);

  // Get all episode transcripts for this season
  let transcripts = getEpisodeTranscripts(showSlug, season);

  // Filter to start from specified episode
  if (startEpisode > 1) {
    transcripts = transcripts.filter(t => t.episode >= startEpisode);
  }

  console.log(`Processing ${transcripts.length} episode${transcripts.length !== 1 ? 's' : ''}\n`);

  const subcategory = SUBCATEGORY_MAP[showSlug] || 'other';
  let totalInserted = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const transcript of transcripts) {
    const epLabel = `S${String(transcript.season).padStart(2, '0')}E${String(transcript.episode).padStart(2, '0')}`;
    console.log(`\n[${epLabel}] ${transcript.title}`);
    console.log('-'.repeat(50));

    try {
      // Generate questions
      console.log(`  Generating ${questionsPerEpisode} questions...`);
      const questions = await generateQuestionsForEpisode(transcript, questionsPerEpisode, useAnthropic);
      console.log(`  Generated ${questions.length} questions`);

      // Insert into database
      let inserted = 0;
      let skipped = 0;
      let errors = 0;

      for (const q of questions) {
        // Validate question
        if (!q.question || !q.options || q.options.length !== 4 || !q.correct_answer) {
          errors++;
          continue;
        }

        // Ensure correct_answer matches one of the options
        if (!q.options.includes(q.correct_answer)) {
          errors++;
          continue;
        }

        const result = insertQuestion({
          category: 'tv-shows',
          subcategory,
          topic: showSlug,
          part: transcript.season,
          chapter: transcript.episode,
          title: transcript.title,
          question: q.question,
          options: q.options,
          correct_answer: q.correct_answer,
          difficulty: q.difficulty || 'medium',
          explanation: q.explanation,
        });

        if (result.inserted) {
          inserted++;
        } else if (result.reason === 'duplicate') {
          skipped++;
        } else {
          errors++;
        }
      }

      console.log(`  Inserted: ${inserted}, Skipped: ${skipped}, Errors: ${errors}`);
      totalInserted += inserted;
      totalSkipped += skipped;
      totalErrors += errors;

      // Longer delay between episodes to avoid rate limiting (15 seconds)
      if (transcripts.indexOf(transcript) < transcripts.length - 1) {
        console.log('  Waiting 15s before next episode...');
        await sleep(15000);
      }

    } catch (err: any) {
      console.error(`  ERROR: ${err.message}`);
      totalErrors++;
      // Wait longer after an error
      console.log('  Waiting 30s after error...');
      await sleep(30000);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Summary for ${showSlug} Season ${season}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Total Inserted: ${totalInserted}`);
  console.log(`Total Skipped (duplicates): ${totalSkipped}`);
  console.log(`Total Errors: ${totalErrors}`);
  console.log(`${'='.repeat(60)}\n`);
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});

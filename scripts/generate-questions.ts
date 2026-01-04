#!/usr/bin/env bun
/**
 * Question Generation Script
 *
 * This is the ONLY authorized path for inserting generated questions.
 * Must be invoked via the POWER_UP generate_questions arming phrase.
 *
 * Usage:
 *   bun scripts/generate-questions.ts --category=tv-shows --topic=breaking-bad --part=1 --chapter=1 < questions.json
 *   echo '[...]' | bun scripts/generate-questions.ts --category=tv-shows --topic=breaking-bad --part=1 --chapter=1
 *
 * Input: JSON array of questions via stdin
 *   [{
 *     "question": "...",
 *     "options": ["A", "B", "C", "D"],
 *     "correct_answer": "A",
 *     "difficulty": "easy|medium|hard",
 *     "explanation": "..."
 *   }, ...]
 *
 * Flags:
 *   --category    Required. e.g., tv-shows, movies, epics
 *   --topic       Required. e.g., breaking-bad, friends
 *   --part        Optional. Season number, parva number, etc.
 *   --chapter     Optional. Episode number, section number, etc.
 *   --title       Optional. Episode/chapter title
 *   --force       Optional. Re-generate even if questions exist
 *   --dry-run     Optional. Validate only, don't insert
 */

import { Database } from 'bun:sqlite';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(import.meta.dir, '..', 'data');

// ============================================================================
// Types
// ============================================================================

interface InputQuestion {
  question: string;
  options: string[];
  correct_answer: string;
  difficulty: string;
  explanation?: string;
}

interface ValidationResult {
  valid: boolean;
  reason?: string;
}

// ============================================================================
// Argument Parsing
// ============================================================================

function parseArgs(): {
  category: string;
  topic: string;
  part?: number;
  chapter?: number;
  title?: string;
  force: boolean;
  dryRun: boolean;
} {
  const args = process.argv.slice(2);
  const params: Record<string, string> = {};
  const flags: Set<string> = new Set();

  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      if (value !== undefined) {
        params[key] = value;
      } else {
        flags.add(key);
      }
    }
  }

  if (!params.category || !params.topic) {
    console.error('Error: --category and --topic are required');
    console.error('Usage: bun scripts/generate-questions.ts --category=tv-shows --topic=breaking-bad [--part=1] [--chapter=1] < questions.json');
    process.exit(1);
  }

  return {
    category: params.category,
    topic: params.topic,
    part: params.part ? parseInt(params.part) : undefined,
    chapter: params.chapter ? parseInt(params.chapter) : undefined,
    title: params.title,
    force: flags.has('force'),
    dryRun: flags.has('dry-run'),
  };
}

// ============================================================================
// Subcategory Lookup
// ============================================================================

const DRAMA_SHOWS = ['game-of-thrones', 'breaking-bad', 'mad-men', 'the-sopranos', 'the-wire', 'sherlock'];

function getSubcategory(category: string, topic: string): string | null {
  if (category === 'tv-shows') {
    return DRAMA_SHOWS.includes(topic) ? 'drama' : 'sitcoms';
  }
  if (category === 'movies') {
    return 'films';
  }
  if (category === 'epics') {
    // Lookup from topic
    const hinduEpics = ['mahabharata', 'ramayana', 'bhagavad-gita'];
    const abrahamicTexts = ['bible', 'quran'];
    if (hinduEpics.includes(topic)) return 'hindu-epics';
    if (abrahamicTexts.includes(topic)) return 'abrahamic';
    return null;
  }
  return null;
}

// ============================================================================
// Validation
// ============================================================================

function validateQuestion(q: InputQuestion): ValidationResult {
  // Must have exactly 4 options
  if (!Array.isArray(q.options) || q.options.length !== 4) {
    return { valid: false, reason: 'Must have exactly 4 options' };
  }

  // Correct answer must be in options
  if (!q.options.includes(q.correct_answer)) {
    return { valid: false, reason: 'Correct answer not in options' };
  }

  // No duplicate options
  const uniqueOptions = new Set(q.options);
  if (uniqueOptions.size !== 4) {
    return { valid: false, reason: 'Duplicate options detected' };
  }

  // Valid difficulty
  if (!['easy', 'medium', 'hard'].includes(q.difficulty)) {
    return { valid: false, reason: `Invalid difficulty: ${q.difficulty}` };
  }

  // Question must not be empty
  if (!q.question || q.question.trim().length === 0) {
    return { valid: false, reason: 'Empty question' };
  }

  return { valid: true };
}

// ============================================================================
// Database Operations
// ============================================================================

function computeHash(text: string): string {
  const normalized = text.replace(/\s+/g, '').toLowerCase();
  return Bun.hash(normalized).toString(16);
}

function getDatabase(category: string): Database {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  const dbPath = join(DATA_DIR, `${category}.db`);
  const db = new Database(dbPath);

  // Apply hardening PRAGMAs
  db.run('PRAGMA journal_mode = WAL');
  db.run('PRAGMA synchronous = FULL');
  db.run('PRAGMA busy_timeout = 30000');

  return db;
}

function questionsExist(db: Database, topic: string, part?: number, chapter?: number): number {
  let query = 'SELECT COUNT(*) as count FROM questions WHERE topic = ?';
  const params: any[] = [topic];

  if (part !== undefined) {
    query += ' AND part = ?';
    params.push(part);
  }
  if (chapter !== undefined) {
    query += ' AND chapter = ?';
    params.push(chapter);
  }

  const result = db.query(query).get(...params) as { count: number };
  return result.count;
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  const args = parseArgs();

  console.log('='.repeat(60));
  console.log('generate_questions');
  console.log('='.repeat(60));
  console.log(`Category: ${args.category}`);
  console.log(`Topic: ${args.topic}`);
  if (args.part !== undefined) console.log(`Part: ${args.part}`);
  if (args.chapter !== undefined) console.log(`Chapter: ${args.chapter}`);
  if (args.title) console.log(`Title: ${args.title}`);
  console.log(`Force: ${args.force}`);
  console.log(`Dry Run: ${args.dryRun}`);
  console.log('');

  // Lookup subcategory
  const subcategory = getSubcategory(args.category, args.topic);
  if (!subcategory) {
    console.error(`Error: Could not determine subcategory for ${args.category}/${args.topic}`);
    console.error('Subcategory mapping not found. Aborting.');
    process.exit(1);
  }
  console.log(`Subcategory: ${subcategory}`);

  // Get database
  const db = getDatabase(args.category);

  // Check existing questions
  const existingCount = questionsExist(db, args.topic, args.part, args.chapter);
  if (existingCount > 0 && !args.force) {
    console.log(`\nFound ${existingCount} existing questions for this source unit.`);
    console.log('Use --force to regenerate. Aborting.');
    db.close();
    process.exit(0);
  }

  // Read questions from stdin
  console.log('\nReading questions from stdin...');
  const input = await Bun.stdin.text();

  let questions: InputQuestion[];
  try {
    questions = JSON.parse(input);
  } catch (e) {
    console.error('Error: Invalid JSON input');
    process.exit(1);
  }

  if (!Array.isArray(questions)) {
    console.error('Error: Input must be a JSON array');
    process.exit(1);
  }

  console.log(`Received ${questions.length} questions\n`);

  // Validate and insert
  const insertStmt = db.prepare(`
    INSERT INTO questions (
      hash, subcategory, topic, part, chapter, title,
      question, options, correct_answer, difficulty, explanation,
      peer_reviewed, review_status, quality_score, review_notes, reviewed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'pending', NULL, NULL, NULL)
  `);

  let inserted = 0;
  let skipped = 0;
  const skipReasons: string[] = [];

  for (const q of questions) {
    // Validate
    const validation = validateQuestion(q);
    if (!validation.valid) {
      skipped++;
      skipReasons.push(`"${q.question?.slice(0, 30) || 'empty'}...": ${validation.reason}`);
      continue;
    }

    const hash = computeHash(q.question);

    if (args.dryRun) {
      inserted++;
      continue;
    }

    try {
      insertStmt.run(
        hash,
        subcategory,
        args.topic,
        args.part ?? null,
        args.chapter ?? null,
        args.title ?? null,
        q.question,
        JSON.stringify(q.options),
        q.correct_answer,
        q.difficulty,
        q.explanation ?? null
      );
      inserted++;
    } catch (e: any) {
      if (e.message?.includes('UNIQUE constraint')) {
        skipped++;
        skipReasons.push(`"${q.question.slice(0, 30)}...": duplicate (already exists)`);
      } else {
        skipped++;
        skipReasons.push(`"${q.question.slice(0, 30)}...": ${e.message}`);
      }
    }
  }

  db.close();

  // Report results
  console.log('='.repeat(60));
  console.log('Results');
  console.log('='.repeat(60));
  console.log(`Inserted: ${inserted}${args.dryRun ? ' (dry run)' : ''}`);
  console.log(`Skipped: ${skipped}`);

  if (skipReasons.length > 0) {
    console.log('\nSkip reasons:');
    for (const reason of skipReasons) {
      console.log(`  - ${reason}`);
    }
  }

  console.log('='.repeat(60));
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});

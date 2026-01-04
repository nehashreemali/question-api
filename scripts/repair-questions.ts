#!/usr/bin/env bun
/**
 * Question Repair Script
 *
 * This is the ONLY authorized path for repairing rejected questions.
 * Must be invoked via the POWER_UP repair_questions arming phrase.
 *
 * CRITICAL RULES (NON-NEGOTIABLE):
 *   - NEVER modify rejected question's text, options, or answers
 *   - NEVER delete rejected questions
 *   - NEVER auto-approve repaired questions
 *   - Each repaired question is inserted as a NEW row
 *   - Repaired questions start as peer_reviewed=0, review_status='pending'
 *
 * Usage:
 *   # List questions eligible for repair
 *   bun scripts/repair-questions.ts --category=tv-shows --list
 *
 *   # Submit repaired questions via stdin
 *   echo '[...]' | bun scripts/repair-questions.ts --category=tv-shows
 *
 * Input: JSON array of repaired questions via stdin
 *   [{
 *     "original_id": 123,           // ID of the rejected question being repaired
 *     "question": "...",            // New improved question text
 *     "options": ["A", "B", "C", "D"],
 *     "correct_answer": "A",
 *     "difficulty": "easy|medium|hard",
 *     "explanation": "..."
 *   }, ...]
 *
 * Flags:
 *   --category    Required. e.g., tv-shows, movies, epics
 *   --topic       Optional. Filter to specific topic
 *   --limit       Optional. Max questions to list (default: 50)
 *   --list        Optional. List eligible questions (no stdin required)
 *   --dry-run     Optional. Validate only, don't insert
 */

import { Database } from 'bun:sqlite';
import { existsSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(import.meta.dir, '..', 'data');
const MAX_REPAIR_ATTEMPTS = 1;

// ============================================================================
// Types
// ============================================================================

interface RepairedQuestion {
  original_id: number;
  question: string;
  options: string[];
  correct_answer: string;
  difficulty: string;
  explanation?: string;
}

interface RejectedQuestion {
  id: number;
  subcategory: string;
  topic: string;
  part: number | null;
  chapter: number | null;
  title: string | null;
  question: string;
  options: string;
  correct_answer: string;
  difficulty: string;
  explanation: string | null;
  review_notes: string | null;
  repair_attempts: number;
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
  topic?: string;
  limit: number;
  list: boolean;
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

  if (!params.category) {
    console.error('Error: --category is required');
    console.error('Usage: bun scripts/repair-questions.ts --category=tv-shows [--list]');
    process.exit(1);
  }

  return {
    category: params.category,
    topic: params.topic,
    limit: params.limit ? parseInt(params.limit) : 50,
    list: flags.has('list'),
    dryRun: flags.has('dry-run'),
  };
}

// ============================================================================
// Database Operations
// ============================================================================

function getDatabase(category: string): Database {
  const dbPath = join(DATA_DIR, `${category}.db`);

  if (!existsSync(dbPath)) {
    console.error(`Error: Database not found: ${dbPath}`);
    process.exit(1);
  }

  const db = new Database(dbPath);

  // Apply hardening PRAGMAs
  db.run('PRAGMA journal_mode = WAL');
  db.run('PRAGMA synchronous = FULL');
  db.run('PRAGMA busy_timeout = 30000');

  // Ensure repair_attempts column exists
  const tableInfo = db.query(`PRAGMA table_info(questions)`).all() as any[];
  const hasRepairAttempts = tableInfo.some(col => col.name === 'repair_attempts');

  if (!hasRepairAttempts) {
    db.run(`ALTER TABLE questions ADD COLUMN repair_attempts INTEGER NOT NULL DEFAULT 0`);
    console.log(`Added repair_attempts column to ${category}.db`);
  }

  return db;
}

function getEligibleForRepair(
  db: Database,
  topic: string | undefined,
  limit: number
): RejectedQuestion[] {
  let query = `
    SELECT id, subcategory, topic, part, chapter, title,
           question, options, correct_answer, difficulty, explanation,
           review_notes, repair_attempts
    FROM questions
    WHERE review_status = 'rejected'
      AND peer_reviewed = 1
      AND repair_attempts < ?
      AND review_notes IS NOT NULL
      AND review_notes != ''
  `;

  const params: any[] = [MAX_REPAIR_ATTEMPTS];

  if (topic) {
    query += ` AND topic = ?`;
    params.push(topic);
  }

  query += ` ORDER BY id LIMIT ?`;
  params.push(limit);

  return db.query(query).all(...params) as RejectedQuestion[];
}

function getOriginalQuestion(db: Database, id: number): RejectedQuestion | null {
  const result = db.query(`
    SELECT id, subcategory, topic, part, chapter, title,
           question, options, correct_answer, difficulty, explanation,
           review_notes, repair_attempts, review_status, peer_reviewed
    FROM questions
    WHERE id = ?
  `).get(id) as (RejectedQuestion & { review_status: string; peer_reviewed: number }) | null;

  return result;
}

function computeHash(text: string): string {
  const normalized = text.replace(/\s+/g, '').toLowerCase();
  return Bun.hash(normalized).toString(16);
}

// ============================================================================
// Validation
// ============================================================================

// Profanity/NSFW check (basic)
const BLOCKED_WORDS = ['fuck', 'shit', 'ass', 'bitch', 'damn', 'cunt', 'dick', 'cock', 'pussy'];

function containsProfanity(text: string): boolean {
  const lower = text.toLowerCase();
  return BLOCKED_WORDS.some(word => lower.includes(word));
}

function validateRepairedQuestion(q: RepairedQuestion): ValidationResult {
  // Must have original_id
  if (typeof q.original_id !== 'number' || q.original_id <= 0) {
    return { valid: false, reason: 'Invalid original_id' };
  }

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

  // No profanity/NSFW
  const allText = [q.question, ...q.options, q.explanation || ''].join(' ');
  if (containsProfanity(allText)) {
    return { valid: false, reason: 'Contains profanity or inappropriate content' };
  }

  return { valid: true };
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  const args = parseArgs();

  console.log('='.repeat(60));
  console.log('repair_questions');
  console.log('='.repeat(60));
  console.log(`Category: ${args.category}`);
  if (args.topic) console.log(`Topic: ${args.topic}`);
  console.log(`Limit: ${args.limit}`);
  console.log(`List Mode: ${args.list}`);
  console.log(`Dry Run: ${args.dryRun}`);
  console.log(`Max Repair Attempts: ${MAX_REPAIR_ATTEMPTS}`);
  console.log('');

  const db = getDatabase(args.category);

  // List mode: show eligible questions and exit
  if (args.list) {
    const eligible = getEligibleForRepair(db, args.topic, args.limit);

    console.log(`Found ${eligible.length} questions eligible for repair:\n`);

    for (const q of eligible) {
      console.log('-'.repeat(60));
      console.log(`ID: ${q.id}`);
      console.log(`Topic: ${q.topic}`);
      if (q.part !== null) console.log(`Part: ${q.part}`);
      if (q.chapter !== null) console.log(`Chapter: ${q.chapter}`);
      console.log(`Difficulty: ${q.difficulty}`);
      console.log(`Repair Attempts: ${q.repair_attempts}/${MAX_REPAIR_ATTEMPTS}`);
      console.log('');
      console.log(`ORIGINAL QUESTION: ${q.question}`);
      const options = JSON.parse(q.options);
      console.log(`OPTIONS: ${options.join(' | ')}`);
      console.log(`CORRECT: ${q.correct_answer}`);
      console.log('');
      console.log(`❌ REJECTION REASON: ${q.review_notes}`);
    }

    console.log('-'.repeat(60));
    console.log(`\nTotal: ${eligible.length} questions eligible for repair`);
    console.log('\nTo repair, generate improved questions and pipe them via stdin.');

    db.close();
    return;
  }

  // Repair mode: read repaired questions from stdin
  console.log('Reading repaired questions from stdin...');

  const input = await Bun.stdin.text();

  if (!input.trim()) {
    console.error('Error: No input provided. Use --list to see eligible questions, or pipe repaired questions via stdin.');
    db.close();
    process.exit(1);
  }

  let repairedQuestions: RepairedQuestion[];
  try {
    repairedQuestions = JSON.parse(input);
  } catch (e) {
    console.error('Error: Invalid JSON input');
    db.close();
    process.exit(1);
  }

  if (!Array.isArray(repairedQuestions)) {
    console.error('Error: Input must be a JSON array');
    db.close();
    process.exit(1);
  }

  console.log(`Received ${repairedQuestions.length} repaired questions\n`);

  // Prepare statements
  const insertStmt = db.prepare(`
    INSERT INTO questions (
      hash, subcategory, topic, part, chapter, title,
      question, options, correct_answer, difficulty, explanation,
      peer_reviewed, review_status, quality_score, review_notes, reviewed_at,
      repair_attempts
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'pending', NULL, NULL, NULL, 0)
  `);

  const incrementRepairStmt = db.prepare(`
    UPDATE questions SET repair_attempts = repair_attempts + 1 WHERE id = ?
  `);

  let inserted = 0;
  let skipped = 0;
  const skipReasons: string[] = [];

  for (const repaired of repairedQuestions) {
    // Validate repaired question
    const validation = validateRepairedQuestion(repaired);
    if (!validation.valid) {
      skipped++;
      skipReasons.push(`original_id ${repaired.original_id}: ${validation.reason}`);
      continue;
    }

    // Get original question
    const original = getOriginalQuestion(db, repaired.original_id);
    if (!original) {
      skipped++;
      skipReasons.push(`original_id ${repaired.original_id}: Original question not found`);
      continue;
    }

    // Verify original is rejected and eligible
    const origData = original as any;
    if (origData.review_status !== 'rejected') {
      skipped++;
      skipReasons.push(`original_id ${repaired.original_id}: Original not rejected (status: ${origData.review_status})`);
      continue;
    }

    if (origData.peer_reviewed !== 1) {
      skipped++;
      skipReasons.push(`original_id ${repaired.original_id}: Original not peer-reviewed`);
      continue;
    }

    if (original.repair_attempts >= MAX_REPAIR_ATTEMPTS) {
      skipped++;
      skipReasons.push(`original_id ${repaired.original_id}: Max repair attempts reached (${original.repair_attempts}/${MAX_REPAIR_ATTEMPTS})`);
      continue;
    }

    // Compute hash for new question
    const hash = computeHash(repaired.question);

    if (args.dryRun) {
      inserted++;
      continue;
    }

    try {
      // Insert NEW repaired question
      insertStmt.run(
        hash,
        original.subcategory,
        original.topic,
        original.part,
        original.chapter,
        original.title,
        repaired.question,
        JSON.stringify(repaired.options),
        repaired.correct_answer,
        repaired.difficulty,
        repaired.explanation ?? null
      );

      // Increment repair_attempts on ORIGINAL rejected question
      incrementRepairStmt.run(repaired.original_id);

      inserted++;
    } catch (e: any) {
      if (e.message?.includes('UNIQUE constraint')) {
        skipped++;
        skipReasons.push(`original_id ${repaired.original_id}: Duplicate question (already exists)`);
      } else {
        skipped++;
        skipReasons.push(`original_id ${repaired.original_id}: ${e.message}`);
      }
    }
  }

  db.close();

  // Report results
  console.log('='.repeat(60));
  console.log('Results');
  console.log('='.repeat(60));
  console.log(`Inserted: ${inserted}${args.dryRun ? ' (dry run)' : ''} NEW questions`);
  console.log(`Skipped: ${skipped}`);

  if (skipReasons.length > 0) {
    console.log('\nSkip reasons:');
    for (const reason of skipReasons) {
      console.log(`  - ${reason}`);
    }
  }

  if (inserted > 0 && !args.dryRun) {
    console.log('\n⚠️  Repaired questions are now PENDING review.');
    console.log('   Use POWER_UP review_questions to approve or reject them.');
  }

  console.log('='.repeat(60));
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});

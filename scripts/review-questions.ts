#!/usr/bin/env bun
/**
 * Question Review Script
 *
 * This is the ONLY authorized path for reviewing questions.
 * Must be invoked via the POWER_UP review_questions arming phrase.
 *
 * CRITICAL CONSTRAINTS:
 *   - This script MUST NEVER generate, insert, delete, or edit question content
 *   - It can ONLY update: peer_reviewed, review_status, quality_score, review_notes, reviewed_at
 *   - Rejected questions MUST have review_notes explaining why
 *
 * Usage:
 *   bun scripts/review-questions.ts --category=tv-shows [--topic=breaking-bad] [--limit=100] < reviews.json
 *   echo '[...]' | bun scripts/review-questions.ts --category=tv-shows
 *
 * Input: JSON array of review decisions via stdin
 *   [{
 *     "id": 123,
 *     "status": "approved" | "rejected",
 *     "quality_score": 0.85,
 *     "review_notes": "Optional for approved, REQUIRED for rejected"
 *   }, ...]
 *
 * Or run without stdin to list pending questions for review:
 *   bun scripts/review-questions.ts --category=tv-shows --list
 *
 * Flags:
 *   --category    Required. e.g., tv-shows, movies, epics
 *   --topic       Optional. Filter to specific topic
 *   --limit       Optional. Max questions to process (default: 100)
 *   --list        Optional. List pending questions (no stdin required)
 *   --force       Optional. Re-review already reviewed questions
 *   --dry-run     Optional. Validate only, don't update
 */

import { Database } from 'bun:sqlite';
import { existsSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(import.meta.dir, '..', 'data');

// ============================================================================
// Types
// ============================================================================

interface ReviewDecision {
  id: number;
  status: 'approved' | 'rejected';
  quality_score: number;
  review_notes?: string;
}

interface PendingQuestion {
  id: number;
  topic: string;
  part: number | null;
  chapter: number | null;
  question: string;
  options: string;
  correct_answer: string;
  difficulty: string;
  explanation: string | null;
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

  if (!params.category) {
    console.error('Error: --category is required');
    console.error('Usage: bun scripts/review-questions.ts --category=tv-shows [--topic=breaking-bad] [--list]');
    process.exit(1);
  }

  return {
    category: params.category,
    topic: params.topic,
    limit: params.limit ? parseInt(params.limit) : 100,
    list: flags.has('list'),
    force: flags.has('force'),
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

  return db;
}

function getPendingQuestions(
  db: Database,
  topic: string | undefined,
  limit: number,
  force: boolean
): PendingQuestion[] {
  let query = `
    SELECT id, topic, part, chapter, question, options, correct_answer, difficulty, explanation
    FROM questions
    WHERE review_status = 'pending'
  `;

  // If not force, only get unreviewed questions
  if (!force) {
    query += ` AND peer_reviewed = 0`;
  }

  const params: any[] = [];

  if (topic) {
    query += ` AND topic = ?`;
    params.push(topic);
  }

  query += ` ORDER BY id LIMIT ?`;
  params.push(limit);

  return db.query(query).all(...params) as PendingQuestion[];
}

function getQuestionById(db: Database, id: number): PendingQuestion | null {
  const result = db.query(`
    SELECT id, topic, part, chapter, question, options, correct_answer, difficulty, explanation,
           peer_reviewed, review_status
    FROM questions
    WHERE id = ?
  `).get(id) as (PendingQuestion & { peer_reviewed: number; review_status: string }) | null;

  return result;
}

// ============================================================================
// Validation
// ============================================================================

function validateReviewDecision(decision: ReviewDecision): ValidationResult {
  // Must have valid status
  if (!['approved', 'rejected'].includes(decision.status)) {
    return { valid: false, reason: `Invalid status: ${decision.status}` };
  }

  // Must have quality_score
  if (typeof decision.quality_score !== 'number') {
    return { valid: false, reason: 'quality_score must be a number' };
  }

  // quality_score must be between 0 and 1
  if (decision.quality_score < 0 || decision.quality_score > 1) {
    return { valid: false, reason: 'quality_score must be between 0 and 1' };
  }

  // Approved questions should have quality_score >= 0.7
  if (decision.status === 'approved' && decision.quality_score < 0.7) {
    return { valid: false, reason: 'Approved questions must have quality_score >= 0.7' };
  }

  // Rejected questions MUST have review_notes
  if (decision.status === 'rejected') {
    if (!decision.review_notes || decision.review_notes.trim().length === 0) {
      return { valid: false, reason: 'Rejected questions MUST have review_notes explaining why' };
    }
  }

  // Must have valid id
  if (typeof decision.id !== 'number' || decision.id <= 0) {
    return { valid: false, reason: 'Invalid question id' };
  }

  return { valid: true };
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  const args = parseArgs();

  console.log('='.repeat(60));
  console.log('review_questions');
  console.log('='.repeat(60));
  console.log(`Category: ${args.category}`);
  if (args.topic) console.log(`Topic: ${args.topic}`);
  console.log(`Limit: ${args.limit}`);
  console.log(`List Mode: ${args.list}`);
  console.log(`Force: ${args.force}`);
  console.log(`Dry Run: ${args.dryRun}`);
  console.log('');

  const db = getDatabase(args.category);

  // List mode: show pending questions and exit
  if (args.list) {
    const pending = getPendingQuestions(db, args.topic, args.limit, args.force);

    console.log(`Found ${pending.length} pending questions:\n`);

    for (const q of pending) {
      console.log('-'.repeat(60));
      console.log(`ID: ${q.id}`);
      console.log(`Topic: ${q.topic}`);
      if (q.part !== null) console.log(`Part: ${q.part}`);
      if (q.chapter !== null) console.log(`Chapter: ${q.chapter}`);
      console.log(`Difficulty: ${q.difficulty}`);
      console.log(`Question: ${q.question}`);
      const options = JSON.parse(q.options);
      console.log(`Options: ${options.join(' | ')}`);
      console.log(`Correct: ${q.correct_answer}`);
      if (q.explanation) console.log(`Explanation: ${q.explanation}`);
    }

    console.log('-'.repeat(60));
    console.log(`\nTotal: ${pending.length} pending questions`);

    db.close();
    return;
  }

  // Review mode: read decisions from stdin
  console.log('Reading review decisions from stdin...');

  // Check if stdin has data
  const input = await Bun.stdin.text();

  if (!input.trim()) {
    console.error('Error: No input provided. Use --list to see pending questions, or pipe review decisions via stdin.');
    db.close();
    process.exit(1);
  }

  let decisions: ReviewDecision[];
  try {
    decisions = JSON.parse(input);
  } catch (e) {
    console.error('Error: Invalid JSON input');
    db.close();
    process.exit(1);
  }

  if (!Array.isArray(decisions)) {
    console.error('Error: Input must be a JSON array');
    db.close();
    process.exit(1);
  }

  console.log(`Received ${decisions.length} review decisions\n`);

  // Prepare update statement
  // ONLY updates: peer_reviewed, review_status, quality_score, review_notes, reviewed_at
  const updateStmt = db.prepare(`
    UPDATE questions
    SET peer_reviewed = 1,
        review_status = ?,
        quality_score = ?,
        review_notes = ?,
        reviewed_at = datetime('now')
    WHERE id = ?
  `);

  let updated = 0;
  let skipped = 0;
  const skipReasons: string[] = [];

  for (const decision of decisions) {
    // Validate decision
    const validation = validateReviewDecision(decision);
    if (!validation.valid) {
      skipped++;
      skipReasons.push(`ID ${decision.id}: ${validation.reason}`);
      continue;
    }

    // Check if question exists and is reviewable
    const question = getQuestionById(db, decision.id);
    if (!question) {
      skipped++;
      skipReasons.push(`ID ${decision.id}: Question not found`);
      continue;
    }

    // Check if already reviewed (unless force)
    const qData = question as any;
    if (qData.peer_reviewed === 1 && !args.force) {
      skipped++;
      skipReasons.push(`ID ${decision.id}: Already reviewed (use --force to re-review)`);
      continue;
    }

    if (args.dryRun) {
      updated++;
      continue;
    }

    try {
      updateStmt.run(
        decision.status,
        decision.quality_score,
        decision.review_notes ?? null,
        decision.id
      );
      updated++;
    } catch (e: any) {
      skipped++;
      skipReasons.push(`ID ${decision.id}: ${e.message}`);
    }
  }

  db.close();

  // Report results
  console.log('='.repeat(60));
  console.log('Results');
  console.log('='.repeat(60));
  console.log(`Updated: ${updated}${args.dryRun ? ' (dry run)' : ''}`);
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

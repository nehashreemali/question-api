#!/usr/bin/env bun
/**
 * Export Approved Questions to Production Database
 *
 * This is the ONLY authorized path for creating production databases.
 * Must be invoked via the POWER_UP export_prod_db arming phrase.
 *
 * Creates a read-only SQLite database for gameplay with:
 * - Only approved questions (review_status = 'approved')
 * - Expired current affairs excluded
 * - Answers embedded as JSON array [{text, index}]
 * - Difficulty as integer (1=easy, 2=medium, 3=hard)
 * - Auto-generated tags
 *
 * Usage:
 *   bun scripts/export-prod-db.ts
 *   bun scripts/export-prod-db.ts --category=tv-shows
 *   bun scripts/export-prod-db.ts --topic=friends --limit=100
 *   bun scripts/export-prod-db.ts --dry-run
 *
 * Flags:
 *   --category    Optional. Filter to specific category
 *   --topic       Optional. Filter to specific topic
 *   --difficulty  Optional. Filter by difficulty (easy|medium|hard)
 *   --limit       Optional. Maximum number of questions to export
 *   --dry-run     Optional. Preview only, don't create database
 */

import { Database } from 'bun:sqlite';
import { existsSync, mkdirSync, readdirSync, unlinkSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(import.meta.dir, '..', 'data');
const DIST_DIR = join(import.meta.dir, '..', 'dist');
const PROD_DB_PATH = join(DIST_DIR, 'prod-questions.db');

// ============================================================================
// Types
// ============================================================================

interface Args {
  category?: string;
  topic?: string;
  difficulty?: string;
  limit?: number;
  dryRun: boolean;
}

interface SourceQuestion {
  id: number;
  subcategory: string;
  topic: string;
  part: number | null;
  chapter: number | null;
  question: string;
  options: string; // JSON array of strings
  correct_answer: string;
  difficulty: string;
  explanation: string | null;
  is_current_affairs: number;
  current_affairs_until: string | null;
}

interface ProdAnswer {
  text: string;
  index: number;
}

// ============================================================================
// Argument Parsing
// ============================================================================

function parseArgs(): Args {
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

  return {
    category: params.category,
    topic: params.topic,
    difficulty: params.difficulty,
    limit: params.limit ? parseInt(params.limit) : undefined,
    dryRun: flags.has('dry-run'),
  };
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Map difficulty string to integer.
 */
function difficultyToInt(difficulty: string): number {
  switch (difficulty?.toLowerCase()) {
    case 'easy': return 1;
    case 'medium': return 2;
    case 'hard': return 3;
    default: return 2; // Default to medium
  }
}

/**
 * Convert options array and correct_answer to answers JSON and correct_index.
 * Answers are sorted alphabetically by text for deterministic storage.
 * Client randomizes order at runtime.
 */
function convertAnswers(optionsJson: string, correctAnswer: string): { answers: ProdAnswer[]; correctIndex: number } {
  const options: string[] = JSON.parse(optionsJson);

  // Sort options alphabetically and assign indexes (1-based)
  const sortedOptions = [...options].sort((a, b) => a.localeCompare(b));

  const answers: ProdAnswer[] = sortedOptions.map((text, i) => ({
    text,
    index: i + 1,
  }));

  // Find correct index in the sorted array
  const correctIndex = sortedOptions.findIndex(opt => opt === correctAnswer) + 1;

  if (correctIndex === 0) {
    // Fallback: correct answer not found in options (shouldn't happen)
    console.warn(`Warning: correct_answer not found in options: "${correctAnswer}"`);
    return { answers, correctIndex: 1 };
  }

  return { answers, correctIndex };
}

/**
 * Generate tags from question metadata.
 */
function generateTags(category: string, subcategory: string, topic: string, difficulty: string): string {
  const tags = [
    category,
    subcategory,
    topic,
    difficulty?.toLowerCase() || 'medium',
  ];

  return JSON.stringify(tags);
}

/**
 * Get list of category database files.
 */
function getCategoryDatabaseFiles(): string[] {
  if (!existsSync(DATA_DIR)) return [];

  return readdirSync(DATA_DIR)
    .filter(f =>
      f.endsWith('.db') &&
      !f.startsWith('_') &&
      f !== 'registry.db' &&
      f !== 'pipeline.db' &&
      f !== 'questions.db' // Legacy
    )
    .map(f => f.replace('.db', ''));
}

/**
 * Check if a current affairs question has expired.
 */
function isExpiredCurrentAffairs(q: SourceQuestion): boolean {
  if (!q.is_current_affairs || !q.current_affairs_until) {
    return false;
  }

  const expiryDate = new Date(q.current_affairs_until);
  const now = new Date();

  return expiryDate < now;
}

// ============================================================================
// Main Export Logic
// ============================================================================

function exportToProd(args: Args): void {
  console.log('='.repeat(60));
  console.log('export_prod_db');
  console.log('='.repeat(60));

  if (args.dryRun) {
    console.log('[DRY RUN] No changes will be made\n');
  }

  // Log filters
  console.log('Filters:');
  console.log(`  Category: ${args.category || '(all)'}`);
  console.log(`  Topic: ${args.topic || '(all)'}`);
  console.log(`  Difficulty: ${args.difficulty || '(all)'}`);
  console.log(`  Limit: ${args.limit || '(none)'}`);
  console.log('');

  // Create dist directory
  if (!args.dryRun) {
    if (!existsSync(DIST_DIR)) {
      mkdirSync(DIST_DIR, { recursive: true });
    }

    // Remove existing prod DB
    if (existsSync(PROD_DB_PATH)) {
      unlinkSync(PROD_DB_PATH);
      console.log(`Removed existing ${PROD_DB_PATH}\n`);
    }
  }

  // Create production database
  const prodDb = args.dryRun ? null : new Database(PROD_DB_PATH);

  if (prodDb) {
    // Apply hardening PRAGMAs
    prodDb.run('PRAGMA journal_mode = WAL');
    prodDb.run('PRAGMA synchronous = FULL');

    // Create schema
    prodDb.run(`
      CREATE TABLE questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        category TEXT NOT NULL,
        subcategory TEXT NOT NULL,
        topic TEXT NOT NULL,

        difficulty INTEGER NOT NULL,

        question TEXT NOT NULL,

        answers TEXT NOT NULL,
        correct_answer_index INTEGER NOT NULL,

        explanation TEXT,

        is_current_affairs INTEGER NOT NULL DEFAULT 0,
        current_affairs_until TEXT,

        tags TEXT
      )
    `);

    // Create indexes for common queries
    prodDb.run('CREATE INDEX idx_category ON questions(category)');
    prodDb.run('CREATE INDEX idx_topic ON questions(topic)');
    prodDb.run('CREATE INDEX idx_difficulty ON questions(difficulty)');
    prodDb.run('CREATE INDEX idx_current_affairs ON questions(is_current_affairs)');
  }

  // Prepare insert statement
  const insertStmt = prodDb?.prepare(`
    INSERT INTO questions (
      category, subcategory, topic, difficulty,
      question, answers, correct_answer_index, explanation,
      is_current_affairs, current_affairs_until, tags
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Determine which categories to process
  let categories = getCategoryDatabaseFiles();

  if (args.category) {
    if (!categories.includes(args.category)) {
      console.error(`Error: Category database not found: ${args.category}.db`);
      process.exit(1);
    }
    categories = [args.category];
  }

  console.log(`Found ${categories.length} source database(s): ${categories.join(', ')}\n`);

  let totalExported = 0;
  let totalSkipped = 0;
  let expiredSkipped = 0;
  let remainingLimit = args.limit;

  for (const category of categories) {
    // Check if we've hit the limit
    if (remainingLimit !== undefined && remainingLimit <= 0) {
      break;
    }

    const sourcePath = join(DATA_DIR, `${category}.db`);
    const sourceDb = new Database(sourcePath, { readonly: true });

    // Build query with filters
    let query = `
      SELECT
        id, subcategory, topic, part, chapter,
        question, options, correct_answer, difficulty,
        explanation, is_current_affairs, current_affairs_until
      FROM questions
      WHERE review_status = 'approved'
    `;
    const params: any[] = [];

    if (args.topic) {
      query += ` AND topic = ?`;
      params.push(args.topic);
    }

    if (args.difficulty) {
      query += ` AND difficulty = ?`;
      params.push(args.difficulty);
    }

    query += ` ORDER BY id`;

    const questions = sourceDb.query(query).all(...params) as SourceQuestion[];

    const pendingCount = sourceDb.query(`
      SELECT COUNT(*) as count FROM questions WHERE review_status = 'pending'
    `).get() as { count: number };

    const rejectedCount = sourceDb.query(`
      SELECT COUNT(*) as count FROM questions WHERE review_status = 'rejected'
    `).get() as { count: number };

    console.log(`${category}.db:`);
    console.log(`  Approved: ${questions.length}`);
    console.log(`  Pending:  ${pendingCount.count}`);
    console.log(`  Rejected: ${rejectedCount.count}`);

    if (questions.length === 0) {
      console.log(`  → Skipping (no approved questions matching filters)\n`);
      sourceDb.close();
      continue;
    }

    // Export each question
    let exported = 0;
    let expired = 0;

    for (const q of questions) {
      // Check limit
      if (remainingLimit !== undefined && remainingLimit <= 0) {
        break;
      }

      // Skip expired current affairs
      if (isExpiredCurrentAffairs(q)) {
        expired++;
        continue;
      }

      const { answers, correctIndex } = convertAnswers(q.options, q.correct_answer);
      const tags = generateTags(category, q.subcategory, q.topic, q.difficulty);
      const difficultyInt = difficultyToInt(q.difficulty);

      if (!args.dryRun && insertStmt) {
        insertStmt.run(
          category,
          q.subcategory,
          q.topic,
          difficultyInt,
          q.question,
          JSON.stringify(answers),
          correctIndex,
          q.explanation,
          q.is_current_affairs,
          q.current_affairs_until,
          tags
        );
      }

      exported++;
      if (remainingLimit !== undefined) {
        remainingLimit--;
      }
    }

    if (expired > 0) {
      console.log(`  Expired:  ${expired} (current affairs past expiry date)`);
    }
    console.log(`  → Exported ${exported} questions\n`);

    totalExported += exported;
    totalSkipped += pendingCount.count + rejectedCount.count;
    expiredSkipped += expired;

    sourceDb.close();
  }

  // FAIL if zero approved questions found
  if (totalExported === 0) {
    if (prodDb) {
      prodDb.close();
      // Clean up empty database
      if (existsSync(PROD_DB_PATH)) {
        unlinkSync(PROD_DB_PATH);
      }
    }
    console.error('='.repeat(60));
    console.error('ERROR: No approved questions found!');
    console.error('Cannot create production database with zero questions.');
    console.error('='.repeat(60));
    process.exit(1);
  }

  // Finalize
  if (prodDb) {
    // Get final count
    const finalCount = prodDb.query('SELECT COUNT(*) as count FROM questions').get() as { count: number };
    prodDb.close();

    console.log('='.repeat(60));
    console.log('Export complete!');
    console.log(`  Total exported: ${finalCount.count}`);
    console.log(`  Total skipped:  ${totalSkipped} (pending/rejected)`);
    if (expiredSkipped > 0) {
      console.log(`  Expired CA:     ${expiredSkipped}`);
    }
    console.log(`  Output: ${PROD_DB_PATH}`);
    console.log('='.repeat(60));
  } else {
    console.log('='.repeat(60));
    console.log('[DRY RUN] Would export:');
    console.log(`  Total: ${totalExported}`);
    console.log(`  Skipped: ${totalSkipped}`);
    if (expiredSkipped > 0) {
      console.log(`  Expired CA: ${expiredSkipped}`);
    }
    console.log(`  Output: ${PROD_DB_PATH}`);
    console.log('='.repeat(60));
  }
}

// Run
const args = parseArgs();
exportToProd(args);

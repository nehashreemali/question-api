/**
 * Export Approved Questions to Production Database
 *
 * Creates a read-only SQLite database for gameplay with:
 * - Answers embedded as JSON array [{text, index}]
 * - Difficulty as integer (1=easy, 2=medium, 3=hard)
 * - Auto-generated tags
 *
 * Usage:
 *   bun scripts/export-prod-db.ts
 *   bun scripts/export-prod-db.ts --dry-run
 */

import { Database } from 'bun:sqlite';
import { existsSync, mkdirSync, readdirSync, unlinkSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(import.meta.dir, '..', 'data');
const PROD_DIR = join(import.meta.dir, '..', 'prod');
const PROD_DB_PATH = join(PROD_DIR, 'questions.db');

const DRY_RUN = process.argv.includes('--dry-run');

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Main Export Logic
// ============================================================================

function exportToProd(): void {
  console.log('='.repeat(60));
  console.log('Export Approved Questions to Production Database');
  console.log('='.repeat(60));

  if (DRY_RUN) {
    console.log('[DRY RUN] No changes will be made\n');
  }

  // Create prod directory
  if (!DRY_RUN) {
    if (!existsSync(PROD_DIR)) {
      mkdirSync(PROD_DIR, { recursive: true });
    }

    // Remove existing prod DB
    if (existsSync(PROD_DB_PATH)) {
      unlinkSync(PROD_DB_PATH);
      console.log(`Removed existing ${PROD_DB_PATH}\n`);
    }
  }

  // Create production database
  const prodDb = DRY_RUN ? null : new Database(PROD_DB_PATH);

  if (prodDb) {
    // Apply hardening PRAGMAs
    prodDb.run('PRAGMA journal_mode = WAL');
    prodDb.run('PRAGMA synchronous = FULL');

    // Create schema
    prodDb.run(`
      CREATE TABLE questions (
        id INTEGER PRIMARY KEY,

        category TEXT NOT NULL,
        subcategory TEXT NOT NULL,
        topic TEXT NOT NULL,

        difficulty INTEGER NOT NULL,

        question TEXT NOT NULL,

        answers TEXT NOT NULL,
        correct_index INTEGER NOT NULL,

        explanation TEXT,

        is_current_affairs INTEGER NOT NULL DEFAULT 0,
        current_affairs_until TEXT,

        tags TEXT
      )
    `);

    // Create indexes for common queries
    prodDb.run('CREATE INDEX idx_category ON questions(category)');
    prodDb.run('CREATE INDEX idx_subcategory ON questions(category, subcategory)');
    prodDb.run('CREATE INDEX idx_topic ON questions(category, subcategory, topic)');
    prodDb.run('CREATE INDEX idx_difficulty ON questions(difficulty)');
    prodDb.run('CREATE INDEX idx_current_affairs ON questions(is_current_affairs, current_affairs_until)');
  }

  // Prepare insert statement
  const insertStmt = prodDb?.prepare(`
    INSERT INTO questions (
      category, subcategory, topic, difficulty,
      question, answers, correct_index, explanation,
      is_current_affairs, current_affairs_until, tags
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Process each source database
  const categories = getCategoryDatabaseFiles();
  let totalExported = 0;
  let totalSkipped = 0;

  console.log(`Found ${categories.length} source database(s): ${categories.join(', ')}\n`);

  for (const category of categories) {
    const sourcePath = join(DATA_DIR, `${category}.db`);
    const sourceDb = new Database(sourcePath, { readonly: true });

    // Query approved questions only
    const questions = sourceDb.query(`
      SELECT
        id, subcategory, topic, part, chapter,
        question, options, correct_answer, difficulty,
        explanation, is_current_affairs, current_affairs_until
      FROM questions
      WHERE review_status = 'approved'
      ORDER BY id
    `).all() as SourceQuestion[];

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
      console.log(`  → Skipping (no approved questions)\n`);
      sourceDb.close();
      continue;
    }

    // Export each question
    let exported = 0;
    for (const q of questions) {
      const { answers, correctIndex } = convertAnswers(q.options, q.correct_answer);
      const tags = generateTags(category, q.subcategory, q.topic, q.difficulty);
      const difficultyInt = difficultyToInt(q.difficulty);

      if (!DRY_RUN && insertStmt) {
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
    }

    console.log(`  → Exported ${exported} questions\n`);
    totalExported += exported;
    totalSkipped += pendingCount.count + rejectedCount.count;

    sourceDb.close();
  }

  // Finalize
  if (prodDb) {
    // Get final count
    const finalCount = prodDb.query('SELECT COUNT(*) as count FROM questions').get() as { count: number };
    prodDb.close();

    console.log('='.repeat(60));
    console.log(`Export complete!`);
    console.log(`  Total exported: ${finalCount.count}`);
    console.log(`  Total skipped:  ${totalSkipped} (pending/rejected)`);
    console.log(`  Output: ${PROD_DB_PATH}`);
    console.log('='.repeat(60));
  } else {
    console.log('='.repeat(60));
    console.log('[DRY RUN] Would export:');
    console.log(`  Total: ${totalExported}`);
    console.log(`  Skipped: ${totalSkipped}`);
    console.log(`  Output: ${PROD_DB_PATH}`);
    console.log('='.repeat(60));
  }
}

// Run
exportToProd();

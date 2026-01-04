/**
 * Category Question Databases
 *
 * Each category (tv-shows, movies, epics, etc.) has its own SQLite database.
 * This allows parallel work without conflicts.
 * Uses generic part/chapter hierarchy that works for any content type.
 */

import { Database } from 'bun:sqlite';
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(import.meta.dir, '..', '..', 'data');

// ============================================================================
// Database Configuration (Hardening)
// ============================================================================

/**
 * Configure database with safety PRAGMAs.
 * Called once per connection to ensure durability and performance.
 *
 * - WAL mode: Better concurrency, faster writes, crash-safe
 * - synchronous=FULL: Guarantees data is on disk before commit returns
 * - busy_timeout: Wait up to 30s if database is locked (avoids immediate SQLITE_BUSY)
 */
function configureDatabase(db: Database): void {
  // WAL mode for better concurrency and crash recovery
  db.run('PRAGMA journal_mode = WAL');

  // FULL sync ensures data reaches disk before commit completes
  // Prevents data loss on power failure (critical for batch writes)
  db.run('PRAGMA synchronous = FULL');

  // Wait up to 30 seconds if another process holds the lock
  db.run('PRAGMA busy_timeout = 30000');
}

/**
 * Execute a function within an explicit transaction.
 * Ensures atomicity for batch operations.
 *
 * Usage:
 *   withTransaction(db, () => {
 *     db.run('INSERT ...');
 *     db.run('INSERT ...');
 *   });
 */
export function withTransaction<T>(db: Database, fn: () => T): T {
  db.run('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.run('COMMIT');
    return result;
  } catch (error) {
    db.run('ROLLBACK');
    throw error;
  }
}

// Cache of open database connections per category
const dbCache: Map<string, Database> = new Map();

// ============================================================================
// Database Initialization
// ============================================================================

/**
 * Get or initialize a category-specific database.
 */
export function getCategoryDatabase(category: string): Database {
  // Check cache first
  if (dbCache.has(category)) {
    return dbCache.get(category)!;
  }

  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  const dbPath = join(DATA_DIR, `${category}.db`);
  const database = new Database(dbPath);

  // Apply hardening PRAGMAs (WAL, synchronous=FULL, busy_timeout)
  configureDatabase(database);

  // Create table with subcategory field
  database.run(`
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash TEXT UNIQUE NOT NULL,

      subcategory TEXT NOT NULL,
      topic TEXT NOT NULL,

      part INTEGER,
      chapter INTEGER,
      title TEXT,

      question TEXT NOT NULL,
      options TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      difficulty TEXT DEFAULT 'medium',
      explanation TEXT,

      synced_to_mongo INTEGER NOT NULL DEFAULT 0,

      -- Review workflow columns
      peer_reviewed INTEGER NOT NULL DEFAULT 0,
      review_status TEXT NOT NULL DEFAULT 'pending',
      quality_score REAL DEFAULT NULL,
      review_notes TEXT DEFAULT NULL,
      reviewed_at TEXT DEFAULT NULL,

      -- Current affairs lifecycle columns
      is_current_affairs INTEGER NOT NULL DEFAULT 0,
      current_affairs_until TEXT DEFAULT NULL,

      -- Repair tracking (for rejected questions only)
      repair_attempts INTEGER NOT NULL DEFAULT 0,

      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Create standard indexes
  database.run(`CREATE INDEX IF NOT EXISTS idx_subcategory ON questions(subcategory)`);
  database.run(`CREATE INDEX IF NOT EXISTS idx_topic ON questions(subcategory, topic)`);
  database.run(`CREATE INDEX IF NOT EXISTS idx_part ON questions(subcategory, topic, part)`);
  database.run(`CREATE INDEX IF NOT EXISTS idx_chapter ON questions(subcategory, topic, part, chapter)`);
  database.run(`CREATE INDEX IF NOT EXISTS idx_difficulty ON questions(difficulty)`);
  database.run(`CREATE INDEX IF NOT EXISTS idx_hash ON questions(hash)`);

  // Migration: Add synced_to_mongo column if it doesn't exist
  const tableInfo = database.query(`PRAGMA table_info(questions)`).all() as any[];
  const hasSyncedColumn = tableInfo.some(col => col.name === 'synced_to_mongo');

  if (!hasSyncedColumn) {
    try {
      database.run(`ALTER TABLE questions ADD COLUMN synced_to_mongo INTEGER DEFAULT 0`);
      console.log(`Added synced_to_mongo column to ${category}.db`);
    } catch (e: any) {
      console.error(`Failed to add synced_to_mongo column: ${e.message}`);
    }
  }

  // Create index on synced_to_mongo (only after column exists)
  try {
    database.run(`CREATE INDEX IF NOT EXISTS idx_synced ON questions(synced_to_mongo)`);
  } catch (e) {
    // Column might not exist in edge cases
  }

  // Migration: Add review workflow columns if they don't exist
  const existingColumns = new Set(tableInfo.map((col: any) => col.name));

  if (!existingColumns.has('peer_reviewed')) {
    database.run(`ALTER TABLE questions ADD COLUMN peer_reviewed INTEGER NOT NULL DEFAULT 0`);
    database.run(`ALTER TABLE questions ADD COLUMN review_status TEXT NOT NULL DEFAULT 'pending'`);
    database.run(`ALTER TABLE questions ADD COLUMN quality_score REAL DEFAULT NULL`);
    database.run(`ALTER TABLE questions ADD COLUMN review_notes TEXT DEFAULT NULL`);
    database.run(`ALTER TABLE questions ADD COLUMN reviewed_at TEXT DEFAULT NULL`);
    console.log(`Added review workflow columns to ${category}.db`);
  }

  // Migration: Add current affairs lifecycle columns if they don't exist
  if (!existingColumns.has('is_current_affairs')) {
    database.run(`ALTER TABLE questions ADD COLUMN is_current_affairs INTEGER NOT NULL DEFAULT 0`);
    database.run(`ALTER TABLE questions ADD COLUMN current_affairs_until TEXT DEFAULT NULL`);
    console.log(`Added current affairs columns to ${category}.db`);
  }

  // Migration: Add repair_attempts column if it doesn't exist
  if (!existingColumns.has('repair_attempts')) {
    database.run(`ALTER TABLE questions ADD COLUMN repair_attempts INTEGER NOT NULL DEFAULT 0`);
    console.log(`Added repair_attempts column to ${category}.db`);
  }

  // Create indexes for new columns
  database.run(`CREATE INDEX IF NOT EXISTS idx_review_status ON questions(review_status)`);
  database.run(`CREATE INDEX IF NOT EXISTS idx_current_affairs ON questions(is_current_affairs, current_affairs_until)`);

  dbCache.set(category, database);
  return database;
}

/**
 * Initialize the legacy database (for migration purposes).
 * @deprecated Use getCategoryDatabase instead
 */
export function initDatabase(): Database {
  return getCategoryDatabase('_legacy');
}

/**
 * Migrate from old schema (season/episode) to new (part/chapter) if needed.
 */
function migrateSchema(database: Database): void {
  try {
    // Check if old columns exist
    const tableInfo = database.query(`PRAGMA table_info(questions)`).all() as any[];
    const hasSeasonColumn = tableInfo.some(col => col.name === 'season');
    const hasShowColumn = tableInfo.some(col => col.name === 'show');

    if (hasSeasonColumn || hasShowColumn) {
      console.log('Migrating database schema...');

      // Create new table
      database.run(`
        CREATE TABLE IF NOT EXISTS questions_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          hash TEXT UNIQUE NOT NULL,
          category TEXT NOT NULL,
          topic TEXT NOT NULL,
          part INTEGER,
          chapter INTEGER,
          title TEXT,
          question TEXT NOT NULL,
          options TEXT NOT NULL,
          correct_answer TEXT NOT NULL,
          difficulty TEXT DEFAULT 'medium',
          explanation TEXT,
          created_at TEXT DEFAULT (datetime('now'))
        )
      `);

      // Copy data with column mapping
      if (hasShowColumn && hasSeasonColumn) {
        database.run(`
          INSERT OR IGNORE INTO questions_new
            (hash, category, topic, part, chapter, title, question, options, correct_answer, difficulty, explanation, created_at)
          SELECT
            hash, 'tv-shows', show, season, episode, episode_title, question, options, correct_answer, difficulty, explanation, created_at
          FROM questions
        `);
      }

      // Drop old and rename new
      database.run(`DROP TABLE questions`);
      database.run(`ALTER TABLE questions_new RENAME TO questions`);

      // Recreate indexes
      database.run(`CREATE INDEX IF NOT EXISTS idx_category ON questions(category)`);
      database.run(`CREATE INDEX IF NOT EXISTS idx_topic ON questions(category, topic)`);
      database.run(`CREATE INDEX IF NOT EXISTS idx_part ON questions(category, topic, part)`);
      database.run(`CREATE INDEX IF NOT EXISTS idx_chapter ON questions(category, topic, part, chapter)`);
      database.run(`CREATE INDEX IF NOT EXISTS idx_difficulty ON questions(difficulty)`);
      database.run(`CREATE INDEX IF NOT EXISTS idx_hash ON questions(hash)`);

      console.log('Schema migration complete.');
    }
  } catch (e) {
    // Migration not needed or already done
  }
}

/**
 * Close all database connections.
 */
export function closeDatabase(): void {
  for (const [category, database] of dbCache) {
    database.close();
  }
  dbCache.clear();
}

/**
 * Close a specific category database.
 */
export function closeCategoryDatabase(category: string): void {
  const database = dbCache.get(category);
  if (database) {
    database.close();
    dbCache.delete(category);
  }
}

// ============================================================================
// Hash Generation
// ============================================================================

/**
 * Generate a unique hash for a question.
 */
export function computeHash(questionText: string): string {
  const normalized = questionText.replace(/\s+/g, '').toLowerCase();
  return Bun.hash(normalized).toString(16);
}

// ============================================================================
// Question Operations
// ============================================================================

export interface Question {
  id?: number;
  hash?: string;
  category: string;        // e.g., 'tv-shows' - determines which DB to use
  subcategory: string;     // e.g., 'sitcoms' - stored in the DB
  topic: string;           // e.g., 'friends' - the specific show/topic
  part?: number | null;    // e.g., season number
  chapter?: number | null; // e.g., episode number
  title?: string | null;   // e.g., episode title
  question: string;
  options: string[];
  correct_answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  explanation?: string | null;
  synced_to_mongo?: boolean;

  // Review workflow
  peer_reviewed?: boolean;
  review_status?: 'pending' | 'approved' | 'rejected';
  quality_score?: number | null;
  review_notes?: string | null;
  reviewed_at?: string | null;

  // Current affairs lifecycle
  is_current_affairs?: boolean;
  current_affairs_until?: string | null;

  // Repair tracking
  repair_attempts?: number;

  created_at?: string;
}

export interface InsertResult {
  success: boolean;
  inserted: boolean;
  hash: string;
  reason?: string;
}

/**
 * Insert a question into the appropriate category database.
 *
 * ⚠️  WARNING: LOW-LEVEL FUNCTION - DO NOT CALL DIRECTLY
 *
 * All question generation MUST go through: scripts/generate-questions.ts
 * This function should ONLY be called from that script.
 * Direct calls from other code paths are prohibited.
 */
export function insertQuestion(q: Question): InsertResult {
  const database = getCategoryDatabase(q.category);
  const hash = computeHash(q.question);

  try {
    const stmt = database.prepare(`
      INSERT INTO questions (hash, subcategory, topic, part, chapter, title, question, options, correct_answer, difficulty, explanation)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      hash,
      q.subcategory,
      q.topic,
      q.part ?? null,
      q.chapter ?? null,
      q.title ?? null,
      q.question,
      JSON.stringify(q.options),
      q.correct_answer,
      q.difficulty || 'medium',
      q.explanation ?? null
    );

    return { success: true, inserted: true, hash };
  } catch (error: any) {
    if (error.message?.includes('UNIQUE constraint failed')) {
      return { success: true, inserted: false, hash, reason: 'duplicate' };
    }
    return { success: false, inserted: false, hash, reason: error.message };
  }
}

/**
 * Check if a question already exists in a category database.
 */
export function questionExists(category: string, questionText: string): boolean {
  const database = getCategoryDatabase(category);
  const hash = computeHash(questionText);
  const result = database.query(`SELECT 1 FROM questions WHERE hash = ?`).get(hash);
  return !!result;
}

/**
 * Get all questions for a specific part/chapter (e.g., an episode).
 */
export function getChapterQuestions(category: string, topic: string, part: number, chapter: number): Question[] {
  const database = getCategoryDatabase(category);
  const rows = database.query(`
    SELECT * FROM questions
    WHERE topic = ? AND part = ? AND chapter = ?
    ORDER BY id
  `).all(topic, part, chapter) as any[];

  return rows.map(row => ({
    ...row,
    category,
    options: JSON.parse(row.options),
    synced_to_mongo: Boolean(row.synced_to_mongo),
  }));
}

/**
 * Get all questions for a topic (e.g., all Friends questions).
 */
export function getTopicQuestions(category: string, topic: string): Question[] {
  const database = getCategoryDatabase(category);
  const rows = database.query(`
    SELECT * FROM questions
    WHERE topic = ?
    ORDER BY part, chapter, id
  `).all(topic) as any[];

  return rows.map(row => ({
    ...row,
    category,
    options: JSON.parse(row.options),
    synced_to_mongo: Boolean(row.synced_to_mongo),
  }));
}

/**
 * Get list of all category database files.
 */
export function getCategoryDatabaseFiles(): string[] {
  if (!existsSync(DATA_DIR)) return [];

  const files = readdirSync(DATA_DIR);
  return files
    .filter(f => f.endsWith('.db') && !f.startsWith('_') && f !== 'registry.db' && f !== 'questions.db')
    .map(f => f.replace('.db', ''));
}

/**
 * Get questions with filters and pagination.
 * If category is specified, queries only that category's database.
 * Otherwise, queries all category databases.
 */
export function getQuestions(filters: {
  category?: string;
  subcategory?: string;
  topic?: string;
  part?: number;
  chapter?: number;
  difficulty?: string;
  limit?: number;
  offset?: number;
}): { questions: Question[]; total: number } {
  const limit = filters.limit || 50;
  const offset = filters.offset || 0;

  // Determine which categories to query
  const categories = filters.category
    ? [filters.category]
    : getCategoryDatabaseFiles();

  let allQuestions: Question[] = [];
  let total = 0;

  for (const category of categories) {
    const database = getCategoryDatabase(category);

    const conditions: string[] = [];
    const params: any[] = [];

    if (filters.subcategory) {
      conditions.push('subcategory = ?');
      params.push(filters.subcategory);
    }
    if (filters.topic) {
      conditions.push('topic = ?');
      params.push(filters.topic);
    }
    if (filters.part) {
      conditions.push('part = ?');
      params.push(filters.part);
    }
    if (filters.chapter) {
      conditions.push('chapter = ?');
      params.push(filters.chapter);
    }
    if (filters.difficulty) {
      conditions.push('difficulty = ?');
      params.push(filters.difficulty);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = database.query(`SELECT COUNT(*) as count FROM questions ${whereClause}`).get(...params) as any;
    total += countResult?.count || 0;

    const rows = database.query(`
      SELECT * FROM questions
      ${whereClause}
      ORDER BY id DESC
    `).all(...params) as any[];

    const questions = rows.map(row => ({
      ...row,
      category,
      options: JSON.parse(row.options),
      synced_to_mongo: Boolean(row.synced_to_mongo),
    }));

    allQuestions.push(...questions);
  }

  // Sort all questions by id desc and apply pagination
  allQuestions.sort((a, b) => (b.id || 0) - (a.id || 0));
  const paginatedQuestions = allQuestions.slice(offset, offset + limit);

  return { questions: paginatedQuestions, total };
}

// ============================================================================
// MongoDB Sync
// ============================================================================

/**
 * Get questions that haven't been synced to MongoDB yet.
 */
export function getUnsyncedQuestions(category?: string, limit: number = 100): Question[] {
  const categories = category ? [category] : getCategoryDatabaseFiles();
  const allQuestions: Question[] = [];

  for (const cat of categories) {
    const database = getCategoryDatabase(cat);
    const rows = database.query(`
      SELECT * FROM questions
      WHERE synced_to_mongo = 0
      ORDER BY id
      LIMIT ?
    `).all(limit - allQuestions.length) as any[];

    for (const row of rows) {
      allQuestions.push({
        ...row,
        category: cat,
        options: JSON.parse(row.options),
        synced_to_mongo: Boolean(row.synced_to_mongo),
      });

      if (allQuestions.length >= limit) break;
    }

    if (allQuestions.length >= limit) break;
  }

  return allQuestions;
}

/**
 * Mark questions as synced to MongoDB.
 */
export function markAsSynced(category: string, ids: number[]): number {
  if (ids.length === 0) return 0;

  const database = getCategoryDatabase(category);
  const placeholders = ids.map(() => '?').join(',');

  const result = database.run(`
    UPDATE questions
    SET synced_to_mongo = 1
    WHERE id IN (${placeholders})
  `, ...ids);

  return result.changes;
}

/**
 * Mark a single question as synced by hash.
 */
export function markAsSyncedByHash(category: string, hash: string): boolean {
  const database = getCategoryDatabase(category);
  const result = database.run(`
    UPDATE questions
    SET synced_to_mongo = 1
    WHERE hash = ?
  `, hash);

  return result.changes > 0;
}

/**
 * Get count of unsynced questions per category.
 */
export function getUnsyncedCounts(): Record<string, number> {
  const categories = getCategoryDatabaseFiles();
  const counts: Record<string, number> = {};

  for (const category of categories) {
    const database = getCategoryDatabase(category);
    const result = database.query(`
      SELECT COUNT(*) as count FROM questions WHERE synced_to_mongo = 0
    `).get() as any;
    counts[category] = result?.count || 0;
  }

  return counts;
}

// ============================================================================
// Statistics
// ============================================================================

export interface Stats {
  total: number;
  byCategory: Record<string, number>;
  bySubcategory: Record<string, number>;
  byTopic: Record<string, { total: number; parts: Record<string, number> }>;
  byDifficulty: { easy: number; medium: number; hard: number };
  generatedAt: string;
}

/**
 * Generate statistics from all category databases.
 */
export function getStats(): Stats {
  const categories = getCategoryDatabaseFiles();

  let total = 0;
  const byCategory: Record<string, number> = {};
  const bySubcategory: Record<string, number> = {};
  const byTopic: Record<string, { total: number; parts: Record<string, number> }> = {};
  const byDifficulty = { easy: 0, medium: 0, hard: 0 };

  for (const category of categories) {
    const database = getCategoryDatabase(category);

    // Count for this category
    const totalResult = database.query(`SELECT COUNT(*) as count FROM questions`).get() as any;
    const categoryTotal = totalResult?.count || 0;
    total += categoryTotal;
    byCategory[category] = categoryTotal;

    // By difficulty
    const difficultyRows = database.query(`
      SELECT difficulty, COUNT(*) as count FROM questions GROUP BY difficulty
    `).all() as any[];

    for (const row of difficultyRows) {
      if (row.difficulty in byDifficulty) {
        byDifficulty[row.difficulty as keyof typeof byDifficulty] += row.count;
      }
    }

    // By subcategory
    const subcategoryRows = database.query(`
      SELECT subcategory, COUNT(*) as count FROM questions GROUP BY subcategory
    `).all() as any[];

    for (const row of subcategoryRows) {
      const key = `${category}:${row.subcategory}`;
      bySubcategory[key] = (bySubcategory[key] || 0) + row.count;
    }

    // By topic and part
    const topicRows = database.query(`
      SELECT topic, part, COUNT(*) as count FROM questions GROUP BY topic, part
    `).all() as any[];

    for (const row of topicRows) {
      const key = `${category}:${row.topic}`;
      if (!byTopic[key]) {
        byTopic[key] = { total: 0, parts: {} };
      }
      byTopic[key].total += row.count;
      if (row.part !== null) {
        byTopic[key].parts[row.part] = (byTopic[key].parts[row.part] || 0) + row.count;
      }
    }
  }

  return {
    total,
    byCategory,
    bySubcategory,
    byTopic,
    byDifficulty,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Get list of all topics with their part info.
 */
export function getTopics(): Array<{ category: string; subcategory: string; slug: string; name: string; parts: number[] }> {
  const categories = getCategoryDatabaseFiles();

  const topicMap: Record<string, { category: string; subcategory: string; parts: number[] }> = {};

  for (const category of categories) {
    const database = getCategoryDatabase(category);

    const rows = database.query(`
      SELECT DISTINCT subcategory, topic, part FROM questions ORDER BY subcategory, topic, part
    `).all() as any[];

    for (const row of rows) {
      const key = `${category}:${row.subcategory}:${row.topic}`;
      if (!topicMap[key]) {
        topicMap[key] = { category, subcategory: row.subcategory, parts: [] };
      }
      if (row.part !== null && !topicMap[key].parts.includes(row.part)) {
        topicMap[key].parts.push(row.part);
      }
    }
  }

  return Object.entries(topicMap).map(([key, data]) => {
    const parts = key.split(':');
    const slug = parts[2];
    return {
      category: data.category,
      subcategory: data.subcategory,
      slug,
      name: slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      parts: data.parts.sort((a, b) => a - b),
    };
  });
}

// ============================================================================
// Import from JSON files (legacy support)
// ============================================================================

/**
 * Import questions from JSON files into the appropriate category databases.
 * Scans data/tv-shows/ folder and imports to tv-shows.db
 */
export function importFromFiles(): { inserted: number; skipped: number; errors: number } {
  const tvDataPath = join(DATA_DIR, 'tv-shows');
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  function scanDir(dir: string): string[] {
    const results: string[] = [];
    if (!existsSync(dir)) return results;

    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...scanDir(fullPath));
      } else if (entry.name.startsWith('questions_') && entry.name.endsWith('.json')) {
        results.push(fullPath);
      }
    }
    return results;
  }

  const files = scanDir(tvDataPath);

  for (const file of files) {
    const match = file.match(/tv-shows\/([^/]+)\/season-(\d+)\/episode-(\d+)/);
    if (!match) continue;

    const [, topic, partStr, chapterStr] = match;
    const part = parseInt(partStr);
    const chapter = parseInt(chapterStr);

    try {
      const content = readFileSync(file, 'utf8');
      const data = JSON.parse(content);

      if (!data.questions || !Array.isArray(data.questions)) continue;

      for (const q of data.questions) {
        if (!q.question || !q.options || !q.correct_answer) {
          errors++;
          continue;
        }

        const result = insertQuestion({
          category: 'tv-shows',
          subcategory: 'sitcoms', // Default for legacy imports
          topic,
          part,
          chapter,
          title: data.title,
          question: q.question,
          options: q.options,
          correct_answer: q.correct_answer,
          difficulty: q.difficulty || 'medium',
          explanation: q.explanation,
        });

        if (result.inserted) inserted++;
        else if (result.reason === 'duplicate') skipped++;
        else errors++;
      }
    } catch (e) {
      errors++;
    }
  }

  return { inserted, skipped, errors };
}

// ============================================================================
// Export
// ============================================================================

export default {
  getCategoryDatabase,
  getCategoryDatabaseFiles,
  initDatabase,
  closeDatabase,
  closeCategoryDatabase,
  withTransaction,
  computeHash,
  insertQuestion,
  questionExists,
  getChapterQuestions,
  getTopicQuestions,
  getQuestions,
  getUnsyncedQuestions,
  markAsSynced,
  markAsSyncedByHash,
  getUnsyncedCounts,
  getStats,
  getTopics,
  importFromFiles,
};

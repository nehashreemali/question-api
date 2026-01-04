/**
 * Registry Database
 *
 * Central database for categories, subcategories, topics, and aggregated stats.
 * This is the "index" that tells us what content exists across all category databases.
 */

import { Database } from 'bun:sqlite';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(import.meta.dir, '..', '..', 'data');
const REGISTRY_PATH = join(DATA_DIR, 'registry.db');

let db: Database | null = null;

/**
 * Configure database with safety PRAGMAs.
 * Called once per connection to ensure durability and performance.
 */
function configureDatabase(database: Database): void {
  // WAL mode for better concurrency and crash recovery
  database.run('PRAGMA journal_mode = WAL');

  // FULL sync ensures data reaches disk before commit completes
  database.run('PRAGMA synchronous = FULL');

  // Wait up to 30 seconds if database is locked
  database.run('PRAGMA busy_timeout = 30000');
}

// ============================================================================
// Initialization
// ============================================================================

export function initRegistry(): Database {
  if (db) return db;

  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  db = new Database(REGISTRY_PATH);

  // Apply hardening PRAGMAs (WAL, synchronous=FULL, busy_timeout)
  configureDatabase(db);

  // Categories table
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      slug TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT
    )
  `);

  // Subcategories table
  db.run(`
    CREATE TABLE IF NOT EXISTS subcategories (
      category TEXT NOT NULL,
      slug TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      PRIMARY KEY (category, slug),
      FOREIGN KEY (category) REFERENCES categories(slug)
    )
  `);

  // Topics table
  db.run(`
    CREATE TABLE IF NOT EXISTS topics (
      category TEXT NOT NULL,
      subcategory TEXT NOT NULL,
      slug TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      total_parts INTEGER DEFAULT 0,
      source_type TEXT,
      source_url TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (category, subcategory, slug),
      FOREIGN KEY (category, subcategory) REFERENCES subcategories(category, slug)
    )
  `);

  // Stats table (aggregated from category databases)
  db.run(`
    CREATE TABLE IF NOT EXISTS stats (
      category TEXT NOT NULL,
      subcategory TEXT NOT NULL,
      topic TEXT NOT NULL,
      part INTEGER,
      total_questions INTEGER DEFAULT 0,
      easy_count INTEGER DEFAULT 0,
      medium_count INTEGER DEFAULT 0,
      hard_count INTEGER DEFAULT 0,
      last_updated TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (category, subcategory, topic, part)
    )
  `);

  // Create indexes
  db.run(`CREATE INDEX IF NOT EXISTS idx_topics_category ON topics(category)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_topics_subcategory ON topics(category, subcategory)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_stats_topic ON stats(category, subcategory, topic)`);

  return db;
}

export function closeRegistry(): void {
  if (db) {
    db.close();
    db = null;
  }
}

// ============================================================================
// Categories
// ============================================================================

export interface Category {
  slug: string;
  name: string;
  description?: string;
  icon?: string;
}

export function getCategories(): Category[] {
  const database = initRegistry();
  return database.query(`SELECT * FROM categories ORDER BY name`).all() as Category[];
}

export function getCategory(slug: string): Category | null {
  const database = initRegistry();
  return database.query(`SELECT * FROM categories WHERE slug = ?`).get(slug) as Category | null;
}

/**
 * Ensure a category exists, creating it if necessary.
 * Returns the category (existing or newly created).
 */
export function ensureCategory(category: Omit<Category, 'description'> & { description?: string }): Category {
  const database = initRegistry();
  const existing = getCategory(category.slug);
  if (existing) return existing;

  database.run(
    `INSERT INTO categories (slug, name, description, icon) VALUES (?, ?, ?, ?)`,
    category.slug, category.name, category.description || null, category.icon || null
  );

  return getCategory(category.slug)!;
}

// ============================================================================
// Subcategories
// ============================================================================

export interface Subcategory {
  category: string;
  slug: string;
  name: string;
  description?: string;
}

export function getSubcategories(category?: string): Subcategory[] {
  const database = initRegistry();
  if (category) {
    return database.query(`SELECT * FROM subcategories WHERE category = ? ORDER BY name`).all(category) as Subcategory[];
  }
  return database.query(`SELECT * FROM subcategories ORDER BY category, name`).all() as Subcategory[];
}

export function getSubcategory(category: string, slug: string): Subcategory | null {
  const database = initRegistry();
  return database.query(`SELECT * FROM subcategories WHERE category = ? AND slug = ?`).get(category, slug) as Subcategory | null;
}

/**
 * Ensure a subcategory exists, creating it if necessary.
 * Also ensures the parent category exists.
 * Returns the subcategory (existing or newly created).
 */
export function ensureSubcategory(
  subcategory: Omit<Subcategory, 'description'> & { description?: string },
  parentCategory?: Omit<Category, 'description'> & { description?: string }
): Subcategory {
  const database = initRegistry();

  // Ensure parent category exists
  if (parentCategory) {
    ensureCategory(parentCategory);
  }

  const existing = getSubcategory(subcategory.category, subcategory.slug);
  if (existing) return existing;

  database.run(
    `INSERT INTO subcategories (category, slug, name, description) VALUES (?, ?, ?, ?)`,
    subcategory.category, subcategory.slug, subcategory.name, subcategory.description || null
  );

  return getSubcategory(subcategory.category, subcategory.slug)!;
}

// ============================================================================
// Topics
// ============================================================================

export interface Topic {
  category: string;
  subcategory: string;
  slug: string;
  name: string;
  description?: string;
  total_parts?: number;
  source_type?: string;
  source_url?: string;
  created_at?: string;
}

export function getTopics(category?: string, subcategory?: string): Topic[] {
  const database = initRegistry();

  if (category && subcategory) {
    return database.query(`
      SELECT * FROM topics WHERE category = ? AND subcategory = ? ORDER BY name
    `).all(category, subcategory) as Topic[];
  }
  if (category) {
    return database.query(`
      SELECT * FROM topics WHERE category = ? ORDER BY subcategory, name
    `).all(category) as Topic[];
  }
  return database.query(`SELECT * FROM topics ORDER BY category, subcategory, name`).all() as Topic[];
}

export function getTopic(category: string, subcategory: string, slug: string): Topic | null {
  const database = initRegistry();
  return database.query(`
    SELECT * FROM topics WHERE category = ? AND subcategory = ? AND slug = ?
  `).get(category, subcategory, slug) as Topic | null;
}

/**
 * Ensure a topic exists, creating it if necessary.
 * Also ensures the parent category and subcategory exist.
 * Returns the topic (existing or newly created).
 */
export function ensureTopic(
  topic: Omit<Topic, 'created_at'>,
  parents?: {
    category?: Omit<Category, 'description'> & { description?: string };
    subcategory?: Omit<Subcategory, 'description'> & { description?: string };
  }
): Topic {
  const database = initRegistry();

  // Ensure parent hierarchy exists
  if (parents?.category) {
    ensureCategory(parents.category);
  }
  if (parents?.subcategory) {
    ensureSubcategory(parents.subcategory);
  }

  const existing = getTopic(topic.category, topic.subcategory, topic.slug);
  if (existing) return existing;

  database.run(`
    INSERT INTO topics (category, subcategory, slug, name, description, total_parts, source_type, source_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, topic.category, topic.subcategory, topic.slug, topic.name, topic.description || null,
     topic.total_parts || 0, topic.source_type || null, topic.source_url || null);

  return getTopic(topic.category, topic.subcategory, topic.slug)!;
}

export function upsertTopic(topic: Topic): void {
  const database = initRegistry();
  database.run(`
    INSERT INTO topics (category, subcategory, slug, name, description, total_parts, source_type, source_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (category, subcategory, slug) DO UPDATE SET
      name = excluded.name,
      description = excluded.description,
      total_parts = excluded.total_parts,
      source_type = excluded.source_type,
      source_url = excluded.source_url
  `, topic.category, topic.subcategory, topic.slug, topic.name, topic.description || null,
     topic.total_parts || 0, topic.source_type || null, topic.source_url || null);
}

// ============================================================================
// Stats
// ============================================================================

export interface TopicStats {
  category: string;
  subcategory: string;
  topic: string;
  part: number | null;
  total_questions: number;
  easy_count: number;
  medium_count: number;
  hard_count: number;
  last_updated: string;
}

export function getStats(category?: string, subcategory?: string, topic?: string): TopicStats[] {
  const database = initRegistry();

  const conditions: string[] = [];
  const params: any[] = [];

  if (category) {
    conditions.push('category = ?');
    params.push(category);
  }
  if (subcategory) {
    conditions.push('subcategory = ?');
    params.push(subcategory);
  }
  if (topic) {
    conditions.push('topic = ?');
    params.push(topic);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  return database.query(`
    SELECT * FROM stats ${whereClause} ORDER BY category, subcategory, topic, part
  `).all(...params) as TopicStats[];
}

export function updateStats(stats: TopicStats): void {
  const database = initRegistry();
  database.run(`
    INSERT INTO stats (category, subcategory, topic, part, total_questions, easy_count, medium_count, hard_count, last_updated)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT (category, subcategory, topic, part) DO UPDATE SET
      total_questions = excluded.total_questions,
      easy_count = excluded.easy_count,
      medium_count = excluded.medium_count,
      hard_count = excluded.hard_count,
      last_updated = datetime('now')
  `, stats.category, stats.subcategory, stats.topic, stats.part,
     stats.total_questions, stats.easy_count, stats.medium_count, stats.hard_count);
}

export function getGlobalStats(): {
  total: number;
  byCategory: Record<string, number>;
  byDifficulty: { easy: number; medium: number; hard: number };
} {
  const database = initRegistry();

  // Aggregate from stats table
  const totals = database.query(`
    SELECT
      SUM(total_questions) as total,
      SUM(easy_count) as easy,
      SUM(medium_count) as medium,
      SUM(hard_count) as hard
    FROM stats
  `).get() as any;

  const categoryTotals = database.query(`
    SELECT category, SUM(total_questions) as total
    FROM stats
    GROUP BY category
  `).all() as any[];

  const byCategory: Record<string, number> = {};
  for (const row of categoryTotals) {
    byCategory[row.category] = row.total || 0;
  }

  return {
    total: totals?.total || 0,
    byCategory,
    byDifficulty: {
      easy: totals?.easy || 0,
      medium: totals?.medium || 0,
      hard: totals?.hard || 0,
    },
  };
}

// ============================================================================
// Full Hierarchy
// ============================================================================

export interface CategoryWithChildren extends Category {
  subcategories: SubcategoryWithTopics[];
}

export interface SubcategoryWithTopics extends Subcategory {
  topics: Topic[];
}

export function getFullHierarchy(): CategoryWithChildren[] {
  const database = initRegistry();

  const categories = getCategories();
  const allSubcategories = getSubcategories();
  const allTopics = getTopics();

  return categories.map(cat => ({
    ...cat,
    subcategories: allSubcategories
      .filter(sub => sub.category === cat.slug)
      .map(sub => ({
        ...sub,
        topics: allTopics.filter(t => t.category === cat.slug && t.subcategory === sub.slug),
      })),
  }));
}

// ============================================================================
// Export
// ============================================================================

export default {
  initRegistry,
  closeRegistry,
  getCategories,
  getCategory,
  ensureCategory,
  getSubcategories,
  getSubcategory,
  ensureSubcategory,
  getTopics,
  getTopic,
  ensureTopic,
  upsertTopic,
  getStats,
  updateStats,
  getGlobalStats,
  getFullHierarchy,
};

/**
 * Migration Script: Migrate from old questions.db to per-category databases
 *
 * This script:
 * 1. Reads questions from the old questions.db
 * 2. Creates per-category databases (tv-shows.db, etc.)
 * 3. Inserts questions with the new schema (subcategory, topic, part, chapter)
 *
 * Usage: bun scripts/migrate-to-multi-db.ts
 */

import { Database } from 'bun:sqlite';
import { existsSync } from 'fs';
import { join } from 'path';
import { insertQuestion, getStats, getCategoryDatabaseFiles } from '../src/lib/database';
import { initRegistry } from '../src/lib/registry';

const DATA_DIR = join(import.meta.dir, '..', 'data');
const OLD_DB_PATH = join(DATA_DIR, 'questions.db');

interface OldQuestion {
  id: number;
  hash: string;
  category: string;
  topic: string;
  part: number | null;
  chapter: number | null;
  title: string | null;
  question: string;
  options: string;
  correct_answer: string;
  difficulty: string;
  explanation: string | null;
  created_at: string;
}

// Map topics to subcategories
const TOPIC_SUBCATEGORY_MAP: Record<string, string> = {
  // Sitcoms
  'friends': 'sitcoms',
  'the-big-bang-theory': 'sitcoms',
  'how-i-met-your-mother': 'sitcoms',
  'the-office': 'sitcoms',
  'brooklyn-nine-nine': 'sitcoms',
  'parks-and-recreation': 'sitcoms',
  'seinfeld': 'sitcoms',

  // Drama
  'breaking-bad': 'drama',
  'game-of-thrones': 'drama',
  'the-wire': 'drama',
  'the-sopranos': 'drama',
  'mad-men': 'drama',

  // Sci-Fi
  'stranger-things': 'sci-fi',
  'black-mirror': 'sci-fi',
  'westworld': 'sci-fi',
  'the-expanse': 'sci-fi',

  // Hindu Epics
  'mahabharata': 'hindu',
  'ramayana': 'hindu',
  'bhagavad-gita': 'hindu',

  // Greek Epics
  'iliad': 'greek',
  'odyssey': 'greek',

  // Roman Epics
  'aeneid': 'roman',

  // Mythology
  'greek-gods': 'greek',
  'norse-gods': 'norse',
  'hindu-gods': 'hindu',
  'egyptian-gods': 'egyptian',

  // Sports
  'cricket-world-cup': 'cricket',
  'ipl': 'cricket',
  'premier-league': 'football',
  'world-cup': 'football',
  'olympics': 'olympics',
};

function getSubcategory(category: string, topic: string): string {
  // Check if we have a specific mapping
  if (TOPIC_SUBCATEGORY_MAP[topic]) {
    return TOPIC_SUBCATEGORY_MAP[topic];
  }

  // Default subcategories by category
  const defaults: Record<string, string> = {
    'tv-shows': 'sitcoms',
    'movies': 'drama',
    'epics': 'hindu',
    'mythology': 'greek',
    'sports': 'cricket',
    'science': 'physics',
    'history': 'modern',
  };

  return defaults[category] || 'general';
}

async function main() {
  console.log('🔄 Migrating to multi-database architecture...\n');

  // Initialize registry
  initRegistry();

  // Check if old database exists
  if (!existsSync(OLD_DB_PATH)) {
    console.log('❌ Old database not found at:', OLD_DB_PATH);
    console.log('   Nothing to migrate. The new per-category databases will be created when you add questions.');
    return;
  }

  // Open old database
  const oldDb = new Database(OLD_DB_PATH);

  // Check if it has the old schema
  const tableInfo = oldDb.query(`PRAGMA table_info(questions)`).all() as any[];
  const hasCategory = tableInfo.some(col => col.name === 'category');
  const hasTopic = tableInfo.some(col => col.name === 'topic');

  if (!hasCategory || !hasTopic) {
    console.log('❌ Old database has incompatible schema.');
    console.log('   Expected: category, topic, part, chapter');
    console.log('   Run the old migration first if needed.');
    oldDb.close();
    return;
  }

  // Get all questions from old database
  const questions = oldDb.query(`SELECT * FROM questions ORDER BY id`).all() as OldQuestion[];
  console.log(`Found ${questions.length} questions in old database\n`);

  if (questions.length === 0) {
    console.log('No questions to migrate.');
    oldDb.close();
    return;
  }

  let totalInserted = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  const categoryCounts: Record<string, number> = {};

  for (const q of questions) {
    try {
      const options = JSON.parse(q.options);
      const subcategory = getSubcategory(q.category, q.topic);

      const result = insertQuestion({
        category: q.category,
        subcategory,
        topic: q.topic,
        part: q.part,
        chapter: q.chapter,
        title: q.title,
        question: q.question,
        options,
        correct_answer: q.correct_answer,
        difficulty: q.difficulty as 'easy' | 'medium' | 'hard',
        explanation: q.explanation,
      });

      if (result.inserted) {
        totalInserted++;
        categoryCounts[q.category] = (categoryCounts[q.category] || 0) + 1;
      } else if (result.reason === 'duplicate') {
        totalSkipped++;
      } else {
        totalErrors++;
        console.log(`❌ Error: ${result.reason} for question ${q.id}`);
      }
    } catch (error) {
      totalErrors++;
      console.log(`❌ Error processing question ${q.id}: ${error}`);
    }
  }

  oldDb.close();

  console.log('\n' + '─'.repeat(50));
  console.log(`✅ Migration complete!`);
  console.log(`   Inserted: ${totalInserted}`);
  console.log(`   Skipped:  ${totalSkipped} (duplicates)`);
  console.log(`   Errors:   ${totalErrors}`);

  console.log('\n📁 Questions by category:');
  for (const [category, count] of Object.entries(categoryCounts)) {
    console.log(`   ${category}: ${count}`);
  }

  // Show database files created
  console.log('\n📦 Database files created:');
  const dbFiles = getCategoryDatabaseFiles();
  for (const file of dbFiles) {
    const stats = getStats();
    console.log(`   data/${file}.db: ${stats.byCategory[file] || 0} questions`);
  }

  // Show final stats
  const stats = getStats();
  console.log(`\n📊 Total: ${stats.total} questions across ${dbFiles.length} databases`);
  console.log(`   Easy: ${stats.byDifficulty.easy}, Medium: ${stats.byDifficulty.medium}, Hard: ${stats.byDifficulty.hard}`);
}

main();

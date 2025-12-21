/**
 * Migration Script: Import existing questions to SQLite database
 *
 * Scans all question JSON files and imports them into the central database.
 * Duplicates are automatically skipped via hash checking.
 *
 * Usage: bun scripts/migrate-to-sqlite.ts
 */

import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { initDatabase, insertQuestion, getStats } from '../src/lib/database';

const TV_DATA_PATH = join(import.meta.dir, '..', 'data', 'tv-shows');

interface QuestionFile {
  show?: string;
  season?: number;
  episode?: number;
  title?: string;
  questions: Array<{
    question: string;
    options: string[];
    correct_answer: string;
    difficulty?: string;
    explanation?: string;
  }>;
}

async function findQuestionFiles(dir: string): Promise<string[]> {
  const results: string[] = [];

  if (!existsSync(dir)) return results;

  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      const subResults = await findQuestionFiles(fullPath);
      results.push(...subResults);
    } else if (entry.name.startsWith('questions_') && entry.name.endsWith('.json')) {
      results.push(fullPath);
    }
  }

  return results;
}

function parsePathInfo(filePath: string): { show: string; season: number; episode: number } | null {
  // Path format: .../tv-shows/{show}/season-{N}/episode-{N}/questions/questions_*.json
  const match = filePath.match(/tv-shows\/([^/]+)\/season-(\d+)\/episode-(\d+)/);
  if (match) {
    return {
      show: match[1],
      season: parseInt(match[2]),
      episode: parseInt(match[3]),
    };
  }
  return null;
}

async function main() {
  console.log('🔄 Migrating questions to SQLite database...\n');

  // Initialize database
  initDatabase();

  // Find all question files
  const files = await findQuestionFiles(TV_DATA_PATH);
  console.log(`Found ${files.length} question files\n`);

  let totalInserted = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const file of files) {
    const pathInfo = parsePathInfo(file);
    if (!pathInfo) {
      console.log(`⚠️  Skipping (can't parse path): ${file}`);
      continue;
    }

    try {
      const content = readFileSync(file, 'utf8');
      const data: QuestionFile = JSON.parse(content);

      if (!data.questions || !Array.isArray(data.questions)) {
        console.log(`⚠️  Skipping (no questions array): ${file}`);
        continue;
      }

      let fileInserted = 0;
      let fileSkipped = 0;

      for (const q of data.questions) {
        if (!q.question || !q.options || !q.correct_answer) {
          totalErrors++;
          continue;
        }

        const result = insertQuestion({
          show: pathInfo.show,
          season: pathInfo.season,
          episode: pathInfo.episode,
          episode_title: data.title,
          question: q.question,
          options: q.options,
          correct_answer: q.correct_answer,
          difficulty: (q.difficulty as any) || 'medium',
          explanation: q.explanation,
        });

        if (result.inserted) {
          fileInserted++;
          totalInserted++;
        } else if (result.reason === 'duplicate') {
          fileSkipped++;
          totalSkipped++;
        } else {
          totalErrors++;
        }
      }

      const showName = pathInfo.show.replace(/-/g, ' ');
      console.log(`📁 ${showName} S${pathInfo.season}E${pathInfo.episode}: +${fileInserted} (${fileSkipped} duplicates)`);

    } catch (error) {
      console.log(`❌ Error processing ${file}: ${error}`);
      totalErrors++;
    }
  }

  console.log('\n' + '─'.repeat(50));
  console.log(`✅ Migration complete!`);
  console.log(`   Inserted: ${totalInserted}`);
  console.log(`   Skipped:  ${totalSkipped} (duplicates)`);
  console.log(`   Errors:   ${totalErrors}`);

  // Show final stats
  const stats = getStats();
  console.log(`\n📊 Database now contains ${stats.total} questions`);
  console.log(`   Shows: ${Object.keys(stats.byShow).length}`);
  console.log(`   Easy: ${stats.byDifficulty.easy}, Medium: ${stats.byDifficulty.medium}, Hard: ${stats.byDifficulty.hard}`);
}

main();

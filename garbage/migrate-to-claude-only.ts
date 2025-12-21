/**
 * Migration script: Remove Groq prefixes and convert to log format
 *
 * - Renames groq_questions_*.json → questions_*.json
 * - Converts groq_raw_questions.json → raw_questions.log (one question per line)
 */

import { readdir, readFile, writeFile, rename, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const DATA_DIR = join(import.meta.dir, '..', 'data', 'tv-shows');

async function findQuestionsFolders(dir: string): Promise<string[]> {
  const results: string[] = [];

  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        if (entry.name === 'questions') {
          results.push(fullPath);
        } else {
          const subResults = await findQuestionsFolders(fullPath);
          results.push(...subResults);
        }
      }
    }
  } catch (err) {
    // Directory doesn't exist or can't be read
  }

  return results;
}

async function migrateFolder(questionsDir: string): Promise<void> {
  const files = await readdir(questionsDir);

  for (const file of files) {
    const filePath = join(questionsDir, file);

    // Rename groq_questions_*.json → questions_*.json
    if (file.startsWith('groq_questions_') && file.endsWith('.json')) {
      const newName = file.replace('groq_questions_', 'questions_');
      const newPath = join(questionsDir, newName);
      await rename(filePath, newPath);
      console.log(`  ✓ ${file} → ${newName}`);
    }

    // Convert groq_raw_questions.json → raw_questions.log
    if (file === 'groq_raw_questions.json') {
      try {
        const content = await readFile(filePath, 'utf-8');
        const questions: string[] = JSON.parse(content);
        const logContent = questions.join('\n') + '\n';
        const logPath = join(questionsDir, 'raw_questions.log');
        await writeFile(logPath, logContent);
        await unlink(filePath);
        console.log(`  ✓ ${file} → raw_questions.log (${questions.length} questions)`);
      } catch (err) {
        console.error(`  ✗ Error converting ${file}: ${err}`);
      }
    }

    // Also handle claude_code_raw_questions.json if it exists
    if (file === 'claude_code_raw_questions.json') {
      try {
        const content = await readFile(filePath, 'utf-8');
        const questions: string[] = JSON.parse(content);
        const logPath = join(questionsDir, 'raw_questions.log');

        // Append to existing log or create new
        let existingQuestions: string[] = [];
        if (existsSync(logPath)) {
          const existing = await readFile(logPath, 'utf-8');
          existingQuestions = existing.trim().split('\n').filter(q => q.trim());
        }

        const allQuestions = [...new Set([...existingQuestions, ...questions])];
        await writeFile(logPath, allQuestions.join('\n') + '\n');
        await unlink(filePath);
        console.log(`  ✓ ${file} merged into raw_questions.log`);
      } catch (err) {
        console.error(`  ✗ Error converting ${file}: ${err}`);
      }
    }

    // Rename claude_code_questions_*.json → questions_*.json
    if (file.startsWith('claude_code_questions_') && file.endsWith('.json')) {
      const newName = file.replace('claude_code_questions_', 'questions_');
      const newPath = join(questionsDir, newName);
      await rename(filePath, newPath);
      console.log(`  ✓ ${file} → ${newName}`);
    }
  }
}

async function main() {
  console.log('🔄 Migrating to Claude-only structure...\n');

  const questionsFolders = await findQuestionsFolders(DATA_DIR);
  console.log(`Found ${questionsFolders.length} question folders\n`);

  for (const folder of questionsFolders) {
    const relativePath = folder.replace(DATA_DIR + '/', '');
    console.log(`📁 ${relativePath}/`);
    await migrateFolder(folder);
    console.log('');
  }

  console.log('─'.repeat(50));
  console.log('✅ Migration complete!');
}

main();

import { readdir, readFile, writeFile, mkdir, unlink, stat } from 'fs/promises';
import { join, dirname } from 'path';

interface Question {
  question: string;
  options: string[];
  correct_answer: string;
  difficulty: string;
  explanation: string;
  topic?: {
    type: string;
    show?: string;
    season?: number;
    episode?: number;
    title?: string;
    category?: string;
    subcategory?: string;
  };
  generatedBy?: string;
  generatedAt?: string;
}

interface QuestionsFile {
  show?: string;
  season?: number;
  episode?: number;
  title?: string;
  source?: string;
  generatedAt?: string;
  questionCount?: number;
  questions: Question[];
}

const DATA_DIR = join(import.meta.dir, '..', 'data');

async function findQuestionFiles(dir: string): Promise<string[]> {
  const results: string[] = [];

  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip the questions subfolder if it already exists
        if (entry.name !== 'questions') {
          const subResults = await findQuestionFiles(fullPath);
          results.push(...subResults);
        }
      } else if (entry.name === 'questions.json' || entry.name === 'rawQuestions.json') {
        results.push(fullPath);
      }
    }
  } catch (err) {
    // Directory doesn't exist or can't be read
  }

  return results;
}

function formatTimestamp(isoDate: string): string {
  const date = new Date(isoDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${day}_${month}_${year}_${hours}${minutes}${seconds}`;
}

function extractTopicFromPath(filePath: string): { type: string; show?: string; season?: number; episode?: number } {
  // Example: data/tv-shows/friends/season-1/episode-1/questions.json
  const parts = filePath.split('/');
  const tvShowsIndex = parts.indexOf('tv-shows');

  if (tvShowsIndex !== -1) {
    const show = parts[tvShowsIndex + 1];
    const seasonMatch = parts[tvShowsIndex + 2]?.match(/season-(\d+)/);
    const episodeMatch = parts[tvShowsIndex + 3]?.match(/episode-(\d+)/);

    return {
      type: 'tv-show',
      show,
      season: seasonMatch ? parseInt(seasonMatch[1]) : undefined,
      episode: episodeMatch ? parseInt(episodeMatch[1]) : undefined,
    };
  }

  return { type: 'unknown' };
}

async function migrateFile(filePath: string): Promise<void> {
  const dir = dirname(filePath);
  const fileName = filePath.split('/').pop()!;
  const questionsDir = join(dir, 'questions');

  // Create questions subfolder
  await mkdir(questionsDir, { recursive: true });

  const content = await readFile(filePath, 'utf-8');
  const topic = extractTopicFromPath(filePath);

  if (fileName === 'questions.json') {
    // Parse and enhance questions with topic info
    const data: QuestionsFile = JSON.parse(content);
    const timestamp = data.generatedAt ? formatTimestamp(data.generatedAt) : formatTimestamp(new Date().toISOString());

    // Add topic info to each question
    const enhancedQuestions = data.questions.map(q => ({
      ...q,
      topic: {
        type: topic.type,
        show: data.show || topic.show,
        season: data.season || topic.season,
        episode: data.episode || topic.episode,
        title: data.title,
      },
      generatedBy: 'groq',
      generatedAt: data.generatedAt,
    }));

    const enhancedData = {
      ...data,
      questions: enhancedQuestions,
    };

    const newFileName = `groq_questions_${timestamp}.json`;
    const newPath = join(questionsDir, newFileName);

    await writeFile(newPath, JSON.stringify(enhancedData, null, 2));
    console.log(`  ✓ ${fileName} → questions/${newFileName}`);

  } else if (fileName === 'rawQuestions.json') {
    // Just move rawQuestions to the new location with new name
    const newPath = join(questionsDir, 'groq_raw_questions.json');
    await writeFile(newPath, content);
    console.log(`  ✓ ${fileName} → questions/groq_raw_questions.json`);
  }

  // Delete original file
  await unlink(filePath);
}

async function main() {
  console.log('🔄 Migrating question files to questions/ subfolder...\n');

  const files = await findQuestionFiles(DATA_DIR);
  console.log(`Found ${files.length} files to migrate\n`);

  // Group files by directory
  const byDir = new Map<string, string[]>();
  for (const file of files) {
    const dir = dirname(file);
    if (!byDir.has(dir)) {
      byDir.set(dir, []);
    }
    byDir.get(dir)!.push(file);
  }

  let migrated = 0;
  let errors = 0;

  for (const [dir, dirFiles] of byDir) {
    const relativePath = dir.replace(DATA_DIR + '/', '');
    console.log(`📁 ${relativePath}/`);

    for (const file of dirFiles) {
      try {
        await migrateFile(file);
        migrated++;
      } catch (err) {
        console.error(`  ✗ Error migrating ${file}: ${err}`);
        errors++;
      }
    }
    console.log('');
  }

  console.log('─'.repeat(50));
  console.log(`✅ Migration complete: ${migrated} files migrated, ${errors} errors`);
}

main();

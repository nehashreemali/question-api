/**
 * ❌ DEPRECATED – DO NOT USE
 *
 * This script is deprecated. Use scripts/export-prod-db.ts instead.
 * That script exports approved questions to prod/questions.db with the correct schema.
 */
throw new Error('DEPRECATED: Use scripts/export-prod-db.ts instead');

import { Database } from "bun:sqlite";
import { readdirSync, unlinkSync, existsSync } from "fs";
import { join } from "path";

const DATA_DIR = join(import.meta.dir, "../data");
const OUTPUT_FILE = join(DATA_DIR, "questions.db");
const EXCLUDED_FILES = ["registry.db", "questions.db"];

const createQuestionsTable = (db: Database) => {
  db.run(`
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
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
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
};

const createIndexes = (db: Database) => {
  db.run("CREATE INDEX idx_category ON questions(category)");
  db.run("CREATE INDEX idx_subcategory ON questions(category, subcategory)");
  db.run("CREATE INDEX idx_topic ON questions(category, subcategory, topic)");
  db.run("CREATE INDEX idx_part ON questions(category, subcategory, topic, part)");
  db.run("CREATE INDEX idx_chapter ON questions(category, subcategory, topic, part, chapter)");
  db.run("CREATE INDEX idx_difficulty ON questions(difficulty)");
  db.run("CREATE INDEX idx_hash ON questions(hash)");
};

const getSourceDatabases = (): string[] => {
  const files = readdirSync(DATA_DIR);
  const dbFiles = files.filter(
    (f) => f.endsWith(".db") && !EXCLUDED_FILES.includes(f)
  );
  return dbFiles.map((f) => join(DATA_DIR, f));
};

interface IQuestion {
  hash: string;
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
  created_at: string;
}

const mergeDatabase = ({
  source,
  target,
  category,
}: {
  source: Database;
  target: Database;
  category: string;
}): number => {
  const questions = source
    .query(
      `
    SELECT hash, subcategory, topic, part, chapter, title,
           question, options, correct_answer, difficulty, explanation, created_at
    FROM questions
  `
    )
    .all() as IQuestion[];

  const insert = target.prepare(`
    INSERT OR IGNORE INTO questions
      (hash, category, subcategory, topic, part, chapter, title, question, options, correct_answer, difficulty, explanation, created_at)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let inserted = 0;
  for (const q of questions) {
    const result = insert.run(
      q.hash,
      category,
      q.subcategory,
      q.topic,
      q.part,
      q.chapter,
      q.title,
      q.question,
      q.options,
      q.correct_answer,
      q.difficulty,
      q.explanation,
      q.created_at
    );
    if (result.changes > 0) {
      inserted++;
    }
  }

  return inserted;
};

const main = () => {
  console.log("Merging question databases...\n");

  if (existsSync(OUTPUT_FILE)) {
    unlinkSync(OUTPUT_FILE);
    console.log("Removed existing questions.db");
  }

  const targetDb = new Database(OUTPUT_FILE);
  createQuestionsTable(targetDb);

  const sourceDbs = getSourceDatabases();
  console.log(`Found ${sourceDbs.length} source database(s):\n`);

  let totalInserted = 0;

  for (const sourcePath of sourceDbs) {
    const fileName = sourcePath.split("/").pop() as string;
    const category = fileName.replace(".db", "");
    const sourceDb = new Database(sourcePath, { readonly: true });

    const countBefore = sourceDb.query("SELECT COUNT(*) as count FROM questions").get() as { count: number };
    const inserted = mergeDatabase({ source: sourceDb, target: targetDb, category });

    console.log(`  ${fileName} (${category}): ${countBefore.count} questions, ${inserted} inserted`);
    totalInserted += inserted;

    sourceDb.close();
  }

  console.log("\nCreating indexes...");
  createIndexes(targetDb);

  const finalCount = targetDb.query("SELECT COUNT(*) as count FROM questions").get() as { count: number };
  targetDb.close();

  console.log(`\nDone! Created questions.db with ${finalCount.count} questions`);
  console.log(`Output: ${OUTPUT_FILE}`);
};

main();

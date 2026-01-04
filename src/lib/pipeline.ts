/**
 * Pipeline tracking library
 * Manages content_tracking table in pipeline.db
 */

import Database from 'bun:sqlite';
import { readdirSync, statSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'data');
const GENERATION_DIR = join(process.cwd(), 'generation');

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

function getDb(): Database {
  if (!db) {
    db = new Database(join(DATA_DIR, 'pipeline.db'));
    // Apply hardening PRAGMAs (WAL, synchronous=FULL, busy_timeout)
    configureDatabase(db);
  }
  return db;
}

// Get question counts from a category database
function getQuestionCounts(categoryDb: string): Map<string, { total: number; easy: number; medium: number; hard: number }> {
  const counts = new Map();
  const dbPath = join(DATA_DIR, categoryDb);

  if (!existsSync(dbPath)) return counts;

  const catDb = new Database(dbPath, { readonly: true });
  try {
    const rows = catDb.query(`
      SELECT topic, part, chapter,
             COUNT(*) as total,
             SUM(CASE WHEN difficulty = 'easy' THEN 1 ELSE 0 END) as easy,
             SUM(CASE WHEN difficulty = 'medium' THEN 1 ELSE 0 END) as medium,
             SUM(CASE WHEN difficulty = 'hard' THEN 1 ELSE 0 END) as hard
      FROM questions
      GROUP BY topic, part, chapter
    `).all() as any[];

    for (const row of rows) {
      const key = `${row.topic}|${row.part}|${row.chapter}`;
      counts.set(key, { total: row.total, easy: row.easy, medium: row.medium, hard: row.hard });
    }
  } catch (e) {
    // Table might not exist
  }
  catDb.close();
  return counts;
}

// Upsert content tracking record
function upsertContent(
  pipelineDb: Database,
  category: string, subcategory: string, topic: string,
  part: number | null, partName: string | null,
  chapter: number | null, chapterTitle: string,
  sourceType: string, sourceFile: string,
  wordCount: number, questionCounts: { total: number; easy: number; medium: number; hard: number }
) {
  const status = questionCounts.total > 0 ? 'completed' : 'pending';

  pipelineDb.run(`
    INSERT INTO content_tracking (
      category, subcategory, topic, part, part_name, chapter, chapter_title,
      source_type, source_file, is_downloaded, downloaded_at, word_count,
      generation_status, questions_generated, easy_count, medium_count, hard_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(category, subcategory, topic, part, chapter) DO UPDATE SET
      source_file = excluded.source_file,
      is_downloaded = excluded.is_downloaded,
      word_count = excluded.word_count,
      questions_generated = excluded.questions_generated,
      easy_count = excluded.easy_count,
      medium_count = excluded.medium_count,
      hard_count = excluded.hard_count,
      generation_status = CASE
        WHEN excluded.questions_generated > 0 THEN 'completed'
        ELSE content_tracking.generation_status
      END,
      updated_at = datetime('now')
  `, [
    category, subcategory, topic, part, partName, chapter, chapterTitle,
    sourceType, sourceFile, 1, new Date().toISOString(), wordCount,
    status, questionCounts.total, questionCounts.easy, questionCounts.medium, questionCounts.hard
  ]);
}

// Sync TV shows
function syncTVShows(pipelineDb: Database): number {
  const transcriptsDir = join(GENERATION_DIR, 'transcripts');
  if (!existsSync(transcriptsDir)) return 0;

  const questionCounts = getQuestionCounts('tv-shows.db');
  const shows = readdirSync(transcriptsDir).filter(f =>
    statSync(join(transcriptsDir, f)).isDirectory()
  );

  let count = 0;
  for (const show of shows) {
    const showDir = join(transcriptsDir, show);
    const episodes = readdirSync(showDir).filter(f => f.endsWith('.json'));

    const dramaShows = ['game-of-thrones', 'breaking-bad', 'mad-men', 'the-sopranos', 'the-wire'];
    const subcategory = dramaShows.includes(show) ? 'drama' : 'sitcoms';

    for (const ep of episodes) {
      const match = ep.match(/s(\d+)e(\d+)\.json/);
      if (!match) continue;

      const season = parseInt(match[1]);
      const episode = parseInt(match[2]);
      const filePath = join(showDir, ep);

      let title = '';
      let wordCount = 0;
      try {
        const data = JSON.parse(readFileSync(filePath, 'utf-8'));
        title = data.title || data.episodeTitle || '';
        wordCount = (data.transcript || data.content || '').split(/\s+/).length;
      } catch (e) {}

      const key = `${show}|${season}|${episode}`;
      const qc = questionCounts.get(key) || { total: 0, easy: 0, medium: 0, hard: 0 };

      upsertContent(pipelineDb,
        'tv-shows', subcategory, show, season, `Season ${season}`, episode, title,
        'transcript', `generation/transcripts/${show}/${ep}`, wordCount, qc
      );
      count++;
    }
  }
  return count;
}

// Sync Movies
function syncMovies(pipelineDb: Database): number {
  const moviesDir = join(GENERATION_DIR, 'movies');
  if (!existsSync(moviesDir)) return 0;

  const questionCounts = getQuestionCounts('movies.db');
  const movies = readdirSync(moviesDir).filter(f => f.endsWith('.json'));

  let count = 0;
  for (const movie of movies) {
    const slug = movie.replace('.json', '');
    const filePath = join(moviesDir, movie);

    let title = slug;
    let wordCount = 0;
    try {
      const data = JSON.parse(readFileSync(filePath, 'utf-8'));
      title = data.title || slug;
      wordCount = (data.script || data.content || '').split(/\s+/).length;
    } catch (e) {}

    const key = `${slug}|null|null`;
    const qc = questionCounts.get(key) || { total: 0, easy: 0, medium: 0, hard: 0 };

    upsertContent(pipelineDb,
      'movies', 'films', slug, null, null, null, title,
      'script', `generation/movies/${movie}`, wordCount, qc
    );
    count++;
  }
  return count;
}

// Sync Epics
function syncEpics(pipelineDb: Database): { mahabharata: number; ramayana: number; gita: number; bible: number; quran: number } {
  const epicsDir = join(GENERATION_DIR, 'epics');
  if (!existsSync(epicsDir)) return { mahabharata: 0, ramayana: 0, gita: 0, bible: 0, quran: 0 };

  const questionCounts = getQuestionCounts('epics.db');
  const result = { mahabharata: 0, ramayana: 0, gita: 0, bible: 0, quran: 0 };

  // Mahabharata
  const mahabhDir = join(epicsDir, 'mahabharata');
  if (existsSync(mahabhDir)) {
    const parvas = readdirSync(mahabhDir).filter(f => f.startsWith('parva-'));

    for (const parva of parvas) {
      const match = parva.match(/parva-(\d+)-(.+)/);
      if (!match) continue;

      const parvaNum = parseInt(match[1]);
      const parvaName = match[2].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      const parvaDir = join(mahabhDir, parva);
      const sections = readdirSync(parvaDir).filter(f => f.endsWith('.json'));

      for (const section of sections) {
        const secMatch = section.match(/section-(\d+)\.json/);
        if (!secMatch) continue;

        const sectionNum = parseInt(secMatch[1]);
        const filePath = join(parvaDir, section);

        let title = '';
        let wordCount = 0;
        try {
          const data = JSON.parse(readFileSync(filePath, 'utf-8'));
          title = data.title || '';
          wordCount = (data.content || '').split(/\s+/).length;
        } catch (e) {}

        const key = `mahabharata|${parvaNum}|${sectionNum}`;
        const qc = questionCounts.get(key) || { total: 0, easy: 0, medium: 0, hard: 0 };

        upsertContent(pipelineDb,
          'epics', 'hindu-epics', 'mahabharata', parvaNum, parvaName, sectionNum, title,
          'text', `generation/epics/mahabharata/${parva}/${section}`, wordCount, qc
        );
        result.mahabharata++;
      }
    }
  }

  // Ramayana
  const ramayanaDir = join(epicsDir, 'ramayana');
  if (existsSync(ramayanaDir)) {
    const pages = readdirSync(ramayanaDir).filter(f => f.endsWith('.json'));

    for (const page of pages) {
      const match = page.match(/page-(\d+)\.json/);
      if (!match) continue;

      const pageNum = parseInt(match[1]);
      const filePath = join(ramayanaDir, page);

      let title = '';
      let wordCount = 0;
      try {
        const data = JSON.parse(readFileSync(filePath, 'utf-8'));
        title = data.title || '';
        wordCount = (data.content || '').split(/\s+/).length;
      } catch (e) {}

      const key = `ramayana|null|${pageNum}`;
      const qc = questionCounts.get(key) || { total: 0, easy: 0, medium: 0, hard: 0 };

      upsertContent(pipelineDb,
        'epics', 'hindu-epics', 'ramayana', null, null, pageNum, title,
        'text', `generation/epics/ramayana/${page}`, wordCount, qc
      );
      result.ramayana++;
    }
  }

  // Bhagavad Gita
  const gitaDir = join(epicsDir, 'bhagavad-gita');
  if (existsSync(gitaDir)) {
    const chapters = readdirSync(gitaDir).filter(f => f.endsWith('.json'));

    for (const chapter of chapters) {
      const match = chapter.match(/chapter-(\d+)\.json/);
      if (!match) continue;

      const chapterNum = parseInt(match[1]);
      const filePath = join(gitaDir, chapter);

      let wordCount = 0;
      try {
        const data = JSON.parse(readFileSync(filePath, 'utf-8'));
        wordCount = JSON.stringify(data.verses || []).split(/\s+/).length;
      } catch (e) {}

      const key = `bhagavad-gita|null|${chapterNum}`;
      const qc = questionCounts.get(key) || { total: 0, easy: 0, medium: 0, hard: 0 };

      upsertContent(pipelineDb,
        'epics', 'hindu-epics', 'bhagavad-gita', null, null, chapterNum, `Chapter ${chapterNum}`,
        'api', `generation/epics/bhagavad-gita/${chapter}`, wordCount, qc
      );
      result.gita++;
    }
  }

  // Bible
  const bibleDir = join(epicsDir, 'bible');
  if (existsSync(bibleDir)) {
    const books = readdirSync(bibleDir).filter(f => f.endsWith('.json'));
    let bookNum = 0;

    for (const book of books) {
      const slug = book.replace('.json', '');
      const filePath = join(bibleDir, book);

      let wordCount = 0;
      try {
        const data = JSON.parse(readFileSync(filePath, 'utf-8'));
        wordCount = (data.text || '').split(/\s+/).length;
      } catch (e) {}

      bookNum++;
      const key = `bible|null|${bookNum}`;
      const qc = questionCounts.get(key) || { total: 0, easy: 0, medium: 0, hard: 0 };

      upsertContent(pipelineDb,
        'epics', 'abrahamic', 'bible', null, null, bookNum, slug,
        'api', `generation/epics/bible/${book}`, wordCount, qc
      );
      result.bible++;
    }
  }

  // Quran
  const quranDir = join(epicsDir, 'quran');
  if (existsSync(quranDir)) {
    const surahs = readdirSync(quranDir).filter(f => f.endsWith('.json'));

    for (const surah of surahs) {
      const match = surah.match(/surah-(\d+)\.json/);
      if (!match) continue;

      const surahNum = parseInt(match[1]);
      const filePath = join(quranDir, surah);

      let title = '';
      let wordCount = 0;
      try {
        const data = JSON.parse(readFileSync(filePath, 'utf-8'));
        title = data.englishName || '';
        wordCount = JSON.stringify(data.ayahs || []).split(/\s+/).length;
      } catch (e) {}

      const key = `quran|null|${surahNum}`;
      const qc = questionCounts.get(key) || { total: 0, easy: 0, medium: 0, hard: 0 };

      upsertContent(pipelineDb,
        'epics', 'abrahamic', 'quran', null, null, surahNum, title,
        'api', `generation/epics/quran/${surah}`, wordCount, qc
      );
      result.quran++;
    }
  }

  return result;
}

// Full sync
export function syncPipeline(): {
  tvShows: number;
  movies: number;
  epics: { mahabharata: number; ramayana: number; gita: number; bible: number; quran: number };
  syncedAt: string;
} {
  const pipelineDb = getDb();

  const tvShows = syncTVShows(pipelineDb);
  const movies = syncMovies(pipelineDb);
  const epics = syncEpics(pipelineDb);

  return {
    tvShows,
    movies,
    epics,
    syncedAt: new Date().toISOString(),
  };
}

// Get pipeline summary
export function getPipelineSummary(): {
  categories: Array<{
    category: string;
    total: number;
    downloaded: number;
    completed: number;
    pending: number;
    failed: number;
    questions: number;
  }>;
  totals: {
    total: number;
    downloaded: number;
    completed: number;
    pending: number;
    questions: number;
  };
} {
  const pipelineDb = getDb();

  const categories = pipelineDb.query(`
    SELECT
      category,
      COUNT(*) as total,
      SUM(is_downloaded) as downloaded,
      SUM(CASE WHEN generation_status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN generation_status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN generation_status = 'failed' THEN 1 ELSE 0 END) as failed,
      SUM(questions_generated) as questions
    FROM content_tracking
    GROUP BY category
    ORDER BY category
  `).all() as any[];

  const totals = pipelineDb.query(`
    SELECT
      COUNT(*) as total,
      SUM(is_downloaded) as downloaded,
      SUM(CASE WHEN generation_status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN generation_status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(questions_generated) as questions
    FROM content_tracking
  `).get() as any;

  return { categories, totals };
}

// Get detailed status by topic
export function getPipelineByTopic(category?: string): Array<{
  category: string;
  subcategory: string;
  topic: string;
  totalUnits: number;
  completed: number;
  pending: number;
  questions: number;
}> {
  const pipelineDb = getDb();

  let query = `
    SELECT
      category,
      subcategory,
      topic,
      COUNT(*) as totalUnits,
      SUM(CASE WHEN generation_status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN generation_status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(questions_generated) as questions
    FROM content_tracking
  `;

  if (category) {
    query += ` WHERE category = '${category}'`;
  }

  query += ` GROUP BY category, subcategory, topic ORDER BY category, topic`;

  return pipelineDb.query(query).all() as any[];
}

// Get pending items (what's next to process)
export function getPendingItems(limit = 50): Array<{
  category: string;
  topic: string;
  part: number | null;
  partName: string | null;
  chapter: number | null;
  chapterTitle: string;
  sourceFile: string;
  wordCount: number;
}> {
  const pipelineDb = getDb();

  return pipelineDb.query(`
    SELECT
      category, topic, part, part_name as partName,
      chapter, chapter_title as chapterTitle,
      source_file as sourceFile, word_count as wordCount
    FROM content_tracking
    WHERE is_downloaded = 1 AND generation_status = 'pending'
    ORDER BY category, topic, part, chapter
    LIMIT ?
  `).all(limit) as any[];
}

// Get failed items
export function getFailedItems(): Array<{
  category: string;
  topic: string;
  part: number | null;
  chapter: number | null;
  generationError: string;
  attempts: number;
}> {
  const pipelineDb = getDb();

  return pipelineDb.query(`
    SELECT
      category, topic, part, chapter,
      generation_error as generationError,
      generation_attempts as attempts
    FROM content_tracking
    WHERE generation_status = 'failed'
    ORDER BY generation_attempts DESC
  `).all() as any[];
}

export default {
  syncPipeline,
  getPipelineSummary,
  getPipelineByTopic,
  getPendingItems,
  getFailedItems,
};

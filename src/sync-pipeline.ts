/**
 * Sync pipeline.db with actual content files and question counts
 * Usage: bun src/sync-pipeline.ts
 */

import Database from 'bun:sqlite';
import { readdirSync, statSync, readFileSync, existsSync } from 'fs';
import { join, basename } from 'path';

const DATA_DIR = join(process.cwd(), 'data');
const GENERATION_DIR = join(process.cwd(), 'generation');

const pipelineDb = new Database(join(DATA_DIR, 'pipeline.db'));

// Prepare statements
const upsertContent = pipelineDb.prepare(`
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
`);

// Get question counts from a category database
function getQuestionCounts(categoryDb: string): Map<string, { total: number, easy: number, medium: number, hard: number }> {
  const counts = new Map();
  const dbPath = join(DATA_DIR, categoryDb);

  if (!existsSync(dbPath)) return counts;

  const db = new Database(dbPath, { readonly: true });
  try {
    const rows = db.query(`
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
  db.close();
  return counts;
}

// Sync TV shows
function syncTVShows() {
  console.log('\n📺 Syncing TV Shows...');
  const transcriptsDir = join(GENERATION_DIR, 'transcripts');
  if (!existsSync(transcriptsDir)) return;

  const questionCounts = getQuestionCounts('tv-shows.db');
  const shows = readdirSync(transcriptsDir).filter(f =>
    statSync(join(transcriptsDir, f)).isDirectory()
  );

  let count = 0;
  for (const show of shows) {
    const showDir = join(transcriptsDir, show);
    const episodes = readdirSync(showDir).filter(f => f.endsWith('.json'));

    // Determine subcategory based on show
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
      const status = qc.total > 0 ? 'completed' : 'pending';

      upsertContent.run(
        'tv-shows', subcategory, show, season, `Season ${season}`, episode, title,
        'transcript', `generation/transcripts/${show}/${ep}`, 1, new Date().toISOString(), wordCount,
        status, qc.total, qc.easy, qc.medium, qc.hard
      );
      count++;
    }
  }
  console.log(`   ✅ ${count} episodes synced`);
}

// Sync Movies
function syncMovies() {
  console.log('\n🎬 Syncing Movies...');
  const moviesDir = join(GENERATION_DIR, 'movies');
  if (!existsSync(moviesDir)) return;

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
    const status = qc.total > 0 ? 'completed' : 'pending';

    upsertContent.run(
      'movies', 'films', slug, null, null, null, title,
      'script', `generation/movies/${movie}`, 1, new Date().toISOString(), wordCount,
      status, qc.total, qc.easy, qc.medium, qc.hard
    );
    count++;
  }
  console.log(`   ✅ ${count} movies synced`);
}

// Sync Epics
function syncEpics() {
  console.log('\n📜 Syncing Epics...');
  const epicsDir = join(GENERATION_DIR, 'epics');
  if (!existsSync(epicsDir)) return;

  const questionCounts = getQuestionCounts('epics.db');

  // Mahabharata
  const mahabhDir = join(epicsDir, 'mahabharata');
  if (existsSync(mahabhDir)) {
    const parvas = readdirSync(mahabhDir).filter(f => f.startsWith('parva-'));
    let count = 0;

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
        const status = qc.total > 0 ? 'completed' : 'pending';

        upsertContent.run(
          'epics', 'hindu-epics', 'mahabharata', parvaNum, parvaName, sectionNum, title,
          'text', `generation/epics/mahabharata/${parva}/${section}`, 1, new Date().toISOString(), wordCount,
          status, qc.total, qc.easy, qc.medium, qc.hard
        );
        count++;
      }
    }
    console.log(`   ✅ Mahabharata: ${count} sections synced`);
  }

  // Ramayana
  const ramayanaDir = join(epicsDir, 'ramayana');
  if (existsSync(ramayanaDir)) {
    const pages = readdirSync(ramayanaDir).filter(f => f.endsWith('.json'));
    let count = 0;

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
      const status = qc.total > 0 ? 'completed' : 'pending';

      upsertContent.run(
        'epics', 'hindu-epics', 'ramayana', null, null, pageNum, title,
        'text', `generation/epics/ramayana/${page}`, 1, new Date().toISOString(), wordCount,
        status, qc.total, qc.easy, qc.medium, qc.hard
      );
      count++;
    }
    console.log(`   ✅ Ramayana: ${count} pages synced`);
  }

  // Bhagavad Gita
  const gitaDir = join(epicsDir, 'bhagavad-gita');
  if (existsSync(gitaDir)) {
    const chapters = readdirSync(gitaDir).filter(f => f.endsWith('.json'));
    let count = 0;

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
      const status = qc.total > 0 ? 'completed' : 'pending';

      upsertContent.run(
        'epics', 'hindu-epics', 'bhagavad-gita', null, null, chapterNum, `Chapter ${chapterNum}`,
        'api', `generation/epics/bhagavad-gita/${chapter}`, 1, new Date().toISOString(), wordCount,
        status, qc.total, qc.easy, qc.medium, qc.hard
      );
      count++;
    }
    console.log(`   ✅ Bhagavad Gita: ${count} chapters synced`);
  }

  // Bible
  const bibleDir = join(epicsDir, 'bible');
  if (existsSync(bibleDir)) {
    const books = readdirSync(bibleDir).filter(f => f.endsWith('.json'));
    let count = 0;

    for (const book of books) {
      const slug = book.replace('.json', '');
      const filePath = join(bibleDir, book);

      let wordCount = 0;
      try {
        const data = JSON.parse(readFileSync(filePath, 'utf-8'));
        wordCount = (data.text || '').split(/\s+/).length;
      } catch (e) {}

      const key = `bible|null|${slug}`;
      const qc = questionCounts.get(key) || { total: 0, easy: 0, medium: 0, hard: 0 };
      const status = qc.total > 0 ? 'completed' : 'pending';

      upsertContent.run(
        'epics', 'abrahamic', 'bible', null, null, count + 1, slug,
        'api', `generation/epics/bible/${book}`, 1, new Date().toISOString(), wordCount,
        status, qc.total, qc.easy, qc.medium, qc.hard
      );
      count++;
    }
    console.log(`   ✅ Bible: ${count} books synced`);
  }

  // Quran
  const quranDir = join(epicsDir, 'quran');
  if (existsSync(quranDir)) {
    const surahs = readdirSync(quranDir).filter(f => f.endsWith('.json'));
    let count = 0;

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
      const status = qc.total > 0 ? 'completed' : 'pending';

      upsertContent.run(
        'epics', 'abrahamic', 'quran', null, null, surahNum, title,
        'api', `generation/epics/quran/${surah}`, 1, new Date().toISOString(), wordCount,
        status, qc.total, qc.easy, qc.medium, qc.hard
      );
      count++;
    }
    console.log(`   ✅ Quran: ${count} surahs synced`);
  }
}

// Sync Wikipedia articles
function syncWikipedia() {
  console.log('\n📚 Syncing Wikipedia...');
  const wikiDir = join(GENERATION_DIR, 'wikipedia');
  if (!existsSync(wikiDir)) return;

  const questionCounts = getQuestionCounts('wikipedia.db');
  let totalCount = 0;

  // Recursively scan all subdirectories
  function scanDir(dir: string, subcategory: string) {
    const entries = readdirSync(dir);
    let count = 0;

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        // Recurse into subdirectory
        const newSubcat = subcategory ? `${subcategory}/${entry}` : entry;
        count += scanDir(fullPath, newSubcat);
      } else if (entry.endsWith('.json')) {
        const slug = entry.replace('.json', '');
        let title = slug;
        let wordCount = 0;

        try {
          const data = JSON.parse(readFileSync(fullPath, 'utf-8'));
          title = data.title || slug;
          wordCount = (data.extract || data.content || '').split(/\s+/).length;
        } catch (e) {}

        const key = `${slug}|null|null`;
        const qc = questionCounts.get(key) || { total: 0, easy: 0, medium: 0, hard: 0 };
        const status = qc.total > 0 ? 'completed' : 'pending';

        const relativePath = fullPath.replace(process.cwd() + '/', '');
        upsertContent.run(
          'wikipedia', subcategory || 'general', slug, null, null, null, title,
          'wikipedia', relativePath, 1, new Date().toISOString(), wordCount,
          status, qc.total, qc.easy, qc.medium, qc.hard
        );
        count++;
      }
    }
    return count;
  }

  totalCount = scanDir(wikiDir, '');
  console.log(`   ✅ ${totalCount} Wikipedia articles synced`);
}

// Sync Mythology content (theoi.com, norse, egyptian)
function syncMythology() {
  console.log('\n🏛️ Syncing Mythology...');
  const questionCounts = getQuestionCounts('mythology.db');
  let totalCount = 0;

  // Greek mythology from theoi.com
  const greekDir = join(GENERATION_DIR, 'greek-mythology');
  if (existsSync(greekDir)) {
    function scanGreek(dir: string, subcategory: string): number {
      const entries = readdirSync(dir);
      let count = 0;

      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          count += scanGreek(fullPath, subcategory ? `${subcategory}/${entry}` : entry);
        } else if (entry.endsWith('.json')) {
          const slug = entry.replace('.json', '');
          let title = slug;
          let wordCount = 0;

          try {
            const data = JSON.parse(readFileSync(fullPath, 'utf-8'));
            title = data.title || slug;
            wordCount = (data.content || '').split(/\s+/).length;
          } catch (e) {}

          const key = `${slug}|null|null`;
          const qc = questionCounts.get(key) || { total: 0, easy: 0, medium: 0, hard: 0 };
          const status = qc.total > 0 ? 'completed' : 'pending';

          const relativePath = fullPath.replace(process.cwd() + '/', '');
          upsertContent.run(
            'mythology', `greek/${subcategory || 'general'}`, slug, null, null, null, title,
            'theoi', relativePath, 1, new Date().toISOString(), wordCount,
            status, qc.total, qc.easy, qc.medium, qc.hard
          );
          count++;
        }
      }
      return count;
    }
    const greekCount = scanGreek(greekDir, '');
    console.log(`   ✅ Greek (theoi.com): ${greekCount} articles`);
    totalCount += greekCount;
  }

  // Norse mythology (recursive scan)
  const norseDir = join(GENERATION_DIR, 'norse-mythology');
  if (existsSync(norseDir)) {
    function scanNorse(dir: string, subcategory: string): number {
      const entries = readdirSync(dir);
      let count = 0;

      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          count += scanNorse(fullPath, subcategory ? `${subcategory}/${entry}` : entry);
        } else if (entry.endsWith('.json')) {
          const slug = entry.replace('.json', '');
          let title = slug;
          let wordCount = 0;

          try {
            const data = JSON.parse(readFileSync(fullPath, 'utf-8'));
            title = data.title || slug;
            wordCount = (data.content || '').split(/\s+/).length;
          } catch (e) {}

          const key = `${slug}|null|null`;
          const qc = questionCounts.get(key) || { total: 0, easy: 0, medium: 0, hard: 0 };
          const status = qc.total > 0 ? 'completed' : 'pending';

          const relativePath = fullPath.replace(process.cwd() + '/', '');
          upsertContent.run(
            'mythology', `norse/${subcategory || 'general'}`, slug, null, null, null, title,
            'sacred-texts', relativePath, 1, new Date().toISOString(), wordCount,
            status, qc.total, qc.easy, qc.medium, qc.hard
          );
          count++;
        }
      }
      return count;
    }
    const norseCount = scanNorse(norseDir, '');
    console.log(`   ✅ Norse: ${norseCount} articles`);
    totalCount += norseCount;
  }

  // Egyptian mythology (recursive scan)
  const egyptDir = join(GENERATION_DIR, 'egyptian-mythology');
  if (existsSync(egyptDir)) {
    function scanEgyptian(dir: string, subcategory: string): number {
      const entries = readdirSync(dir);
      let count = 0;

      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          count += scanEgyptian(fullPath, subcategory ? `${subcategory}/${entry}` : entry);
        } else if (entry.endsWith('.json')) {
          const slug = entry.replace('.json', '');
          let title = slug;
          let wordCount = 0;

          try {
            const data = JSON.parse(readFileSync(fullPath, 'utf-8'));
            title = data.title || slug;
            wordCount = (data.content || '').split(/\s+/).length;
          } catch (e) {}

          const key = `${slug}|null|null`;
          const qc = questionCounts.get(key) || { total: 0, easy: 0, medium: 0, hard: 0 };
          const status = qc.total > 0 ? 'completed' : 'pending';

          const relativePath = fullPath.replace(process.cwd() + '/', '');
          upsertContent.run(
            'mythology', `egyptian/${subcategory || 'general'}`, slug, null, null, null, title,
            'sacred-texts', relativePath, 1, new Date().toISOString(), wordCount,
            status, qc.total, qc.easy, qc.medium, qc.hard
          );
          count++;
        }
      }
      return count;
    }
    const egyptCount = scanEgyptian(egyptDir, '');
    console.log(`   ✅ Egyptian: ${egyptCount} articles`);
    totalCount += egyptCount;
  }

  console.log(`   📊 Total mythology: ${totalCount} articles`);
}

// Sync Books (recursive)
function syncBooks() {
  console.log('\n📖 Syncing Books...');
  const booksDir = join(GENERATION_DIR, 'books');
  if (!existsSync(booksDir)) return;

  const questionCounts = getQuestionCounts('books.db');
  let totalCount = 0;

  // Recursively scan book directories
  function scanBooks(dir: string, collection: string, subPath: string): number {
    const entries = readdirSync(dir);
    let count = 0;

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        // Recurse into subdirectory
        const newSubPath = subPath ? `${subPath}/${entry}` : entry;
        count += scanBooks(fullPath, collection, newSubPath);
      } else if (entry.endsWith('.json')) {
        const slug = entry.replace('.json', '');
        let title = slug;
        let wordCount = 0;
        let chapterNum: number | null = null;

        try {
          const data = JSON.parse(readFileSync(fullPath, 'utf-8'));
          title = data.title || data.chapter || slug;
          wordCount = (data.content || data.text || '').split(/\s+/).length;
          // Try to extract chapter number from filename
          const numMatch = slug.match(/(\d+)/);
          if (numMatch) chapterNum = parseInt(numMatch[1]);
        } catch (e) {}

        const key = `${collection}|null|${chapterNum || slug}`;
        const qc = questionCounts.get(key) || { total: 0, easy: 0, medium: 0, hard: 0 };
        const status = qc.total > 0 ? 'completed' : 'pending';

        const relativePath = fullPath.replace(process.cwd() + '/', '');
        const subcategory = subPath || collection;
        upsertContent.run(
          'books', subcategory, collection, null, null, chapterNum, title,
          'gutenberg', relativePath, 1, new Date().toISOString(), wordCount,
          status, qc.total, qc.easy, qc.medium, qc.hard
        );
        count++;
      }
    }
    return count;
  }

  // Scan each top-level collection directory
  const collections = readdirSync(booksDir).filter(f =>
    statSync(join(booksDir, f)).isDirectory()
  );

  for (const collection of collections) {
    const collectionDir = join(booksDir, collection);
    const count = scanBooks(collectionDir, collection, '');
    if (count > 0) {
      console.log(`   ✅ ${collection}: ${count} chapters`);
    }
    totalCount += count;
  }
  console.log(`   📊 Total books: ${totalCount} chapters`);
}

// Print summary
function printSummary() {
  console.log('\n📊 Pipeline Summary:');
  console.log('─'.repeat(60));

  const summary = pipelineDb.query(`
    SELECT
      category,
      COUNT(*) as total,
      SUM(is_downloaded) as downloaded,
      SUM(CASE WHEN generation_status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN generation_status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(questions_generated) as questions
    FROM content_tracking
    GROUP BY category
  `).all() as any[];

  for (const row of summary) {
    console.log(`\n${row.category.toUpperCase()}`);
    console.log(`   Total units:    ${row.total}`);
    console.log(`   Downloaded:     ${row.downloaded}`);
    console.log(`   Completed:      ${row.completed}`);
    console.log(`   Pending:        ${row.pending}`);
    console.log(`   Questions:      ${row.questions}`);
  }

  const totals = pipelineDb.query(`
    SELECT
      COUNT(*) as total,
      SUM(questions_generated) as questions,
      SUM(CASE WHEN generation_status = 'pending' THEN 1 ELSE 0 END) as pending
    FROM content_tracking
  `).get() as any;

  console.log('\n' + '─'.repeat(60));
  console.log(`TOTAL: ${totals.total} content units | ${totals.questions} questions | ${totals.pending} pending`);
}

// Main
console.log('🔄 Syncing pipeline database...');
syncTVShows();
syncMovies();
syncEpics();
syncWikipedia();
syncMythology();
syncBooks();
printSummary();
pipelineDb.close();
console.log('\n✅ Pipeline sync complete!');

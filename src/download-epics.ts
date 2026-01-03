/**
 * Epic texts downloader - Bhagavad Gita, Bible, Quran, Ramayana
 * Usage: bun src/download-epics.ts [source]
 */

import * as cheerio from 'cheerio';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { fetchWithRetry, createRateLimiter, sleep } from './lib/http.js';
import { createLogger } from './lib/logger.js';

const logger = createLogger('epics');
const rateLimiter = createRateLimiter(0.5);

const EPICS_DIR = join(process.cwd(), 'generation', 'epics');

// ============================================
// BHAGAVAD GITA - via API
// ============================================
async function downloadBhagavadGita() {
  logger.info('=== Downloading Bhagavad Gita ===');
  const dir = join(EPICS_DIR, 'bhagavad-gita');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const chapters = 18;
  const versesPerChapter = [47, 72, 43, 42, 29, 47, 30, 28, 34, 42, 55, 20, 35, 27, 20, 24, 28, 78];

  for (let ch = 1; ch <= chapters; ch++) {
    const chapterData: any = { chapter: ch, verses: [] };

    for (let v = 1; v <= versesPerChapter[ch - 1]; v++) {
      await rateLimiter();
      try {
        const url = `https://bhagavadgitaapi.in/slok/${ch}/${v}`;
        const response = await fetch(url);
        const data = await response.json();
        chapterData.verses.push({
          verse: v,
          sanskrit: data.slok,
          transliteration: data.transliteration,
          translation: data.tej?.ht || data.spibb?.et,
          author: data.tej?.author || 'Swami Tejomayananda',
        });
        logger.info(`  Chapter ${ch}, Verse ${v}`);
      } catch (e: any) {
        logger.warn(`  Failed: Ch${ch}:V${v} - ${e.message}`);
      }
      await sleep(200);
    }

    const filepath = join(dir, `chapter-${ch.toString().padStart(2, '0')}.json`);
    writeFileSync(filepath, JSON.stringify(chapterData, null, 2));
    logger.success(`Chapter ${ch} saved (${chapterData.verses.length} verses)`);
  }
}

// ============================================
// BIBLE - via API
// ============================================
const BIBLE_BOOKS = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
  'Joshua', 'Judges', 'Ruth', '1Samuel', '2Samuel', '1Kings', '2Kings',
  '1Chronicles', '2Chronicles', 'Ezra', 'Nehemiah', 'Esther',
  'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'SongOfSolomon',
  'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel',
  'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum',
  'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
  'Matthew', 'Mark', 'Luke', 'John', 'Acts',
  'Romans', '1Corinthians', '2Corinthians', 'Galatians', 'Ephesians',
  'Philippians', 'Colossians', '1Thessalonians', '2Thessalonians',
  '1Timothy', '2Timothy', 'Titus', 'Philemon', 'Hebrews',
  'James', '1Peter', '2Peter', '1John', '2John', '3John', 'Jude', 'Revelation'
];

async function downloadBible() {
  logger.info('=== Downloading Bible ===');
  const dir = join(EPICS_DIR, 'bible');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  for (const book of BIBLE_BOOKS) {
    const filepath = join(dir, `${book.toLowerCase()}.json`);
    if (existsSync(filepath)) {
      logger.info(`${book} already exists, skipping`);
      continue;
    }

    await rateLimiter();
    try {
      const url = `https://bible-api.com/${book}`;
      const response = await fetch(url);
      const data = await response.json();

      writeFileSync(filepath, JSON.stringify({
        book,
        reference: data.reference,
        text: data.text,
        verses: data.verses,
        source: 'bible-api.com',
        scrapedAt: new Date().toISOString(),
      }, null, 2));

      logger.success(`${book} saved`);
    } catch (e: any) {
      logger.error(`${book} failed: ${e.message}`);
    }
    await sleep(2500); // Rate limit: 15 req/30 sec
  }
}

// ============================================
// QURAN - via API (no rate limits!)
// ============================================
async function downloadQuran() {
  logger.info('=== Downloading Quran ===');
  const dir = join(EPICS_DIR, 'quran');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  // Get all 114 surahs
  for (let surah = 1; surah <= 114; surah++) {
    const filepath = join(dir, `surah-${surah.toString().padStart(3, '0')}.json`);
    if (existsSync(filepath)) {
      logger.info(`Surah ${surah} exists, skipping`);
      continue;
    }

    try {
      const url = `https://api.alquran.cloud/v1/surah/${surah}/en.asad`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK') {
        writeFileSync(filepath, JSON.stringify({
          number: data.data.number,
          name: data.data.name,
          englishName: data.data.englishName,
          englishNameTranslation: data.data.englishNameTranslation,
          revelationType: data.data.revelationType,
          ayahs: data.data.ayahs,
          source: 'alquran.cloud',
          scrapedAt: new Date().toISOString(),
        }, null, 2));
        logger.success(`Surah ${surah}: ${data.data.englishName}`);
      }
    } catch (e: any) {
      logger.error(`Surah ${surah} failed: ${e.message}`);
    }
    await sleep(300);
  }
}

// ============================================
// RAMAYANA - Sacred Texts scraping
// ============================================
async function downloadRamayana() {
  logger.info('=== Downloading Ramayana ===');
  const dir = join(EPICS_DIR, 'ramayana');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  // Ramayana has ~600 pages: ry001.htm to ry600.htm
  const baseUrl = 'https://sacred-texts.com/hin/rama/';

  for (let page = 1; page <= 600; page++) {
    const pageNum = page.toString().padStart(3, '0');
    const filepath = join(dir, `page-${pageNum}.json`);

    if (existsSync(filepath)) {
      continue;
    }

    await rateLimiter();
    try {
      const url = `${baseUrl}ry${pageNum}.htm`;
      const html = await fetchWithRetry(url);
      const $ = cheerio.load(html);

      const title = $('h3').first().text().trim() || $('h2').first().text().trim();
      const content = $('body').text().trim();

      if (content.length > 100) {
        writeFileSync(filepath, JSON.stringify({
          page,
          title,
          content,
          source: 'sacred-texts.com',
          sourceUrl: url,
          scrapedAt: new Date().toISOString(),
          wordCount: content.split(/\s+/).length,
        }, null, 2));
        logger.success(`Page ${pageNum}: ${title.substring(0, 50)}`);
      }
    } catch (e: any) {
      // Page might not exist, that's ok
      if (!e.message.includes('404')) {
        logger.warn(`Page ${pageNum} failed: ${e.message}`);
      }
    }
    await sleep(500);
  }
}

// ============================================
// MAHABHARATA - Sacred Texts scraping
// ============================================
async function downloadMahabharata() {
  logger.info('=== Downloading Mahabharata ===');
  const dir = join(EPICS_DIR, 'mahabharata');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  // Mahabharata structure: 18 books (parvas), each with multiple sections
  const baseUrl = 'https://www.sacred-texts.com/hin/m';
  const parvas = [
    { num: '01', name: 'Adi Parva', pages: 236 },
    { num: '02', name: 'Sabha Parva', pages: 81 },
    { num: '03', name: 'Vana Parva', pages: 313 },
    { num: '04', name: 'Virata Parva', pages: 72 },
    { num: '05', name: 'Udyoga Parva', pages: 199 },
    { num: '06', name: 'Bhishma Parva', pages: 122 },
    { num: '07', name: 'Drona Parva', pages: 203 },
    { num: '08', name: 'Karna Parva', pages: 96 },
    { num: '09', name: 'Shalya Parva', pages: 65 },
    { num: '10', name: 'Sauptika Parva', pages: 18 },
    { num: '11', name: 'Stri Parva', pages: 27 },
    { num: '12', name: 'Shanti Parva', pages: 365 },
    { num: '13', name: 'Anusasana Parva', pages: 168 },
    { num: '14', name: 'Ashvamedhika Parva', pages: 106 },
    { num: '15', name: 'Ashramavasika Parva', pages: 47 },
    { num: '16', name: 'Mausala Parva', pages: 9 },
    { num: '17', name: 'Mahaprasthanika Parva', pages: 3 },
    { num: '18', name: 'Svargarohana Parva', pages: 5 },
  ];

  for (const parva of parvas) {
    const parvaDir = join(dir, `parva-${parva.num}-${parva.name.toLowerCase().replace(/\s+/g, '-')}`);
    if (!existsSync(parvaDir)) mkdirSync(parvaDir, { recursive: true });

    logger.info(`\n${parva.name} (${parva.pages} sections)`);

    for (let section = 1; section <= parva.pages; section++) {
      const sectionNum = section.toString().padStart(3, '0');
      const filepath = join(parvaDir, `section-${sectionNum}.json`);

      if (existsSync(filepath)) {
        continue;
      }

      await rateLimiter();
      try {
        // Parvas 1-11 use /hin/m{num}/ format, parvas 12-18 use /hin/mbs/ format
        const parvaInt = parseInt(parva.num);
        const url = parvaInt >= 12
          ? `https://www.sacred-texts.com/hin/mbs/mbs${parva.num}${sectionNum}.htm`
          : `${baseUrl}${parva.num}/m${parva.num}${sectionNum}.htm`;
        const html = await fetchWithRetry(url);
        const $ = cheerio.load(html);

        const title = $('h2').first().text().trim() || $('h3').first().text().trim();
        // Get main content, skip navigation
        $('hr').remove();
        $('p.smark').remove();
        const content = $('body').text().trim();

        if (content.length > 200) {
          writeFileSync(filepath, JSON.stringify({
            parva: parva.name,
            parvaNum: parseInt(parva.num),
            section,
            title,
            content,
            source: 'sacred-texts.com',
            sourceUrl: url,
            scrapedAt: new Date().toISOString(),
            wordCount: content.split(/\s+/).length,
          }, null, 2));
          logger.info(`  Section ${section}/${parva.pages}`);
        }
      } catch (e: any) {
        if (!e.message.includes('404')) {
          logger.warn(`  Section ${section} failed`);
        }
      }
      await sleep(500);
    }
    logger.success(`${parva.name} complete`);
  }
}

// ============================================
// MAIN
// ============================================
async function main() {
  const source = process.argv[2];

  if (!existsSync(EPICS_DIR)) {
    mkdirSync(EPICS_DIR, { recursive: true });
  }

  if (!source || source === 'all') {
    await downloadBhagavadGita();
    await downloadQuran();
    await downloadBible();
    await downloadRamayana();
  } else if (source === 'gita') {
    await downloadBhagavadGita();
  } else if (source === 'bible') {
    await downloadBible();
  } else if (source === 'quran') {
    await downloadQuran();
  } else if (source === 'ramayana') {
    await downloadRamayana();
  } else if (source === 'mahabharata') {
    await downloadMahabharata();
  } else {
    logger.error(`Unknown source: ${source}`);
    logger.info('Usage: bun src/download-epics.ts [gita|bible|quran|ramayana|all]');
  }

  logger.info('=== Epic downloads complete ===');
}

main().catch(console.error);

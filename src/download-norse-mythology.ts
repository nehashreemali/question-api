/**
 * Norse Mythology downloader - from sacred-texts.com
 * Usage: bun src/download-norse-mythology.ts
 *
 * Downloads:
 * - Poetic Edda (38 poems)
 * - Prose Edda (8 chapters)
 * - Volsung Saga (56 chapters)
 * - Children of Odin (37 chapters)
 * - Teutonic Myth and Legend (48 chapters)
 */

import * as cheerio from 'cheerio';
import { writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { fetchWithRetry, createRateLimiter, sleep } from './lib/http.js';
import { createLogger } from './lib/logger.js';

const logger = createLogger('norse-myth');
const rateLimiter = createRateLimiter(0.5); // 1 request per 2 seconds

const BASE_URL = 'https://www.sacred-texts.com';
const OUTPUT_DIR = join(process.cwd(), 'generation', 'norse-mythology');

interface TextSource {
  name: string;
  slug: string;
  basePath: string;
  filePrefix: string;
  startNum: number;
  endNum: number;
  category: string;
}

// Define all texts to download
const TEXTS: TextSource[] = [
  {
    name: 'The Poetic Edda',
    slug: 'poetic-edda',
    basePath: '/neu/poe',
    filePrefix: 'poe',
    startNum: 0,
    endNum: 38,
    category: 'eddas',
  },
  {
    name: 'The Prose Edda',
    slug: 'prose-edda',
    basePath: '/neu/pre',
    filePrefix: 'pre',
    startNum: 0,
    endNum: 7,
    category: 'eddas',
  },
  {
    name: 'The Volsung Saga',
    slug: 'volsung-saga',
    basePath: '/neu/vlsng',
    filePrefix: 'vlsng',
    startNum: 0,
    endNum: 55,
    category: 'sagas',
  },
  {
    name: 'The Children of Odin',
    slug: 'children-of-odin',
    basePath: '/neu/ice/coo',
    filePrefix: 'coo',
    startNum: 0,
    endNum: 36,
    category: 'retellings',
  },
  {
    name: 'Teutonic Myth and Legend',
    slug: 'teutonic-myth',
    basePath: '/neu/tml',
    filePrefix: 'tml',
    startNum: 0,
    endNum: 47,
    category: 'retellings',
  },
];

/**
 * Download and parse a single page
 */
async function downloadPage(text: TextSource, pageNum: number): Promise<any | null> {
  const paddedNum = String(pageNum).padStart(2, '0');
  const url = `${BASE_URL}${text.basePath}/${text.filePrefix}${paddedNum}.htm`;

  try {
    const html = await fetchWithRetry(url);
    const $ = cheerio.load(html);

    // Remove navigation, scripts, etc.
    $('script').remove();
    $('style').remove();
    $('nav').remove();
    $('font[size="-1"]').remove(); // Navigation links

    // Extract title from h1, h2, or title tag
    let title = $('h1').first().text().trim() ||
                $('h2').first().text().trim() ||
                $('h3').first().text().trim() ||
                $('title').text().replace(' Index', '').trim();

    // Clean up title
    title = title.replace(/\s+/g, ' ').trim();

    // Get all paragraph text
    const paragraphs: string[] = [];
    $('p').each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 20) { // Skip short navigation text
        paragraphs.push(text);
      }
    });

    // Also get blockquote text (poems often in blockquotes)
    $('blockquote').each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 20) {
        paragraphs.push(text);
      }
    });

    // Get text from pre tags (some formatted poetry)
    $('pre').each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 20) {
        paragraphs.push(text);
      }
    });

    const fullContent = paragraphs.join('\n\n');

    // Skip if too little content (likely index/nav page)
    if (fullContent.length < 100) {
      return null;
    }

    return {
      title,
      work: text.name,
      workSlug: text.slug,
      category: text.category,
      pageNumber: pageNum,
      content: fullContent,
      source: 'sacred-texts.com',
      sourceUrl: url,
      scrapedAt: new Date().toISOString(),
      wordCount: fullContent.split(/\s+/).length,
    };
  } catch (e: any) {
    // 404s are expected for some missing pages
    if (!e.message?.includes('404')) {
      logger.warn(`Failed to download ${url}: ${e.message}`);
    }
    return null;
  }
}

/**
 * Get existing downloaded files to skip
 */
function getExistingFiles(): Set<string> {
  const existing = new Set<string>();

  if (!existsSync(OUTPUT_DIR)) return existing;

  const categories = readdirSync(OUTPUT_DIR);
  for (const cat of categories) {
    const catDir = join(OUTPUT_DIR, cat);
    try {
      const works = readdirSync(catDir);
      for (const work of works) {
        const workDir = join(catDir, work);
        try {
          const files = readdirSync(workDir);
          for (const file of files) {
            if (file.endsWith('.json')) {
              existing.add(`${cat}/${work}/${file.replace('.json', '')}`);
            }
          }
        } catch {
          // Not a directory
        }
      }
    } catch {
      // Not a directory
    }
  }

  return existing;
}

/**
 * Main download function
 */
async function downloadNorseMythology() {
  logger.info('=== Downloading Norse Mythology from Sacred-Texts.com ===');

  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const existingFiles = getExistingFiles();
  logger.info(`Already downloaded: ${existingFiles.size} files`);

  let totalDownloaded = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  for (const text of TEXTS) {
    logger.info(`\n--- ${text.name} ---`);

    const categoryDir = join(OUTPUT_DIR, text.category);
    const workDir = join(categoryDir, text.slug);

    if (!existsSync(workDir)) {
      mkdirSync(workDir, { recursive: true });
    }

    let downloaded = 0;
    let skipped = 0;
    let failed = 0;

    for (let i = text.startNum; i <= text.endNum; i++) {
      const paddedNum = String(i).padStart(2, '0');
      const fileKey = `${text.category}/${text.slug}/${paddedNum}`;

      if (existingFiles.has(fileKey)) {
        skipped++;
        totalSkipped++;
        continue;
      }

      await rateLimiter();
      const data = await downloadPage(text, i);

      if (data) {
        const filepath = join(workDir, `${paddedNum}.json`);
        writeFileSync(filepath, JSON.stringify(data, null, 2));
        downloaded++;
        totalDownloaded++;
        logger.info(`  [${downloaded}] Page ${paddedNum}: ${data.title?.substring(0, 50)}... (${data.wordCount} words)`);
      } else {
        failed++;
        totalFailed++;
      }

      await sleep(200);
    }

    logger.success(`  ${text.name}: ${downloaded} downloaded, ${skipped} skipped, ${failed} not found`);
  }

  // Summary
  logger.info('\n=== Download Complete ===');
  logger.success(`Total downloaded: ${totalDownloaded} pages`);
  logger.info(`Total skipped (existing): ${totalSkipped} pages`);
  if (totalFailed > 0) {
    logger.info(`Total not found: ${totalFailed} pages (some expected)`);
  }

  // Count files by category
  logger.info('\nFiles by category:');
  if (existsSync(OUTPUT_DIR)) {
    const categories = readdirSync(OUTPUT_DIR);
    for (const cat of categories) {
      const catDir = join(OUTPUT_DIR, cat);
      try {
        const works = readdirSync(catDir);
        let catTotal = 0;
        for (const work of works) {
          const workDir = join(catDir, work);
          try {
            const files = readdirSync(workDir).filter(f => f.endsWith('.json'));
            logger.info(`  ${cat}/${work}: ${files.length} files`);
            catTotal += files.length;
          } catch {
            // Not a directory
          }
        }
      } catch {
        // Not a directory
      }
    }
  }
}

// Run
downloadNorseMythology().catch(console.error);

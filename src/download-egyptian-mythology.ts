/**
 * Egyptian Mythology downloader - from sacred-texts.com
 * Usage: bun src/download-egyptian-mythology.ts
 *
 * Downloads:
 * - Egyptian Book of the Dead (41 pages)
 * - Egyptian Myth and Legend (40 pages)
 * - Legends of the Gods (66 pages)
 * - Pyramid Texts (62 pages)
 * - Ancient Egyptian Legends (17 pages)
 * - Book of Am-Tuat (15 pages)
 * - Book of Gates (28 pages)
 * - Egyptian Heaven and Hell (29 pages)
 * - Development of Religion (15 pages)
 */

import * as cheerio from 'cheerio';
import { writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { fetchWithRetry, createRateLimiter, sleep } from './lib/http.js';
import { createLogger } from './lib/logger.js';

const logger = createLogger('egypt-myth');
const rateLimiter = createRateLimiter(0.5); // 1 request per 2 seconds

const BASE_URL = 'https://www.sacred-texts.com';
const OUTPUT_DIR = join(process.cwd(), 'generation', 'egyptian-mythology');

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
    name: 'Egyptian Book of the Dead',
    slug: 'book-of-the-dead',
    basePath: '/egy/ebod',
    filePrefix: 'ebod',
    startNum: 0,
    endNum: 41,
    category: 'sacred-texts',
  },
  {
    name: 'Egyptian Myth and Legend',
    slug: 'myth-and-legend',
    basePath: '/egy/eml',
    filePrefix: 'eml',
    startNum: 0,
    endNum: 40,
    category: 'mythology',
  },
  {
    name: 'Legends of the Gods',
    slug: 'legends-of-the-gods',
    basePath: '/egy/leg',
    filePrefix: 'leg',
    startNum: 0,
    endNum: 66,
    category: 'mythology',
  },
  {
    name: 'Pyramid Texts',
    slug: 'pyramid-texts',
    basePath: '/egy/pyt',
    filePrefix: 'pyt',
    startNum: 0,
    endNum: 62,
    category: 'sacred-texts',
  },
  {
    name: 'Ancient Egyptian Legends',
    slug: 'ancient-legends',
    basePath: '/egy/ael',
    filePrefix: 'ael',
    startNum: 0,
    endNum: 17,
    category: 'mythology',
  },
  {
    name: 'Book of Am-Tuat',
    slug: 'book-of-am-tuat',
    basePath: '/egy/bat',
    filePrefix: 'bat',
    startNum: 0,
    endNum: 15,
    category: 'afterlife',
  },
  {
    name: 'Book of Gates',
    slug: 'book-of-gates',
    basePath: '/egy/gate',
    filePrefix: 'gate',
    startNum: 0,
    endNum: 28,
    category: 'afterlife',
  },
  {
    name: 'Egyptian Heaven and Hell',
    slug: 'heaven-and-hell',
    basePath: '/egy/ehh',
    filePrefix: 'ehh',
    startNum: 0,
    endNum: 29,
    category: 'afterlife',
  },
  {
    name: 'Development of Religion and Thought',
    slug: 'religion-and-thought',
    basePath: '/egy/rtae',
    filePrefix: 'rtae',
    startNum: 0,
    endNum: 15,
    category: 'history',
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

    // Extract title from h1, h2, h3, or title tag
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

    // Also get blockquote text
    $('blockquote').each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 20) {
        paragraphs.push(text);
      }
    });

    // Get text from pre tags (formatted content)
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
async function downloadEgyptianMythology() {
  logger.info('=== Downloading Egyptian Mythology from Sacred-Texts.com ===');

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
        for (const work of works) {
          const workDir = join(catDir, work);
          try {
            const files = readdirSync(workDir).filter(f => f.endsWith('.json'));
            logger.info(`  ${cat}/${work}: ${files.length} files`);
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
downloadEgyptianMythology().catch(console.error);

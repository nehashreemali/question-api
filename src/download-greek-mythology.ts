/**
 * Greek Mythology downloader - from Theoi.com
 * Usage: bun src/download-greek-mythology.ts
 */

import * as cheerio from 'cheerio';
import { writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { fetchWithRetry, createRateLimiter, sleep } from './lib/http.js';
import { createLogger } from './lib/logger.js';

const logger = createLogger('greek-myth');
const rateLimiter = createRateLimiter(0.5); // 1 request per 2 seconds (be nice to the server)

const BASE_URL = 'https://www.theoi.com';
const OUTPUT_DIR = join(process.cwd(), 'generation', 'greek-mythology');

// Category mappings based on URL directory
const CATEGORY_MAP: Record<string, string> = {
  'Olympios': 'olympian-gods',
  'Ouranios': 'sky-gods',
  'Khthonios': 'underworld-gods',
  'Titan': 'titans',
  'Protogenos': 'primordial-gods',
  'Georgikos': 'rustic-gods',
  'Pontios': 'sea-gods',
  'Daimon': 'spirits',
  'Heros': 'heroes',
  'Heroine': 'heroines',
  'Ther': 'creatures',
  'Gigante': 'giants',
  'Thaumasios': 'wondrous-creatures',
  'Nymphe': 'nymphs',
  'Potamos': 'river-gods',
  'Cult': 'cult',
  'Phasma': 'phantoms',
  'Phylos': 'tribes',
  'Phrygios': 'phrygian-gods',
};

// Index pages to scrape for entity links
const INDEX_PAGES = [
  '/greek-mythology/olympian-gods.html',
  '/greek-mythology/titans.html',
  '/greek-mythology/primeval-gods.html',
  '/greek-mythology/sky-gods.html',
  '/greek-mythology/sea-gods.html',
  '/greek-mythology/underworld-gods.html',
  '/greek-mythology/agricultural-gods.html',
  '/greek-mythology/rustic-gods.html',
  '/greek-mythology/bestiary.html',
  '/greek-mythology/heroes.html',
  '/greek-mythology/heracles.html',
  '/greek-mythology/giants.html',
  '/greek-mythology/dragons.html',
  '/greek-mythology/personifications.html',
  '/greek-mythology/deified-mortals.html',
  // Encyclopedia pages A-Z
  '/greek-mythology/encyclopedia-a.html',
  '/greek-mythology/encyclopedia-b.html',
  '/greek-mythology/encyclopedia-c.html',
  '/greek-mythology/encyclopedia-d.html',
  '/greek-mythology/encyclopedia-e.html',
  '/greek-mythology/encyclopedia-f.html',
  '/greek-mythology/encyclopedia-g.html',
  '/greek-mythology/encyclopedia-h.html',
  '/greek-mythology/encyclopedia-i.html',
  '/greek-mythology/encyclopedia-k.html',
  '/greek-mythology/encyclopedia-l.html',
  '/greek-mythology/encyclopedia-m.html',
  '/greek-mythology/encyclopedia-n.html',
  '/greek-mythology/encyclopedia-o.html',
  '/greek-mythology/encyclopedia-p.html',
  '/greek-mythology/encyclopedia-r.html',
  '/greek-mythology/encyclopedia-s.html',
  '/greek-mythology/encyclopedia-t.html',
  '/greek-mythology/encyclopedia-u.html',
  '/greek-mythology/encyclopedia-z.html',
];

interface EntityPage {
  url: string;
  category: string;
  slug: string;
}

/**
 * Extract all entity page links from an index page
 */
async function extractEntityLinks(indexUrl: string): Promise<EntityPage[]> {
  const entities: EntityPage[] = [];

  try {
    const html = await fetchWithRetry(`${BASE_URL}${indexUrl}`);
    const $ = cheerio.load(html);

    // Find all links that point to entity pages
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (!href) return;

      // Match entity page patterns like ../Olympios/Zeus.html or ../Titan/TitanAtlas.html
      const match = href.match(/\.\.\/([A-Za-z]+)\/([A-Za-z0-9]+)\.html/);
      if (match) {
        const [, dir, filename] = match;
        const category = CATEGORY_MAP[dir] || dir.toLowerCase();
        const slug = filename.toLowerCase().replace(/^(titan|titanis|nymphe|nymphai|potamos|gigante|daimon)/, '');

        entities.push({
          url: `/${dir}/${filename}.html`,
          category,
          slug: slug || filename.toLowerCase(),
        });
      }
    });
  } catch (e: any) {
    logger.warn(`Failed to fetch index page ${indexUrl}: ${e.message}`);
  }

  return entities;
}

/**
 * Download and parse a single entity page
 */
async function downloadEntityPage(entity: EntityPage): Promise<any | null> {
  try {
    const html = await fetchWithRetry(`${BASE_URL}${entity.url}`);
    const $ = cheerio.load(html);

    // Extract title (usually in h1 or first major heading)
    const title = $('h1').first().text().trim() ||
                  $('h2').first().text().trim() ||
                  $('title').text().replace(' - Theoi Greek Mythology', '').trim();

    // Extract Greek name if present
    const greekName = $('span.greek').first().text().trim() || '';

    // Extract main content - the mythology section
    // Remove navigation elements, ads, etc.
    $('script').remove();
    $('style').remove();
    $('nav').remove();
    $('header').remove();
    $('footer').remove();
    $('.navigation').remove();

    // Get all text content from the main body
    const paragraphs: string[] = [];
    $('p').each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 50) { // Skip short navigation text
        paragraphs.push(text);
      }
    });

    // Get section headings for structure
    const sections: string[] = [];
    $('h2, h3, h4').each((_, el) => {
      const text = $(el).text().trim();
      if (text && !text.includes('Navigation') && !text.includes('Index')) {
        sections.push(text);
      }
    });

    // Get quotes from classical sources
    const quotes: string[] = [];
    $('blockquote, .quote').each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 20) {
        quotes.push(text);
      }
    });

    // Full content for question generation
    const fullContent = paragraphs.join('\n\n');

    if (fullContent.length < 100) {
      return null; // Skip pages with too little content
    }

    return {
      title,
      greekName,
      category: entity.category,
      slug: entity.slug,
      sections,
      content: fullContent,
      quotes,
      source: 'theoi.com',
      sourceUrl: `${BASE_URL}${entity.url}`,
      scrapedAt: new Date().toISOString(),
      wordCount: fullContent.split(/\s+/).length,
    };
  } catch (e: any) {
    logger.warn(`Failed to download ${entity.url}: ${e.message}`);
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
      const files = readdirSync(catDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          existing.add(`${cat}/${file.replace('.json', '')}`);
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
async function downloadGreekMythology() {
  logger.info('=== Downloading Greek Mythology from Theoi.com ===');

  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Step 1: Collect all entity URLs from index pages
  logger.info('\nStep 1: Collecting entity URLs from index pages...');
  const allEntities: EntityPage[] = [];
  const seenUrls = new Set<string>();

  for (const indexPage of INDEX_PAGES) {
    await rateLimiter();
    const entities = await extractEntityLinks(indexPage);

    for (const entity of entities) {
      if (!seenUrls.has(entity.url)) {
        seenUrls.add(entity.url);
        allEntities.push(entity);
      }
    }

    logger.info(`  ${indexPage}: found ${entities.length} entities (${allEntities.length} total unique)`);
    await sleep(500);
  }

  logger.success(`\nFound ${allEntities.length} unique entity pages to download`);

  // Step 2: Get existing files to skip
  const existingFiles = getExistingFiles();
  logger.info(`Already downloaded: ${existingFiles.size} files`);

  // Step 3: Download each entity page
  logger.info('\nStep 2: Downloading entity pages...');
  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const entity of allEntities) {
    const fileKey = `${entity.category}/${entity.slug}`;

    if (existingFiles.has(fileKey)) {
      skipped++;
      continue;
    }

    await rateLimiter();
    const data = await downloadEntityPage(entity);

    if (data) {
      // Create category directory if needed
      const catDir = join(OUTPUT_DIR, entity.category);
      if (!existsSync(catDir)) {
        mkdirSync(catDir, { recursive: true });
      }

      // Save the file
      const filepath = join(catDir, `${entity.slug}.json`);
      writeFileSync(filepath, JSON.stringify(data, null, 2));

      downloaded++;
      logger.info(`  [${downloaded}/${allEntities.length - skipped}] ${entity.category}/${entity.slug} (${data.wordCount} words)`);
    } else {
      failed++;
    }

    await sleep(300);
  }

  // Summary
  logger.info('\n=== Download Complete ===');
  logger.success(`Downloaded: ${downloaded} pages`);
  logger.info(`Skipped (existing): ${skipped} pages`);
  if (failed > 0) {
    logger.warn(`Failed: ${failed} pages`);
  }

  // Count files by category
  logger.info('\nFiles by category:');
  if (existsSync(OUTPUT_DIR)) {
    const categories = readdirSync(OUTPUT_DIR);
    for (const cat of categories) {
      const catDir = join(OUTPUT_DIR, cat);
      try {
        const files = readdirSync(catDir).filter(f => f.endsWith('.json'));
        logger.info(`  ${cat}: ${files.length} files`);
      } catch {
        // Not a directory
      }
    }
  }
}

// Run
downloadGreekMythology().catch(console.error);

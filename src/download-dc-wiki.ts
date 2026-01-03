/**
 * DC Wiki downloader
 * Usage: bun src/download-dc-wiki.ts
 *
 * Downloads curated DC content from DC Movies Wiki
 * Focuses on DC Extended Universe and major DC films
 */

import * as cheerio from 'cheerio';
import { writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { fetchWithRetry, createRateLimiter, sleep } from './lib/http.js';
import { createLogger } from './lib/logger.js';

const logger = createLogger('dc-wiki');
const rateLimiter = createRateLimiter(0.5);

const BASE_URL = 'https://dcextendeduniverse.fandom.com/wiki';
const OUTPUT_DIR = join(process.cwd(), 'generation', 'dc-wiki');

interface WikiPage {
  slug: string;
  category: string;
}

// Curated list of important DC content
const PAGES: WikiPage[] = [
  // === JUSTICE LEAGUE HEROES ===
  { slug: 'Clark_Kent', category: 'heroes' },
  { slug: 'Bruce_Wayne', category: 'heroes' },
  { slug: 'Diana_Prince', category: 'heroes' },
  { slug: 'Arthur_Curry', category: 'heroes' },
  { slug: 'Barry_Allen', category: 'heroes' },
  { slug: 'Victor_Stone', category: 'heroes' },
  { slug: 'Billy_Batson', category: 'heroes' },
  { slug: 'Harley_Quinn', category: 'heroes' },
  { slug: 'Dinah_Lance', category: 'heroes' },
  { slug: 'Helena_Bertinelli', category: 'heroes' },
  { slug: 'Floyd_Lawton', category: 'heroes' },
  { slug: 'Rick_Flag', category: 'heroes' },
  { slug: 'Ratcatcher_2', category: 'heroes' },
  { slug: 'Nanaue', category: 'heroes' },
  { slug: 'Bloodsport', category: 'heroes' },
  { slug: 'Peacemaker', category: 'heroes' },
  { slug: 'Jaime_Reyes', category: 'heroes' },
  { slug: 'Kara_Zor-El', category: 'heroes' },

  // === MAIN VILLAINS ===
  { slug: 'General_Zod', category: 'villains' },
  { slug: 'Lex_Luthor', category: 'villains' },
  { slug: 'Doomsday', category: 'villains' },
  { slug: 'Steppenwolf', category: 'villains' },
  { slug: 'Darkseid', category: 'villains' },
  { slug: 'Ares', category: 'villains' },
  { slug: 'Ocean_Master', category: 'villains' },
  { slug: 'Black_Manta', category: 'villains' },
  { slug: 'Doctor_Thaddeus_Sivana', category: 'villains' },
  { slug: 'The_Joker', category: 'villains' },
  { slug: 'Enchantress', category: 'villains' },
  { slug: 'Cheetah', category: 'villains' },
  { slug: 'Maxwell_Lord', category: 'villains' },
  { slug: 'Black_Adam', category: 'villains' },
  { slug: 'Intergang', category: 'villains' },
  { slug: 'Amanda_Waller', category: 'villains' },

  // === SUPPORTING CHARACTERS ===
  { slug: 'Alfred_Pennyworth', category: 'supporting' },
  { slug: 'Lois_Lane', category: 'supporting' },
  { slug: 'Martha_Kent', category: 'supporting' },
  { slug: 'Jonathan_Kent', category: 'supporting' },
  { slug: 'Perry_White', category: 'supporting' },
  { slug: 'Steve_Trevor', category: 'supporting' },
  { slug: 'Hippolyta', category: 'supporting' },
  { slug: 'Antiope', category: 'supporting' },
  { slug: 'Mera', category: 'supporting' },
  { slug: 'Thomas_Curry', category: 'supporting' },
  { slug: 'Atlanna', category: 'supporting' },
  { slug: 'Vulko', category: 'supporting' },
  { slug: 'Commissioner_Gordon', category: 'supporting' },
  { slug: 'Iris_West', category: 'supporting' },
  { slug: 'Henry_Allen', category: 'supporting' },
  { slug: 'Nora_Allen', category: 'supporting' },
  { slug: 'Mary_Bromfield', category: 'supporting' },
  { slug: 'Freddy_Freeman', category: 'supporting' },
  { slug: 'Rosa_Vasquez', category: 'supporting' },
  { slug: 'Doctor_Fate', category: 'supporting' },
  { slug: 'Hawkman', category: 'supporting' },

  // === DCEU FILMS ===
  { slug: 'Man_of_Steel', category: 'films' },
  { slug: 'Batman_v_Superman:_Dawn_of_Justice', category: 'films' },
  { slug: 'Suicide_Squad_(film)', category: 'films' },
  { slug: 'Wonder_Woman_(film)', category: 'films' },
  { slug: 'Justice_League_(film)', category: 'films' },
  { slug: 'Aquaman_(film)', category: 'films' },
  { slug: 'Shazam!_(film)', category: 'films' },
  { slug: 'Birds_of_Prey_(film)', category: 'films' },
  { slug: 'Wonder_Woman_1984', category: 'films' },
  { slug: 'Zack_Snyder%27s_Justice_League', category: 'films' },
  { slug: 'The_Suicide_Squad', category: 'films' },
  { slug: 'Black_Adam_(film)', category: 'films' },
  { slug: 'Shazam!_Fury_of_the_Gods', category: 'films' },
  { slug: 'The_Flash_(film)', category: 'films' },
  { slug: 'Blue_Beetle_(film)', category: 'films' },
  { slug: 'Aquaman_and_the_Lost_Kingdom', category: 'films' },

  // === DC TV SHOWS ===
  { slug: 'Peacemaker_(TV_series)', category: 'series' },

  // === JOKER FILMS ===
  { slug: 'Joker_(film)', category: 'films' },
  { slug: 'Arthur_Fleck', category: 'characters' },

  // === BATMAN FILMS ===
  { slug: 'The_Batman_(film)', category: 'films' },
  { slug: 'Bruce_Wayne_(The_Batman)', category: 'characters' },
  { slug: 'Selina_Kyle_(The_Batman)', category: 'characters' },
  { slug: 'The_Riddler_(The_Batman)', category: 'characters' },
  { slug: 'The_Penguin_(The_Batman)', category: 'characters' },
  { slug: 'Carmine_Falcone_(The_Batman)', category: 'characters' },

  // === LOCATIONS ===
  { slug: 'Metropolis', category: 'locations' },
  { slug: 'Gotham_City', category: 'locations' },
  { slug: 'Smallville', category: 'locations' },
  { slug: 'Themyscira', category: 'locations' },
  { slug: 'Atlantis', category: 'locations' },
  { slug: 'Apokolips', category: 'locations' },
  { slug: 'Batcave', category: 'locations' },
  { slug: 'Fortress_of_Solitude', category: 'locations' },
  { slug: 'Belle_Reve', category: 'locations' },
  { slug: 'Corto_Maltese', category: 'locations' },
  { slug: 'Khandaq', category: 'locations' },
  { slug: 'Kahndaq_Palace', category: 'locations' },

  // === ORGANIZATIONS ===
  { slug: 'Justice_League', category: 'organizations' },
  { slug: 'Task_Force_X', category: 'organizations' },
  { slug: 'Amazons', category: 'organizations' },
  { slug: 'Atlantean_Army', category: 'organizations' },
  { slug: 'A.R.G.U.S.', category: 'organizations' },
  { slug: 'LexCorp', category: 'organizations' },
  { slug: 'Wayne_Enterprises', category: 'organizations' },
  { slug: 'Daily_Planet', category: 'organizations' },
  { slug: 'Justice_Society_of_America', category: 'organizations' },
  { slug: 'Birds_of_Prey', category: 'organizations' },
  { slug: 'Kryptonian_Military_Guild', category: 'organizations' },

  // === KEY ITEMS & TECHNOLOGY ===
  { slug: 'Batsuit', category: 'items' },
  { slug: 'Batmobile', category: 'items' },
  { slug: 'Batarang', category: 'items' },
  { slug: 'Batwing', category: 'items' },
  { slug: 'Trident_of_Atlan', category: 'items' },
  { slug: 'Lasso_of_Hestia', category: 'items' },
  { slug: 'Bracelets_of_Submission', category: 'items' },
  { slug: 'God_Killer', category: 'items' },
  { slug: 'Mother_Boxes', category: 'items' },
  { slug: 'Anti-Life_Equation', category: 'items' },
  { slug: 'Kryptonite', category: 'items' },
  { slug: 'Kryptonian_Command_Key', category: 'items' },
  { slug: 'Staff_of_Champions', category: 'items' },
  { slug: 'Rock_of_Eternity', category: 'items' },
  { slug: 'Scarab', category: 'items' },
  { slug: 'Helmet_of_Fate', category: 'items' },

  // === KEY EVENTS ===
  { slug: 'Battle_of_Smallville', category: 'events' },
  { slug: 'Black_Zero_Event', category: 'events' },
  { slug: 'Duel_of_Gotham_City', category: 'events' },
  { slug: 'Battle_of_Metropolis', category: 'events' },
  { slug: 'Invasion_of_Earth', category: 'events' },
  { slug: 'Battle_of_Themyscira', category: 'events' },
  { slug: 'Battle_of_Veld', category: 'events' },
  { slug: 'Battle_of_the_Brine', category: 'events' },
  { slug: 'Battle_for_Atlantis', category: 'events' },
  { slug: 'Battle_of_Philadelphia', category: 'events' },

  // === CONCEPTS & POWERS ===
  { slug: 'Kryptonian', category: 'species' },
  { slug: 'Atlantean', category: 'species' },
  { slug: 'Amazon', category: 'species' },
  { slug: 'Parademons', category: 'species' },
  { slug: 'New_God', category: 'species' },
  { slug: 'Speed_Force', category: 'concepts' },
  { slug: 'Shazam', category: 'concepts' },
  { slug: 'Multiverse', category: 'concepts' },
];

/**
 * Download and parse a wiki page
 */
async function downloadWikiPage(page: WikiPage): Promise<any | null> {
  const url = `${BASE_URL}/${page.slug}`;

  try {
    const html = await fetchWithRetry(url);
    const $ = cheerio.load(html);

    const title = $('h1.page-header__title, h1#firstHeading, h2.pi-title').first().text().trim() ||
                  $('meta[property="og:title"]').attr('content') ||
                  decodeURIComponent(page.slug.replace(/_/g, ' '));

    // Remove unwanted elements
    $('script').remove();
    $('style').remove();
    $('nav').remove();
    $('footer').remove();
    $('aside').remove();
    $('.mw-editsection').remove();
    $('.references').remove();
    $('[class*="navigation"]').remove();
    $('[class*="infobox"]').remove();
    $('[class*="navbox"]').remove();
    $('[class*="sidebar"]').remove();
    $('[class*="ad-"]').remove();
    $('table').remove();

    const paragraphs: string[] = [];
    const contentSelectors = [
      '.mw-parser-output > p',
      '#mw-content-text p',
      '.WikiaArticle p',
      'article p',
      '.page-content p',
    ];

    for (const selector of contentSelectors) {
      $(selector).each((_, el) => {
        const text = $(el).text().trim();
        if (text.length > 50) {
          paragraphs.push(text);
        }
      });
      if (paragraphs.length > 0) break;
    }

    if (paragraphs.length === 0) {
      $('p').each((_, el) => {
        const text = $(el).text().trim();
        if (text.length > 50) {
          paragraphs.push(text);
        }
      });
    }

    const sections: string[] = [];
    $('h2, h3').each((_, el) => {
      const text = $(el).text().trim()
        .replace(/\[edit\]/, '')
        .replace(/\[edit source\]/, '')
        .trim();
      if (text && !text.includes('Contents') && !text.includes('Navigation') &&
          !text.includes('References') && !text.includes('External links')) {
        sections.push(text);
      }
    });

    const fullContent = paragraphs.join('\n\n');

    if (fullContent.length < 200) {
      logger.warn(`  Skipping ${page.slug}: insufficient content (${fullContent.length} chars)`);
      return null;
    }

    return {
      title,
      slug: page.slug,
      category: page.category,
      sections,
      content: fullContent,
      source: 'dcextendeduniverse.fandom.com',
      sourceUrl: url,
      scrapedAt: new Date().toISOString(),
      wordCount: fullContent.split(/\s+/).length,
    };
  } catch (e: any) {
    logger.warn(`Failed to download ${page.slug}: ${e.message}`);
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
async function downloadDCWiki() {
  logger.info('=== Downloading DC Wiki ===');
  logger.info(`Total pages to download: ${PAGES.length}`);

  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const existingFiles = getExistingFiles();
  logger.info(`Already downloaded: ${existingFiles.size} files`);

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const page of PAGES) {
    const fileKey = `${page.category}/${page.slug}`;

    if (existingFiles.has(fileKey)) {
      skipped++;
      continue;
    }

    await rateLimiter();
    const data = await downloadWikiPage(page);

    if (data) {
      const categoryDir = join(OUTPUT_DIR, page.category);
      if (!existsSync(categoryDir)) {
        mkdirSync(categoryDir, { recursive: true });
      }

      const filepath = join(categoryDir, `${page.slug}.json`);
      writeFileSync(filepath, JSON.stringify(data, null, 2));

      downloaded++;
      logger.info(`[${downloaded}/${PAGES.length - skipped}] ${page.category}/${page.slug} (${data.wordCount} words)`);
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
downloadDCWiki().catch(console.error);

/**
 * Marvel MCU Wiki downloader
 * Usage: bun src/download-marvel-wiki.ts
 *
 * Downloads curated MCU content from Marvel Cinematic Universe Wiki
 * Focuses on MCU specifically (not comics)
 */

import * as cheerio from 'cheerio';
import { writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { fetchWithRetry, createRateLimiter, sleep } from './lib/http.js';
import { createLogger } from './lib/logger.js';

const logger = createLogger('marvel');
const rateLimiter = createRateLimiter(0.5); // 1 request per 2 seconds

const BASE_URL = 'https://marvelcinematicuniverse.fandom.com/wiki';
const OUTPUT_DIR = join(process.cwd(), 'generation', 'marvel-wiki');

interface WikiPage {
  slug: string;
  category: string;
}

// Curated list of important MCU content
const PAGES: WikiPage[] = [
  // === AVENGERS MAIN HEROES ===
  { slug: 'Tony_Stark', category: 'heroes' },
  { slug: 'Steve_Rogers', category: 'heroes' },
  { slug: 'Thor_Odinson', category: 'heroes' },
  { slug: 'Bruce_Banner', category: 'heroes' },
  { slug: 'Natasha_Romanoff', category: 'heroes' },
  { slug: 'Clint_Barton', category: 'heroes' },
  { slug: 'Peter_Parker', category: 'heroes' },
  { slug: 'Scott_Lang', category: 'heroes' },
  { slug: 'Hope_van_Dyne', category: 'heroes' },
  { slug: 'T%27Challa', category: 'heroes' },
  { slug: 'Stephen_Strange', category: 'heroes' },
  { slug: 'Wanda_Maximoff', category: 'heroes' },
  { slug: 'Vision', category: 'heroes' },
  { slug: 'Sam_Wilson', category: 'heroes' },
  { slug: 'James_Rhodes', category: 'heroes' },
  { slug: 'Bucky_Barnes', category: 'heroes' },
  { slug: 'Carol_Danvers', category: 'heroes' },
  { slug: 'Peter_Quill', category: 'heroes' },
  { slug: 'Gamora', category: 'heroes' },
  { slug: 'Drax', category: 'heroes' },
  { slug: 'Rocket_Raccoon', category: 'heroes' },
  { slug: 'Groot', category: 'heroes' },
  { slug: 'Mantis', category: 'heroes' },
  { slug: 'Nebula', category: 'heroes' },
  { slug: 'Shuri', category: 'heroes' },
  { slug: 'Okoye', category: 'heroes' },

  // === NEW GENERATION HEROES ===
  { slug: 'Kate_Bishop', category: 'heroes' },
  { slug: 'Yelena_Belova', category: 'heroes' },
  { slug: 'Shang-Chi', category: 'heroes' },
  { slug: 'Kamala_Khan', category: 'heroes' },
  { slug: 'Jennifer_Walters', category: 'heroes' },
  { slug: 'Marc_Spector', category: 'heroes' },
  { slug: 'America_Chavez', category: 'heroes' },
  { slug: 'Riri_Williams', category: 'heroes' },

  // === MAIN VILLAINS ===
  { slug: 'Thanos', category: 'villains' },
  { slug: 'Loki_Laufeyson', category: 'villains' },
  { slug: 'Ultron', category: 'villains' },
  { slug: 'Hela', category: 'villains' },
  { slug: 'Erik_Killmonger', category: 'villains' },
  { slug: 'Ego', category: 'villains' },
  { slug: 'Ronan_the_Accuser', category: 'villains' },
  { slug: 'Red_Skull', category: 'villains' },
  { slug: 'Obadiah_Stane', category: 'villains' },
  { slug: 'Justin_Hammer', category: 'villains' },
  { slug: 'Ivan_Vanko', category: 'villains' },
  { slug: 'Aldrich_Killian', category: 'villains' },
  { slug: 'Malekith', category: 'villains' },
  { slug: 'Alexander_Pierce', category: 'villains' },
  { slug: 'Brock_Rumlow', category: 'villains' },
  { slug: 'Helmut_Zemo', category: 'villains' },
  { slug: 'Adrian_Toomes', category: 'villains' },
  { slug: 'Quentin_Beck', category: 'villains' },
  { slug: 'Xu_Wenwu', category: 'villains' },
  { slug: 'Gorr', category: 'villains' },
  { slug: 'High_Evolutionary', category: 'villains' },
  { slug: 'Kang_the_Conqueror', category: 'villains' },
  { slug: 'Wanda_Maximoff', category: 'villains' }, // Duplicate OK - she's a villain in some films
  { slug: 'Agatha_Harkness', category: 'villains' },
  { slug: 'Arthur_Harrow', category: 'villains' },
  { slug: 'Kingpin', category: 'villains' },

  // === SUPPORTING CHARACTERS ===
  { slug: 'Pepper_Potts', category: 'supporting' },
  { slug: 'Nick_Fury', category: 'supporting' },
  { slug: 'Maria_Hill', category: 'supporting' },
  { slug: 'Phil_Coulson', category: 'supporting' },
  { slug: 'Happy_Hogan', category: 'supporting' },
  { slug: 'J.A.R.V.I.S.', category: 'supporting' },
  { slug: 'F.R.I.D.A.Y.', category: 'supporting' },
  { slug: 'Peggy_Carter', category: 'supporting' },
  { slug: 'Howard_Stark', category: 'supporting' },
  { slug: 'Jane_Foster', category: 'supporting' },
  { slug: 'Erik_Selvig', category: 'supporting' },
  { slug: 'Darcy_Lewis', category: 'supporting' },
  { slug: 'Wong', category: 'supporting' },
  { slug: 'The_Ancient_One', category: 'supporting' },
  { slug: 'May_Parker', category: 'supporting' },
  { slug: 'Ned_Leeds', category: 'supporting' },
  { slug: 'MJ', category: 'supporting' },
  { slug: 'Hank_Pym', category: 'supporting' },
  { slug: 'Janet_van_Dyne', category: 'supporting' },
  { slug: 'M%27Baku', category: 'supporting' },
  { slug: 'Nakia', category: 'supporting' },
  { slug: 'Ramonda', category: 'supporting' },
  { slug: 'Korg', category: 'supporting' },
  { slug: 'Valkyrie', category: 'supporting' },
  { slug: 'Heimdall', category: 'supporting' },
  { slug: 'Sif', category: 'supporting' },
  { slug: 'Odin', category: 'supporting' },
  { slug: 'Frigga', category: 'supporting' },
  { slug: 'Yondu_Udonta', category: 'supporting' },
  { slug: 'Maria_Rambeau', category: 'supporting' },
  { slug: 'Monica_Rambeau', category: 'supporting' },
  { slug: 'Talos', category: 'supporting' },

  // === INFINITY SAGA FILMS ===
  { slug: 'Iron_Man_(film)', category: 'films' },
  { slug: 'The_Incredible_Hulk', category: 'films' },
  { slug: 'Iron_Man_2', category: 'films' },
  { slug: 'Thor_(film)', category: 'films' },
  { slug: 'Captain_America:_The_First_Avenger', category: 'films' },
  { slug: 'The_Avengers', category: 'films' },
  { slug: 'Iron_Man_3', category: 'films' },
  { slug: 'Thor:_The_Dark_World', category: 'films' },
  { slug: 'Captain_America:_The_Winter_Soldier', category: 'films' },
  { slug: 'Guardians_of_the_Galaxy_(film)', category: 'films' },
  { slug: 'Avengers:_Age_of_Ultron', category: 'films' },
  { slug: 'Ant-Man_(film)', category: 'films' },
  { slug: 'Captain_America:_Civil_War', category: 'films' },
  { slug: 'Doctor_Strange_(film)', category: 'films' },
  { slug: 'Guardians_of_the_Galaxy_Vol._2', category: 'films' },
  { slug: 'Spider-Man:_Homecoming', category: 'films' },
  { slug: 'Thor:_Ragnarok', category: 'films' },
  { slug: 'Black_Panther_(film)', category: 'films' },
  { slug: 'Avengers:_Infinity_War', category: 'films' },
  { slug: 'Ant-Man_and_the_Wasp', category: 'films' },
  { slug: 'Captain_Marvel_(film)', category: 'films' },
  { slug: 'Avengers:_Endgame', category: 'films' },
  { slug: 'Spider-Man:_Far_From_Home', category: 'films' },

  // === MULTIVERSE SAGA FILMS ===
  { slug: 'Black_Widow_(film)', category: 'films' },
  { slug: 'Shang-Chi_and_the_Legend_of_the_Ten_Rings', category: 'films' },
  { slug: 'Eternals_(film)', category: 'films' },
  { slug: 'Spider-Man:_No_Way_Home', category: 'films' },
  { slug: 'Doctor_Strange_in_the_Multiverse_of_Madness', category: 'films' },
  { slug: 'Thor:_Love_and_Thunder', category: 'films' },
  { slug: 'Black_Panther:_Wakanda_Forever', category: 'films' },
  { slug: 'Ant-Man_and_the_Wasp:_Quantumania', category: 'films' },
  { slug: 'Guardians_of_the_Galaxy_Vol._3', category: 'films' },
  { slug: 'The_Marvels', category: 'films' },
  { slug: 'Deadpool_%26_Wolverine', category: 'films' },

  // === DISNEY+ SERIES ===
  { slug: 'WandaVision', category: 'series' },
  { slug: 'The_Falcon_and_the_Winter_Soldier', category: 'series' },
  { slug: 'Loki_(TV_series)', category: 'series' },
  { slug: 'What_If...%3F', category: 'series' },
  { slug: 'Hawkeye_(TV_series)', category: 'series' },
  { slug: 'Moon_Knight_(TV_series)', category: 'series' },
  { slug: 'Ms._Marvel_(TV_series)', category: 'series' },
  { slug: 'She-Hulk:_Attorney_at_Law', category: 'series' },
  { slug: 'Secret_Invasion_(TV_series)', category: 'series' },
  { slug: 'Agatha_All_Along', category: 'series' },

  // === ORGANIZATIONS ===
  { slug: 'Avengers', category: 'organizations' },
  { slug: 'S.H.I.E.L.D.', category: 'organizations' },
  { slug: 'HYDRA', category: 'organizations' },
  { slug: 'Guardians_of_the_Galaxy_(team)', category: 'organizations' },
  { slug: 'Dora_Milaje', category: 'organizations' },
  { slug: 'Ten_Rings', category: 'organizations' },
  { slug: 'Ravagers', category: 'organizations' },
  { slug: 'Stark_Industries', category: 'organizations' },
  { slug: 'Pym_Technologies', category: 'organizations' },
  { slug: 'Black_Order', category: 'organizations' },
  { slug: 'Masters_of_the_Mystic_Arts', category: 'organizations' },
  { slug: 'Eternals', category: 'organizations' },
  { slug: 'Thunderbolts', category: 'organizations' },

  // === LOCATIONS ===
  { slug: 'Asgard', category: 'locations' },
  { slug: 'Wakanda', category: 'locations' },
  { slug: 'Stark_Tower', category: 'locations' },
  { slug: 'Avengers_Compound', category: 'locations' },
  { slug: 'Sanctum_Sanctorum', category: 'locations' },
  { slug: 'Kamar-Taj', category: 'locations' },
  { slug: 'Knowhere', category: 'locations' },
  { slug: 'Xandar', category: 'locations' },
  { slug: 'Vormir', category: 'locations' },
  { slug: 'Titan', category: 'locations' },
  { slug: 'Nidavellir', category: 'locations' },
  { slug: 'Sakaar', category: 'locations' },
  { slug: 'Quantum_Realm', category: 'locations' },
  { slug: 'Ta_Lo', category: 'locations' },
  { slug: 'K%27un-Lun', category: 'locations' },

  // === KEY ITEMS & TECHNOLOGY ===
  { slug: 'Infinity_Stones', category: 'items' },
  { slug: 'Space_Stone', category: 'items' },
  { slug: 'Mind_Stone', category: 'items' },
  { slug: 'Reality_Stone', category: 'items' },
  { slug: 'Power_Stone', category: 'items' },
  { slug: 'Time_Stone', category: 'items' },
  { slug: 'Soul_Stone', category: 'items' },
  { slug: 'Infinity_Gauntlet', category: 'items' },
  { slug: 'Tesseract', category: 'items' },
  { slug: 'Scepter', category: 'items' },
  { slug: 'Mjolnir', category: 'items' },
  { slug: 'Stormbreaker', category: 'items' },
  { slug: 'Captain_America%27s_Shield', category: 'items' },
  { slug: 'Iron_Man_Armor', category: 'items' },
  { slug: 'Panther_Habit', category: 'items' },
  { slug: 'Web-Shooters', category: 'items' },
  { slug: 'Arc_Reactor', category: 'items' },
  { slug: 'Vibranium', category: 'items' },
  { slug: 'Pym_Particles', category: 'items' },
  { slug: 'Eye_of_Agamotto', category: 'items' },
  { slug: 'Cloak_of_Levitation', category: 'items' },
  { slug: 'Ten_Rings_(weapons)', category: 'items' },
  { slug: 'Heart-Shaped_Herb', category: 'items' },

  // === KEY EVENTS ===
  { slug: 'Battle_of_New_York', category: 'events' },
  { slug: 'Battle_of_Sokovia', category: 'events' },
  { slug: 'Clash_of_the_Avengers', category: 'events' },
  { slug: 'Battle_of_Wakanda', category: 'events' },
  { slug: 'Snap', category: 'events' },
  { slug: 'Blip', category: 'events' },
  { slug: 'Battle_of_Earth', category: 'events' },
  { slug: 'Battle_of_Titan', category: 'events' },
  { slug: 'Time_Heist', category: 'events' },
  { slug: 'Westview_Anomaly', category: 'events' },
  { slug: 'Incursion', category: 'events' },

  // === CONCEPTS ===
  { slug: 'Multiverse', category: 'concepts' },
  { slug: 'Sacred_Timeline', category: 'concepts' },
  { slug: 'Time_Variance_Authority', category: 'concepts' },
  { slug: 'Super_Soldier_Serum', category: 'concepts' },
  { slug: 'Extremis', category: 'concepts' },
  { slug: 'Darkhold', category: 'concepts' },
];

/**
 * Download and parse a wiki page
 */
async function downloadWikiPage(page: WikiPage): Promise<any | null> {
  const url = `${BASE_URL}/${page.slug}`;

  try {
    const html = await fetchWithRetry(url);
    const $ = cheerio.load(html);

    // Get title from page
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

    // Extract main content paragraphs
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

    // If no paragraphs found, try getting all p tags
    if (paragraphs.length === 0) {
      $('p').each((_, el) => {
        const text = $(el).text().trim();
        if (text.length > 50) {
          paragraphs.push(text);
        }
      });
    }

    // Extract headings for structure
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

    // Skip if too little content
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
      source: 'marvelcinematicuniverse.fandom.com',
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
async function downloadMarvelWiki() {
  logger.info('=== Downloading Marvel MCU Wiki ===');
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
downloadMarvelWiki().catch(console.error);

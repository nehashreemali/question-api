/**
 * Doctor Who Wiki (Tardis) downloader
 * Usage: bun src/download-doctorwho-wiki.ts
 *
 * Downloads curated Doctor Who content from the Tardis Wiki
 */

import * as cheerio from 'cheerio';
import { writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { fetchWithRetry, createRateLimiter, sleep } from './lib/http.js';
import { createLogger } from './lib/logger.js';

const logger = createLogger('doctor-who');
const rateLimiter = createRateLimiter(0.5);

const BASE_URL = 'https://tardis.fandom.com/wiki';
const OUTPUT_DIR = join(process.cwd(), 'generation', 'doctorwho-wiki');

interface WikiPage {
  slug: string;
  category: string;
}

// Curated list of important Doctor Who content
const PAGES: WikiPage[] = [
  // === THE DOCTORS ===
  { slug: 'First_Doctor', category: 'doctors' },
  { slug: 'Second_Doctor', category: 'doctors' },
  { slug: 'Third_Doctor', category: 'doctors' },
  { slug: 'Fourth_Doctor', category: 'doctors' },
  { slug: 'Fifth_Doctor', category: 'doctors' },
  { slug: 'Sixth_Doctor', category: 'doctors' },
  { slug: 'Seventh_Doctor', category: 'doctors' },
  { slug: 'Eighth_Doctor', category: 'doctors' },
  { slug: 'War_Doctor', category: 'doctors' },
  { slug: 'Ninth_Doctor', category: 'doctors' },
  { slug: 'Tenth_Doctor', category: 'doctors' },
  { slug: 'Eleventh_Doctor', category: 'doctors' },
  { slug: 'Twelfth_Doctor', category: 'doctors' },
  { slug: 'Thirteenth_Doctor', category: 'doctors' },
  { slug: 'Fourteenth_Doctor', category: 'doctors' },
  { slug: 'Fifteenth_Doctor', category: 'doctors' },
  { slug: 'The_Doctor', category: 'doctors' },

  // === CLASSIC COMPANIONS ===
  { slug: 'Susan_Foreman', category: 'companions' },
  { slug: 'Barbara_Wright', category: 'companions' },
  { slug: 'Ian_Chesterton', category: 'companions' },
  { slug: 'Vicki_Pallister', category: 'companions' },
  { slug: 'Jamie_McCrimmon', category: 'companions' },
  { slug: 'Victoria_Waterfield', category: 'companions' },
  { slug: 'Zoe_Heriot', category: 'companions' },
  { slug: 'Liz_Shaw', category: 'companions' },
  { slug: 'Jo_Grant', category: 'companions' },
  { slug: 'Sarah_Jane_Smith', category: 'companions' },
  { slug: 'Harry_Sullivan', category: 'companions' },
  { slug: 'Leela', category: 'companions' },
  { slug: 'K9', category: 'companions' },
  { slug: 'Romana_I', category: 'companions' },
  { slug: 'Romana_II', category: 'companions' },
  { slug: 'Adric', category: 'companions' },
  { slug: 'Nyssa', category: 'companions' },
  { slug: 'Tegan_Jovanka', category: 'companions' },
  { slug: 'Peri_Brown', category: 'companions' },
  { slug: 'Melanie_Bush', category: 'companions' },
  { slug: 'Ace', category: 'companions' },

  // === NEW WHO COMPANIONS ===
  { slug: 'Rose_Tyler', category: 'companions' },
  { slug: 'Mickey_Smith', category: 'companions' },
  { slug: 'Jack_Harkness', category: 'companions' },
  { slug: 'Martha_Jones', category: 'companions' },
  { slug: 'Donna_Noble', category: 'companions' },
  { slug: 'Amy_Pond', category: 'companions' },
  { slug: 'Rory_Williams', category: 'companions' },
  { slug: 'River_Song', category: 'companions' },
  { slug: 'Clara_Oswald', category: 'companions' },
  { slug: 'Danny_Pink', category: 'companions' },
  { slug: 'Bill_Potts', category: 'companions' },
  { slug: 'Nardole', category: 'companions' },
  { slug: 'Yasmin_Khan', category: 'companions' },
  { slug: 'Ryan_Sinclair', category: 'companions' },
  { slug: 'Graham_O%27Brien', category: 'companions' },
  { slug: 'Dan_Lewis', category: 'companions' },
  { slug: 'Ruby_Sunday', category: 'companions' },

  // === MAIN VILLAINS ===
  { slug: 'Dalek', category: 'villains' },
  { slug: 'Davros', category: 'villains' },
  { slug: 'Cyberman', category: 'villains' },
  { slug: 'The_Master', category: 'villains' },
  { slug: 'Missy', category: 'villains' },
  { slug: 'Weeping_Angel', category: 'villains' },
  { slug: 'Sontaran', category: 'villains' },
  { slug: 'Silurian', category: 'villains' },
  { slug: 'Ice_Warrior', category: 'villains' },
  { slug: 'Auton', category: 'villains' },
  { slug: 'Zygon', category: 'villains' },
  { slug: 'Vashta_Nerada', category: 'villains' },
  { slug: 'Silence_(religious_order)', category: 'villains' },
  { slug: 'Great_Intelligence', category: 'villains' },
  { slug: 'Sutekh', category: 'villains' },
  { slug: 'Omega', category: 'villains' },
  { slug: 'Black_Guardian', category: 'villains' },
  { slug: 'Rassilon', category: 'villains' },
  { slug: 'The_Rani', category: 'villains' },
  { slug: 'The_Toymaker', category: 'villains' },

  // === KEY LOCATIONS ===
  { slug: 'Gallifrey', category: 'locations' },
  { slug: 'TARDIS', category: 'locations' },
  { slug: 'Skaro', category: 'locations' },
  { slug: 'Mondas', category: 'locations' },
  { slug: 'Trenzalore', category: 'locations' },
  { slug: 'The_Library', category: 'locations' },
  { slug: 'Satellite_Five', category: 'locations' },
  { slug: 'Torchwood', category: 'locations' },
  { slug: 'UNIT', category: 'locations' },
  { slug: 'Demon%27s_Run', category: 'locations' },

  // === KEY CONCEPTS ===
  { slug: 'Time_Lord', category: 'concepts' },
  { slug: 'Regeneration', category: 'concepts' },
  { slug: 'Time_War', category: 'concepts' },
  { slug: 'Sonic_screwdriver', category: 'concepts' },
  { slug: 'Time_Vortex', category: 'concepts' },
  { slug: 'Fixed_point_in_time', category: 'concepts' },
  { slug: 'Psychic_paper', category: 'concepts' },
  { slug: 'Chameleon_Circuit', category: 'concepts' },
  { slug: 'Eye_of_Harmony', category: 'concepts' },
  { slug: 'Matrix_(Time_Lord)', category: 'concepts' },
  { slug: 'Timeless_Child', category: 'concepts' },
  { slug: 'Bad_Wolf', category: 'concepts' },

  // === CLASSIC SERIALS ===
  { slug: 'An_Unearthly_Child_(TV_story)', category: 'episodes' },
  { slug: 'The_Daleks_(TV_story)', category: 'episodes' },
  { slug: 'The_Tomb_of_the_Cybermen_(TV_story)', category: 'episodes' },
  { slug: 'The_War_Games_(TV_story)', category: 'episodes' },
  { slug: 'Spearhead_from_Space_(TV_story)', category: 'episodes' },
  { slug: 'Genesis_of_the_Daleks_(TV_story)', category: 'episodes' },
  { slug: 'City_of_Death_(TV_story)', category: 'episodes' },
  { slug: 'Earthshock_(TV_story)', category: 'episodes' },
  { slug: 'The_Caves_of_Androzani_(TV_story)', category: 'episodes' },
  { slug: 'Remembrance_of_the_Daleks_(TV_story)', category: 'episodes' },
  { slug: 'Doctor_Who_(TV_story)', category: 'episodes' },

  // === NEW WHO KEY EPISODES ===
  { slug: 'Rose_(TV_story)', category: 'episodes' },
  { slug: 'Dalek_(TV_story)', category: 'episodes' },
  { slug: 'The_Empty_Child_(TV_story)', category: 'episodes' },
  { slug: 'Bad_Wolf_(TV_story)', category: 'episodes' },
  { slug: 'The_Parting_of_the_Ways_(TV_story)', category: 'episodes' },
  { slug: 'Doomsday_(TV_story)', category: 'episodes' },
  { slug: 'Blink_(TV_story)', category: 'episodes' },
  { slug: 'Utopia_(TV_story)', category: 'episodes' },
  { slug: 'The_Sound_of_Drums_(TV_story)', category: 'episodes' },
  { slug: 'Silence_in_the_Library_(TV_story)', category: 'episodes' },
  { slug: 'Forest_of_the_Dead_(TV_story)', category: 'episodes' },
  { slug: 'The_Stolen_Earth_(TV_story)', category: 'episodes' },
  { slug: 'Journey%27s_End_(TV_story)', category: 'episodes' },
  { slug: 'The_Waters_of_Mars_(TV_story)', category: 'episodes' },
  { slug: 'The_End_of_Time_(TV_story)', category: 'episodes' },
  { slug: 'The_Eleventh_Hour_(TV_story)', category: 'episodes' },
  { slug: 'The_Pandorica_Opens_(TV_story)', category: 'episodes' },
  { slug: 'The_Big_Bang_(TV_story)', category: 'episodes' },
  { slug: 'A_Good_Man_Goes_to_War_(TV_story)', category: 'episodes' },
  { slug: 'The_Wedding_of_River_Song_(TV_story)', category: 'episodes' },
  { slug: 'The_Name_of_the_Doctor_(TV_story)', category: 'episodes' },
  { slug: 'The_Day_of_the_Doctor_(TV_story)', category: 'episodes' },
  { slug: 'The_Time_of_the_Doctor_(TV_story)', category: 'episodes' },
  { slug: 'Deep_Breath_(TV_story)', category: 'episodes' },
  { slug: 'Heaven_Sent_(TV_story)', category: 'episodes' },
  { slug: 'Hell_Bent_(TV_story)', category: 'episodes' },
  { slug: 'World_Enough_and_Time_(TV_story)', category: 'episodes' },
  { slug: 'The_Doctor_Falls_(TV_story)', category: 'episodes' },
  { slug: 'Twice_Upon_a_Time_(TV_story)', category: 'episodes' },
  { slug: 'The_Woman_Who_Fell_to_Earth_(TV_story)', category: 'episodes' },
  { slug: 'The_Power_of_the_Doctor_(TV_story)', category: 'episodes' },
  { slug: 'The_Star_Beast_(TV_story)', category: 'episodes' },
  { slug: 'Wild_Blue_Yonder_(TV_story)', category: 'episodes' },
  { slug: 'The_Giggle_(TV_story)', category: 'episodes' },
  { slug: 'The_Church_on_Ruby_Road_(TV_story)', category: 'episodes' },

  // === IMPORTANT SPINOFF CHARACTERS ===
  { slug: 'Ianto_Jones', category: 'companions' },
  { slug: 'Gwen_Cooper', category: 'companions' },
  { slug: 'Luke_Smith', category: 'companions' },

  // === IMPORTANT SUPPORTING CHARACTERS ===
  { slug: 'Brigadier_Lethbridge-Stewart', category: 'supporting' },
  { slug: 'Kate_Stewart', category: 'supporting' },
  { slug: 'Wilfred_Mott', category: 'supporting' },
  { slug: 'Jackie_Tyler', category: 'supporting' },
  { slug: 'Pete_Tyler', category: 'supporting' },
  { slug: 'Francine_Jones', category: 'supporting' },
  { slug: 'Brian_Williams_(Dinosaurs_on_a_Spaceship)', category: 'supporting' },
  { slug: 'Madame_Vastra', category: 'supporting' },
  { slug: 'Jenny_Flint', category: 'supporting' },
  { slug: 'Strax', category: 'supporting' },
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
      source: 'tardis.fandom.com',
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
async function downloadDoctorWhoWiki() {
  logger.info('=== Downloading Doctor Who Wiki (Tardis) ===');
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
downloadDoctorWhoWiki().catch(console.error);

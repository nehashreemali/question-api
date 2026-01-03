/**
 * Star Wars Wiki (Wookieepedia) downloader
 * Usage: bun src/download-starwars-wiki.ts
 *
 * Downloads curated list of important Star Wars content:
 * - Main characters from all trilogies
 * - Key villains and supporting characters
 * - Major planets and locations
 * - Iconic ships and vehicles
 * - Films and key events
 */

import * as cheerio from 'cheerio';
import { writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { fetchWithRetry, createRateLimiter, sleep } from './lib/http.js';
import { createLogger } from './lib/logger.js';

const logger = createLogger('starwars');
const rateLimiter = createRateLimiter(0.5); // 1 request per 2 seconds

const BASE_URL = 'https://starwars.fandom.com/wiki';
const OUTPUT_DIR = join(process.cwd(), 'generation', 'starwars-wiki');

interface WikiPage {
  slug: string;
  category: string;
}

// Curated list of important Star Wars content
const PAGES: WikiPage[] = [
  // === MAIN CHARACTERS - Original Trilogy ===
  { slug: 'Luke_Skywalker', category: 'characters' },
  { slug: 'Leia_Organa', category: 'characters' },
  { slug: 'Han_Solo', category: 'characters' },
  { slug: 'Chewbacca', category: 'characters' },
  { slug: 'Obi-Wan_Kenobi', category: 'characters' },
  { slug: 'Anakin_Skywalker', category: 'characters' },
  { slug: 'Yoda', category: 'characters' },
  { slug: 'C-3PO', category: 'characters' },
  { slug: 'R2-D2', category: 'characters' },
  { slug: 'Lando_Calrissian', category: 'characters' },
  { slug: 'Wedge_Antilles', category: 'characters' },

  // === MAIN VILLAINS ===
  { slug: 'Darth_Sidious', category: 'villains' },
  { slug: 'Darth_Vader', category: 'villains' },
  { slug: 'Darth_Maul', category: 'villains' },
  { slug: 'Count_Dooku', category: 'villains' },
  { slug: 'General_Grievous', category: 'villains' },
  { slug: 'Grand_Moff_Tarkin', category: 'villains' },
  { slug: 'Boba_Fett', category: 'villains' },
  { slug: 'Jabba_Desilijic_Tiure', category: 'villains' },
  { slug: 'Kylo_Ren', category: 'villains' },
  { slug: 'Supreme_Leader_Snoke', category: 'villains' },
  { slug: 'Captain_Phasma', category: 'villains' },
  { slug: 'Armitage_Hux', category: 'villains' },
  { slug: 'Asajj_Ventress', category: 'villains' },
  { slug: 'Savage_Opress', category: 'villains' },
  { slug: 'Grand_Inquisitor', category: 'villains' },
  { slug: 'Moff_Gideon', category: 'villains' },

  // === PREQUEL TRILOGY CHARACTERS ===
  { slug: 'Qui-Gon_Jinn', category: 'characters' },
  { slug: 'Padmé_Amidala', category: 'characters' },
  { slug: 'Mace_Windu', category: 'characters' },
  { slug: 'Shmi_Skywalker', category: 'characters' },
  { slug: 'Jango_Fett', category: 'characters' },
  { slug: 'Bail_Organa', category: 'characters' },
  { slug: 'Jar_Jar_Binks', category: 'characters' },
  { slug: 'Watto', category: 'characters' },
  { slug: 'Captain_Rex', category: 'characters' },
  { slug: 'Ahsoka_Tano', category: 'characters' },
  { slug: 'Clone_Commander_Cody', category: 'characters' },
  { slug: 'Kit_Fisto', category: 'characters' },
  { slug: 'Plo_Koon', category: 'characters' },
  { slug: 'Ki-Adi-Mundi', category: 'characters' },
  { slug: 'Aayla_Secura', category: 'characters' },

  // === SEQUEL TRILOGY CHARACTERS ===
  { slug: 'Rey_Skywalker', category: 'characters' },
  { slug: 'Finn_(stormtrooper)', category: 'characters' },
  { slug: 'Poe_Dameron', category: 'characters' },
  { slug: 'BB-8', category: 'characters' },
  { slug: 'Rose_Tico', category: 'characters' },
  { slug: 'Maz_Kanata', category: 'characters' },
  { slug: 'Lor_San_Tekka', category: 'characters' },

  // === THE MANDALORIAN & NEW ERA ===
  { slug: 'Din_Djarin', category: 'characters' },
  { slug: 'Grogu', category: 'characters' },
  { slug: 'Cara_Dune', category: 'characters' },
  { slug: 'Greef_Karga', category: 'characters' },
  { slug: 'Bo-Katan_Kryze', category: 'characters' },
  { slug: 'Cad_Bane', category: 'characters' },
  { slug: 'Fennec_Shand', category: 'characters' },

  // === ROGUE ONE / SOLO CHARACTERS ===
  { slug: 'Jyn_Erso', category: 'characters' },
  { slug: 'Cassian_Andor', category: 'characters' },
  { slug: 'K-2SO', category: 'characters' },
  { slug: 'Chirrut_Îmwe', category: 'characters' },
  { slug: 'Baze_Malbus', category: 'characters' },
  { slug: 'Orson_Krennic', category: 'characters' },
  { slug: 'Tobias_Beckett', category: 'characters' },
  { slug: 'Qi%27ra', category: 'characters' },

  // === JEDI COUNCIL & ORDER ===
  { slug: 'Jedi_Order', category: 'organizations' },
  { slug: 'Jedi_Council', category: 'organizations' },
  { slug: 'Jedi_Temple', category: 'locations' },
  { slug: 'Lightsaber', category: 'technology' },
  { slug: 'The_Force', category: 'concepts' },
  { slug: 'Dark_side_of_the_Force', category: 'concepts' },
  { slug: 'Light_side_of_the_Force', category: 'concepts' },

  // === SITH ===
  { slug: 'Sith', category: 'organizations' },
  { slug: 'Rule_of_Two', category: 'concepts' },
  { slug: 'Darth_Bane', category: 'villains' },
  { slug: 'Darth_Plagueis', category: 'villains' },
  { slug: 'Darth_Revan', category: 'villains' },

  // === MAJOR ORGANIZATIONS ===
  { slug: 'Galactic_Empire', category: 'organizations' },
  { slug: 'Galactic_Republic', category: 'organizations' },
  { slug: 'Rebel_Alliance', category: 'organizations' },
  { slug: 'First_Order', category: 'organizations' },
  { slug: 'Resistance', category: 'organizations' },
  { slug: 'Trade_Federation', category: 'organizations' },
  { slug: 'Separatist_Alliance', category: 'organizations' },
  { slug: 'Grand_Army_of_the_Republic', category: 'organizations' },
  { slug: 'Mandalorian', category: 'organizations' },
  { slug: 'Bounty_Hunters%27_Guild', category: 'organizations' },
  { slug: 'Hutt_Clan', category: 'organizations' },
  { slug: 'Crimson_Dawn', category: 'organizations' },

  // === PLANETS & LOCATIONS ===
  { slug: 'Tatooine', category: 'planets' },
  { slug: 'Coruscant', category: 'planets' },
  { slug: 'Hoth', category: 'planets' },
  { slug: 'Dagobah', category: 'planets' },
  { slug: 'Endor', category: 'planets' },
  { slug: 'Naboo', category: 'planets' },
  { slug: 'Mustafar', category: 'planets' },
  { slug: 'Kamino', category: 'planets' },
  { slug: 'Geonosis', category: 'planets' },
  { slug: 'Kashyyyk', category: 'planets' },
  { slug: 'Alderaan', category: 'planets' },
  { slug: 'Bespin', category: 'planets' },
  { slug: 'Cloud_City', category: 'locations' },
  { slug: 'Jakku', category: 'planets' },
  { slug: 'Starkiller_Base', category: 'locations' },
  { slug: 'Scarif', category: 'planets' },
  { slug: 'Jedha', category: 'planets' },
  { slug: 'Mandalore', category: 'planets' },
  { slug: 'Nevarro', category: 'planets' },
  { slug: 'Lothal', category: 'planets' },
  { slug: 'Dathomir', category: 'planets' },
  { slug: 'Exegol', category: 'planets' },
  { slug: 'Mos_Eisley', category: 'locations' },
  { slug: 'Mos_Espa', category: 'locations' },

  // === SHIPS & VEHICLES ===
  { slug: 'Millennium_Falcon', category: 'ships' },
  { slug: 'X-wing_starfighter', category: 'ships' },
  { slug: 'TIE_fighter', category: 'ships' },
  { slug: 'Star_Destroyer', category: 'ships' },
  { slug: 'Death_Star', category: 'ships' },
  { slug: 'Death_Star_II', category: 'ships' },
  { slug: 'Super_Star_Destroyer', category: 'ships' },
  { slug: 'Slave_I', category: 'ships' },
  { slug: 'A-wing_starfighter', category: 'ships' },
  { slug: 'Y-wing_starfighter', category: 'ships' },
  { slug: 'B-wing_starfighter', category: 'ships' },
  { slug: 'Lambda-class_T-4a_shuttle', category: 'ships' },
  { slug: 'Tantive_IV', category: 'ships' },
  { slug: 'Naboo_Royal_Starship', category: 'ships' },
  { slug: 'Jedi_starfighter', category: 'ships' },
  { slug: 'Razor_Crest', category: 'ships' },
  { slug: 'AT-AT', category: 'vehicles' },
  { slug: 'AT-ST', category: 'vehicles' },
  { slug: 'Speeder_bike', category: 'vehicles' },
  { slug: 'Podracer', category: 'vehicles' },
  { slug: 'Landspeeder', category: 'vehicles' },

  // === FILMS ===
  { slug: 'Star_Wars:_Episode_I_The_Phantom_Menace', category: 'films' },
  { slug: 'Star_Wars:_Episode_II_Attack_of_the_Clones', category: 'films' },
  { slug: 'Star_Wars:_Episode_III_Revenge_of_the_Sith', category: 'films' },
  { slug: 'Star_Wars:_Episode_IV_A_New_Hope', category: 'films' },
  { slug: 'Star_Wars:_Episode_V_The_Empire_Strikes_Back', category: 'films' },
  { slug: 'Star_Wars:_Episode_VI_Return_of_the_Jedi', category: 'films' },
  { slug: 'Star_Wars:_Episode_VII_The_Force_Awakens', category: 'films' },
  { slug: 'Star_Wars:_Episode_VIII_The_Last_Jedi', category: 'films' },
  { slug: 'Star_Wars:_Episode_IX_The_Rise_of_Skywalker', category: 'films' },
  { slug: 'Rogue_One:_A_Star_Wars_Story', category: 'films' },
  { slug: 'Solo:_A_Star_Wars_Story', category: 'films' },

  // === TV SERIES ===
  { slug: 'The_Clone_Wars_(TV_series)', category: 'series' },
  { slug: 'Star_Wars_Rebels', category: 'series' },
  { slug: 'The_Mandalorian', category: 'series' },
  { slug: 'The_Book_of_Boba_Fett', category: 'series' },
  { slug: 'Obi-Wan_Kenobi_(television_series)', category: 'series' },
  { slug: 'Andor_(television_series)', category: 'series' },
  { slug: 'Ahsoka_(television_series)', category: 'series' },
  { slug: 'The_Bad_Batch', category: 'series' },
  { slug: 'Star_Wars:_Visions', category: 'series' },

  // === KEY EVENTS ===
  { slug: 'Clone_Wars', category: 'events' },
  { slug: 'Galactic_Civil_War', category: 'events' },
  { slug: 'Battle_of_Yavin', category: 'events' },
  { slug: 'Battle_of_Hoth', category: 'events' },
  { slug: 'Battle_of_Endor', category: 'events' },
  { slug: 'Order_66', category: 'events' },
  { slug: 'Destruction_of_Alderaan', category: 'events' },
  { slug: 'Fall_of_the_Republic', category: 'events' },
  { slug: 'Battle_of_Geonosis', category: 'events' },
  { slug: 'Battle_of_Coruscant', category: 'events' },
  { slug: 'Mission_to_Mustafar', category: 'events' },
  { slug: 'Duel_on_Mustafar', category: 'events' },
  { slug: 'Battle_of_Naboo', category: 'events' },
  { slug: 'Battle_of_Scarif', category: 'events' },
  { slug: 'Battle_of_Starkiller_Base', category: 'events' },
  { slug: 'Battle_of_Crait', category: 'events' },
  { slug: 'Battle_of_Exegol', category: 'events' },

  // === SPECIES ===
  { slug: 'Human', category: 'species' },
  { slug: 'Wookiee', category: 'species' },
  { slug: 'Twi%27lek', category: 'species' },
  { slug: 'Rodian', category: 'species' },
  { slug: 'Hutt', category: 'species' },
  { slug: 'Ewok', category: 'species' },
  { slug: 'Gungan', category: 'species' },
  { slug: 'Togruta', category: 'species' },
  { slug: 'Zabrak', category: 'species' },
  { slug: 'Trandoshan', category: 'species' },
  { slug: 'Mon_Calamari', category: 'species' },
  { slug: 'Tusken_Raider', category: 'species' },
  { slug: 'Jawa', category: 'species' },

  // === DROIDS ===
  { slug: 'Astromech_droid', category: 'technology' },
  { slug: 'Protocol_droid', category: 'technology' },
  { slug: 'Battle_droid', category: 'technology' },
  { slug: 'Super_battle_droid', category: 'technology' },
  { slug: 'Droideka', category: 'technology' },
  { slug: 'IG-11', category: 'characters' },
  { slug: 'IG-88', category: 'characters' },
  { slug: 'HK-47', category: 'characters' },

  // === WEAPONS & TECHNOLOGY ===
  { slug: 'Blaster', category: 'technology' },
  { slug: 'Thermal_detonator', category: 'technology' },
  { slug: 'Holocron', category: 'technology' },
  { slug: 'Kyber_crystal', category: 'technology' },
  { slug: 'Darksaber', category: 'technology' },
  { slug: 'Carbonite', category: 'technology' },
  { slug: 'Hyperdrive', category: 'technology' },
  { slug: 'Hyperspace', category: 'concepts' },
  { slug: 'Bacta', category: 'technology' },
  { slug: 'Beskar', category: 'technology' },
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
    $('table').remove(); // Remove tables as they're often navigation/reference

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
        // Skip very short paragraphs (likely captions or navigation)
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
      source: 'starwars.fandom.com',
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
async function downloadStarWarsWiki() {
  logger.info('=== Downloading Star Wars Wiki (Wookieepedia) ===');
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
downloadStarWarsWiki().catch(console.error);

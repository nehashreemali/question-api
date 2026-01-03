/**
 * ASOIAF Wiki Scraper
 * Scrapes character, house, location, and event data from awoiaf.westeros.org
 * Usage: bun src/download-asoiaf-wiki.ts [category]
 * Categories: characters, houses, locations, events, culture, all
 */

import * as cheerio from 'cheerio';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { fetchWithRetry, createRateLimiter, sleep } from './lib/http.js';
import { createLogger } from './lib/logger.js';

const logger = createLogger('asoiaf-wiki');
const rateLimiter = createRateLimiter(0.5); // Be nice to the wiki

const ASOIAF_DIR = join(process.cwd(), 'generation', 'asoiaf-wiki');
const BASE_URL = 'https://awoiaf.westeros.org';

// ============================================
// POV CHARACTERS (Main protagonists)
// ============================================
const POV_CHARACTERS = [
  // A Game of Thrones POVs
  'Eddard_Stark', 'Catelyn_Stark', 'Sansa_Stark', 'Arya_Stark', 'Bran_Stark',
  'Jon_Snow', 'Daenerys_Targaryen', 'Tyrion_Lannister', 'Will_(ranger)',

  // A Clash of Kings POVs
  'Theon_Greyjoy', 'Davos_Seaworth',

  // A Storm of Swords POVs
  'Jaime_Lannister', 'Samwell_Tarly',

  // A Feast for Crows POVs
  'Cersei_Lannister', 'Brienne_of_Tarth', 'Aeron_Greyjoy', 'Victarion_Greyjoy',
  'Asha_Greyjoy', 'Areo_Hotah', 'Arianne_Martell',

  // A Dance with Dragons POVs
  'Quentyn_Martell', 'Jon_Connington', 'Melisandre', 'Barristan_Selmy',
];

// ============================================
// MAJOR NON-POV CHARACTERS
// ============================================
const MAJOR_CHARACTERS = [
  // Starks
  'Robb_Stark', 'Rickon_Stark', 'Benjen_Stark', 'Lyanna_Stark', 'Brandon_Stark_(Eddard%27s_brother)',

  // Lannisters
  'Tywin_Lannister', 'Kevan_Lannister', 'Joffrey_Baratheon', 'Tommen_Baratheon',
  'Myrcella_Baratheon', 'Lancel_Lannister',

  // Baratheons
  'Robert_Baratheon', 'Stannis_Baratheon', 'Renly_Baratheon', 'Shireen_Baratheon',
  'Selyse_Florent',

  // Targaryens
  'Viserys_Targaryen', 'Rhaegar_Targaryen', 'Aegon_Targaryen_(son_of_Rhaegar)',
  'Aerys_II_Targaryen', 'Rhaella_Targaryen', 'Maester_Aemon',

  // Greyjoys
  'Balon_Greyjoy', 'Euron_Greyjoy', 'Rodrik_Harlaw',

  // Martells
  'Doran_Martell', 'Oberyn_Martell', 'Ellaria_Sand', 'Sand_Snakes',
  'Obara_Sand', 'Nymeria_Sand', 'Tyene_Sand',

  // Tyrells
  'Mace_Tyrell', 'Olenna_Tyrell', 'Margaery_Tyrell', 'Loras_Tyrell', 'Garlan_Tyrell',
  'Willas_Tyrell',

  // Night's Watch
  'Jeor_Mormont', 'Alliser_Thorne', 'Bowen_Marsh', 'Eddison_Tollett',
  'Mance_Rayder', 'Tormund',

  // Other major characters
  'Petyr_Baelish', 'Varys', 'Sandor_Clegane', 'Gregor_Clegane', 'Bronn',
  'Jorah_Mormont', 'Daario_Naharis', 'Grey_Worm', 'Missandei',
  'Podrick_Payne', 'Gendry', 'Hot_Pie', 'Hodor', 'Osha',
  'Shae', 'Ros', 'Grand_Maester_Pycelle', 'Qyburn',
  'High_Sparrow', 'Walder_Frey', 'Roose_Bolton', 'Ramsay_Bolton',
  'Jojen_Reed', 'Meera_Reed', 'Three-Eyed_Crow',
  'Illyrio_Mopatis', 'Khal_Drogo', 'Mirri_Maz_Duur',
  'Syrio_Forel', 'Jaqen_H%27ghar', 'The_Waif',
];

// ============================================
// HISTORICAL CHARACTERS
// ============================================
const HISTORICAL_CHARACTERS = [
  // Targaryen Kings
  'Aegon_I_Targaryen', 'Maegor_I_Targaryen', 'Jaehaerys_I_Targaryen',
  'Viserys_I_Targaryen', 'Aegon_II_Targaryen', 'Rhaenyra_Targaryen',
  'Aegon_III_Targaryen', 'Daeron_I_Targaryen', 'Baelor_I_Targaryen',
  'Aegon_IV_Targaryen', 'Daeron_II_Targaryen', 'Aerys_I_Targaryen',
  'Maekar_I_Targaryen', 'Aegon_V_Targaryen', 'Jaehaerys_II_Targaryen',

  // Dance of the Dragons
  'Daemon_Targaryen', 'Aemond_Targaryen', 'Helaena_Targaryen',
  'Jacaerys_Velaryon', 'Lucerys_Velaryon', 'Corlys_Velaryon',
  'Rhaenys_Targaryen_(daughter_of_Aemon)', 'Alicent_Hightower',

  // Blackfyre Rebellion
  'Daemon_Blackfyre', 'Aegor_Rivers', 'Brynden_Rivers',
  'Daeron_Targaryen_(son_of_Aegon_IV)', 'Daemon_II_Blackfyre',
  'Maelys_Blackfyre',

  // Other historical
  'Duncan_the_Tall', 'Barristan_Selmy', 'Arthur_Dayne', 'Gerold_Hightower',
  'Oswell_Whent', 'Jonothor_Darry', 'Lewyn_Martell',
  'Tytos_Lannister', 'Rickard_Stark', 'Jon_Arryn',
];

// ============================================
// GREAT HOUSES
// ============================================
const GREAT_HOUSES = [
  'House_Stark', 'House_Lannister', 'House_Baratheon', 'House_Targaryen',
  'House_Greyjoy', 'House_Martell', 'House_Tyrell', 'House_Arryn', 'House_Tully',
];

// ============================================
// MAJOR NOBLE HOUSES
// ============================================
const NOBLE_HOUSES = [
  // North
  'House_Bolton', 'House_Karstark', 'House_Umber', 'House_Manderly',
  'House_Mormont', 'House_Reed', 'House_Glover', 'House_Hornwood',
  'House_Dustin', 'House_Ryswell', 'House_Flint',

  // Riverlands
  'House_Frey', 'House_Blackwood', 'House_Bracken', 'House_Mallister',
  'House_Piper', 'House_Vance', 'House_Darry',

  // Vale
  'House_Royce', 'House_Waynwood', 'House_Corbray', 'House_Hunter',
  'House_Redfort', 'House_Grafton',

  // Westerlands
  'House_Clegane', 'House_Crakehall', 'House_Marbrand', 'House_Westerling',
  'House_Swyft', 'House_Lefford', 'House_Payne',

  // Reach
  'House_Hightower', 'House_Redwyne', 'House_Tarly', 'House_Florent',
  'House_Fossoway', 'House_Oakheart', 'House_Rowan',

  // Stormlands
  'House_Tarth', 'House_Dondarrion', 'House_Selmy', 'House_Swann',
  'House_Estermont', 'House_Connington', 'House_Caron',

  // Dorne
  'House_Dayne', 'House_Yronwood', 'House_Fowler', 'House_Uller',
  'House_Allyrion', 'House_Manwoody', 'House_Blackmont',

  // Iron Islands
  'House_Harlaw', 'House_Goodbrother', 'House_Drumm', 'House_Botley',
  'House_Blacktyde', 'House_Merlyn',

  // Crownlands
  'House_Velaryon', 'House_Celtigar', 'House_Stokeworth', 'House_Rosby',
  'House_Rykker', 'House_Sunglass',
];

// ============================================
// MAJOR LOCATIONS
// ============================================
const MAJOR_LOCATIONS = [
  // Capitals and major castles
  'King%27s_Landing', 'Winterfell', 'Casterly_Rock', 'Storm%27s_End',
  'Highgarden', 'Sunspear', 'Riverrun', 'The_Eyrie', 'Pyke_(castle)',
  'Dragonstone', 'Harrenhal',

  // The Wall and Beyond
  'The_Wall', 'Castle_Black', 'Eastwatch-by-the-Sea', 'The_Shadow_Tower',
  'The_Nightfort', 'Craster%27s_Keep', 'The_Fist_of_the_First_Men',
  'Hardhome', 'The_Lands_of_Always_Winter',

  // Major cities
  'Oldtown', 'Lannisport', 'White_Harbor', 'Gulltown',

  // Notable castles - North
  'The_Dreadfort', 'Last_Hearth', 'Karhold', 'Moat_Cailin',
  'Greywater_Watch', 'Bear_Island', 'Deepwood_Motte',

  // Notable castles - South
  'The_Twins', 'Horn_Hill', 'Starfall', 'Yronwood', 'Evenfall_Hall',

  // Red Keep locations
  'Red_Keep', 'Iron_Throne', 'Tower_of_the_Hand', 'Maegor%27s_Holdfast',
  'Black_Cells', 'Great_Sept_of_Baelor',

  // Free Cities
  'Braavos', 'Pentos', 'Volantis', 'Lys', 'Myr', 'Tyrosh',
  'Norvos', 'Qohor', 'Lorath',

  // Slaver's Bay
  'Astapor', 'Yunkai', 'Meereen', 'Slaver%27s_Bay',

  // Other Essos
  'Valyria', 'Vaes_Dothrak', 'Qarth', 'Asshai', 'Yi_Ti',

  // Regions
  'The_North', 'The_Riverlands', 'The_Vale', 'The_Westerlands',
  'The_Reach', 'The_Stormlands', 'Dorne', 'The_Iron_Islands', 'The_Crownlands',
];

// ============================================
// MAJOR EVENTS AND BATTLES
// ============================================
const EVENTS_AND_BATTLES = [
  // Robert's Rebellion
  'Robert%27s_Rebellion', 'Battle_of_the_Trident', 'Sack_of_King%27s_Landing',
  'Tower_of_Joy', 'Battle_of_the_Bells', 'Battle_of_Ashford',

  // War of the Five Kings
  'War_of_the_Five_Kings', 'Battle_of_the_Whispering_Wood',
  'Battle_of_the_Camps', 'Battle_of_the_Green_Fork',
  'Battle_of_the_Blackwater', 'Red_Wedding', 'Purple_Wedding',
  'Battle_of_Castle_Black', 'Battle_of_the_Bastards',

  // Greyjoy Rebellion
  'Greyjoy_Rebellion', 'Siege_of_Pyke',

  // Dance of the Dragons
  'Dance_of_the_Dragons', 'Battle_of_Rook%27s_Rest',
  'Battle_Above_the_Gods_Eye', 'Fall_of_King%27s_Landing',
  'Storming_of_the_Dragonpit', 'Hour_of_the_Wolf',

  // Blackfyre Rebellions
  'Blackfyre_Rebellion', 'Battle_of_the_Redgrass_Field',
  'Second_Blackfyre_Rebellion', 'Third_Blackfyre_Rebellion',
  'Fourth_Blackfyre_Rebellion', 'War_of_the_Ninepenny_Kings',

  // Historical events
  'Doom_of_Valyria', 'Aegon%27s_Conquest', 'Faith_Militant_uprising',
  'Long_Night', 'War_for_the_Dawn', 'Andal_invasion',

  // Other major events
  'Tourney_at_Harrenhal', 'Trial_by_combat', 'Great_Council',
];

// ============================================
// CULTURE, RELIGION, AND ORGANIZATIONS
// ============================================
const CULTURE_AND_ORGANIZATIONS = [
  // Organizations
  'Night%27s_Watch', 'Kingsguard', 'Small_council', 'Faceless_Men',
  'Golden_Company', 'Second_Sons', 'Stormcrows', 'Unsullied',
  'Brotherhood_Without_Banners', 'Brave_Companions', 'Faith_Militant',

  // Religion
  'Faith_of_the_Seven', 'Old_Gods', 'R%27hllor', 'Drowned_God',
  'Many-Faced_God', 'Great_Stallion', 'Mother_Rhoyne',

  // Culture
  'Dothraki', 'Ironborn', 'Wildlings', 'Children_of_the_Forest',
  'Giants', 'First_Men', 'Andals', 'Rhoynar', 'Valyrians',

  // Creatures
  'Dragons', 'Direwolves', 'White_Walkers', 'Wights',
  'Shadowcat', 'Mammoth', 'Kraken',

  // Magic and prophecy
  'Azor_Ahai', 'The_Prince_That_Was_Promised', 'Greensight', 'Warging',
  'Valyrian_steel', 'Dragonglass', 'Wildfire', 'Faceless_Men',

  // Objects
  'Iron_Throne', 'Valyrian_steel', 'Ice_(sword)', 'Longclaw',
  'Widow%27s_Wail', 'Oathkeeper', 'Heartsbane', 'Dawn_(sword)',
  'Dark_Sister', 'Blackfyre_(sword)',
];

// ============================================
// SCRAPE FUNCTIONS
// ============================================

interface WikiPage {
  title: string;
  slug: string;
  url: string;
  summary: string;
  content: string;
  infobox: Record<string, string>;
  categories: string[];
  scrapedAt: string;
}

async function scrapeWikiPage(slug: string): Promise<WikiPage | null> {
  await rateLimiter();

  const url = `${BASE_URL}/index.php/${slug}`;

  try {
    const html = await fetchWithRetry(url, 3, {
      headers: {
        'User-Agent': 'QuizQuestionGenerator/1.0 (Educational project; +https://github.com/nehashreemali/question-api)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });
    const $ = cheerio.load(html);

    // Get title
    const title = $('#firstHeading').text().trim() ||
                  $('h1.page-header__title').text().trim() ||
                  $('h1').first().text().trim();

    // Get summary (first paragraph)
    const summary = $('#mw-content-text .mw-parser-output > p').first().text().trim();

    // Get main content (all paragraphs)
    const contentParagraphs: string[] = [];
    $('#mw-content-text .mw-parser-output > p').each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 50) {
        contentParagraphs.push(text);
      }
    });

    // Also get section content
    $('#mw-content-text .mw-parser-output h2, #mw-content-text .mw-parser-output h3').each((_, el) => {
      const heading = $(el).find('.mw-headline').text().trim();
      if (heading && !['References', 'Notes', 'External links', 'See also'].includes(heading)) {
        contentParagraphs.push(`\n## ${heading}\n`);
        $(el).nextUntil('h2, h3').filter('p').each((_, p) => {
          const text = $(p).text().trim();
          if (text.length > 50) {
            contentParagraphs.push(text);
          }
        });
      }
    });

    const content = contentParagraphs.join('\n\n');

    // Get infobox data
    const infobox: Record<string, string> = {};
    $('.infobox tr, .portable-infobox .pi-item').each((_, el) => {
      const label = $(el).find('th, .pi-data-label').text().trim();
      const value = $(el).find('td, .pi-data-value').text().trim();
      if (label && value) {
        infobox[label] = value;
      }
    });

    // Get categories
    const categories: string[] = [];
    $('#mw-normal-catlinks a, .page-header__categories a').each((_, el) => {
      const cat = $(el).text().trim();
      if (cat && cat !== 'Categories') {
        categories.push(cat);
      }
    });

    if (!title || content.length < 100) {
      return null;
    }

    return {
      title,
      slug,
      url,
      summary,
      content,
      infobox,
      categories,
      scrapedAt: new Date().toISOString(),
    };
  } catch (e: any) {
    logger.warn(`Failed to scrape ${slug}: ${e.message}`);
    return null;
  }
}

async function downloadCategory(category: string, slugs: string[], subdir: string) {
  const dir = join(ASOIAF_DIR, subdir);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  logger.info(`\n=== Downloading ${category} (${slugs.length} items) ===\n`);

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const slug of slugs) {
    const filename = slug.toLowerCase().replace(/%27/g, '').replace(/[^a-z0-9]+/g, '-') + '.json';
    const filepath = join(dir, filename);

    if (existsSync(filepath)) {
      logger.info(`  ${slug} - exists, skipping`);
      skipped++;
      continue;
    }

    const page = await scrapeWikiPage(slug);

    if (page) {
      writeFileSync(filepath, JSON.stringify(page, null, 2));
      logger.success(`  ${page.title} - ${page.content.split(/\s+/).length} words`);
      downloaded++;
    } else {
      logger.error(`  ${slug} - failed`);
      failed++;
    }

    await sleep(2000); // Be respectful to the wiki
  }

  logger.info(`\n${category}: Downloaded ${downloaded}, Skipped ${skipped}, Failed ${failed}\n`);
  return { downloaded, skipped, failed };
}

// ============================================
// MAIN
// ============================================
async function main() {
  const category = process.argv[2];

  if (!existsSync(ASOIAF_DIR)) {
    mkdirSync(ASOIAF_DIR, { recursive: true });
  }

  logger.info('=== ASOIAF Wiki Scraper ===\n');
  logger.info(`Output directory: ${ASOIAF_DIR}\n`);

  const allCharacters = [...POV_CHARACTERS, ...MAJOR_CHARACTERS, ...HISTORICAL_CHARACTERS];
  const allHouses = [...GREAT_HOUSES, ...NOBLE_HOUSES];

  const stats = {
    downloaded: 0,
    skipped: 0,
    failed: 0,
  };

  const addStats = (result: { downloaded: number; skipped: number; failed: number }) => {
    stats.downloaded += result.downloaded;
    stats.skipped += result.skipped;
    stats.failed += result.failed;
  };

  if (!category || category === 'all') {
    addStats(await downloadCategory('POV Characters', POV_CHARACTERS, 'characters'));
    addStats(await downloadCategory('Major Characters', MAJOR_CHARACTERS, 'characters'));
    addStats(await downloadCategory('Historical Characters', HISTORICAL_CHARACTERS, 'characters'));
    addStats(await downloadCategory('Great Houses', GREAT_HOUSES, 'houses'));
    addStats(await downloadCategory('Noble Houses', NOBLE_HOUSES, 'houses'));
    addStats(await downloadCategory('Locations', MAJOR_LOCATIONS, 'locations'));
    addStats(await downloadCategory('Events & Battles', EVENTS_AND_BATTLES, 'events'));
    addStats(await downloadCategory('Culture & Organizations', CULTURE_AND_ORGANIZATIONS, 'culture'));
  } else if (category === 'characters') {
    addStats(await downloadCategory('POV Characters', POV_CHARACTERS, 'characters'));
    addStats(await downloadCategory('Major Characters', MAJOR_CHARACTERS, 'characters'));
    addStats(await downloadCategory('Historical Characters', HISTORICAL_CHARACTERS, 'characters'));
  } else if (category === 'pov') {
    addStats(await downloadCategory('POV Characters', POV_CHARACTERS, 'characters'));
  } else if (category === 'houses') {
    addStats(await downloadCategory('Great Houses', GREAT_HOUSES, 'houses'));
    addStats(await downloadCategory('Noble Houses', NOBLE_HOUSES, 'houses'));
  } else if (category === 'locations') {
    addStats(await downloadCategory('Locations', MAJOR_LOCATIONS, 'locations'));
  } else if (category === 'events') {
    addStats(await downloadCategory('Events & Battles', EVENTS_AND_BATTLES, 'events'));
  } else if (category === 'culture') {
    addStats(await downloadCategory('Culture & Organizations', CULTURE_AND_ORGANIZATIONS, 'culture'));
  } else {
    logger.error(`Unknown category: ${category}`);
    logger.info('Usage: bun src/download-asoiaf-wiki.ts [characters|pov|houses|locations|events|culture|all]');
    process.exit(1);
  }

  logger.info('\n=== Summary ===');
  logger.info(`Downloaded: ${stats.downloaded}`);
  logger.info(`Skipped: ${stats.skipped}`);
  logger.info(`Failed: ${stats.failed}`);
  logger.info('=== ASOIAF Wiki scraping complete ===');
}

main().catch(console.error);

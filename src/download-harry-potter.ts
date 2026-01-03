/**
 * Harry Potter Wiki Scraper
 * Scrapes character, spell, creature, location, and potion data from harrypotter.fandom.com
 * Usage: bun src/download-harry-potter.ts [category]
 * Categories: characters, spells, creatures, locations, potions, objects, all
 */

import * as cheerio from 'cheerio';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { fetchWithRetry, createRateLimiter, sleep } from './lib/http.js';
import { createLogger } from './lib/logger.js';

const logger = createLogger('harry-potter');
const rateLimiter = createRateLimiter(0.5); // Be nice to the wiki

const HP_DIR = join(process.cwd(), 'generation', 'harry-potter');
const BASE_URL = 'https://harrypotter.fandom.com';

// ============================================
// KEY CHARACTERS TO SCRAPE
// ============================================
const MAIN_CHARACTERS = [
  // Trio & close friends
  'Harry_Potter', 'Hermione_Granger', 'Ronald_Weasley', 'Neville_Longbottom', 'Luna_Lovegood', 'Ginny_Weasley',

  // Hogwarts Staff
  'Albus_Dumbledore', 'Severus_Snape', 'Minerva_McGonagall', 'Rubeus_Hagrid', 'Horace_Slughorn',
  'Pomona_Sprout', 'Filius_Flitwick', 'Sybill_Trelawney', 'Remus_Lupin', 'Alastor_Moody',
  'Dolores_Umbridge', 'Gilderoy_Lockhart', 'Quirinus_Quirrell',

  // Villains
  'Tom_Riddle', 'Bellatrix_Lestrange', 'Lucius_Malfoy', 'Draco_Malfoy', 'Peter_Pettigrew',
  'Bartemius_Crouch_Junior', 'Fenrir_Greyback', 'Narcissa_Malfoy', 'Corban_Yaxley',

  // Order of the Phoenix
  'Sirius_Black', 'James_Potter', 'Lily_J._Potter', 'Arthur_Weasley', 'Molly_Weasley',
  'Nymphadora_Tonks', 'Kingsley_Shacklebolt', 'Aberforth_Dumbledore',

  // Weasley Family
  'Fred_Weasley', 'George_Weasley', 'Bill_Weasley', 'Charlie_Weasley', 'Percy_Weasley',

  // Hogwarts Students
  'Cedric_Diggory', 'Cho_Chang', 'Seamus_Finnigan', 'Dean_Thomas', 'Lavender_Brown',
  'Parvati_Patil', 'Padma_Patil', 'Colin_Creevey', 'Oliver_Wood', 'Katie_Bell',
  'Angelina_Johnson', 'Lee_Jordan', 'Ernie_Macmillan', 'Hannah_Abbott', 'Susan_Bones',
  'Vincent_Crabbe', 'Gregory_Goyle', 'Pansy_Parkinson', 'Blaise_Zabini', 'Theodore_Nott',

  // Ministry of Magic
  'Cornelius_Fudge', 'Rufus_Scrimgeour', 'Pius_Thicknesse', 'Bartemius_Crouch_Senior',
  'Amelia_Bones', 'Dolores_Umbridge',

  // Other key characters
  'Dobby', 'Kreacher', 'Gellert_Grindelwald', 'Nicolas_Flamel', 'Petunia_Dursley',
  'Vernon_Dursley', 'Dudley_Dursley', 'Argus_Filch', 'Moaning_Myrtle', 'Nearly_Headless_Nick',
  'The_Bloody_Baron', 'The_Fat_Friar', 'The_Grey_Lady', 'Peeves',
  'Fleur_Delacour', 'Viktor_Krum', 'Olympe_Maxime', 'Igor_Karkaroff',

  // Fantastic Beasts characters
  'Newt_Scamander', 'Tina_Goldstein', 'Queenie_Goldstein', 'Jacob_Kowalski', 'Credence_Barebone',
];

// ============================================
// KEY SPELLS TO SCRAPE
// ============================================
const MAIN_SPELLS = [
  // Unforgivable Curses
  'Killing_Curse', 'Cruciatus_Curse', 'Imperius_Curse',

  // Common spells
  'Summoning_Charm', 'Disarming_Charm', 'Stunning_Spell', 'Shield_Charm', 'Patronus_Charm',
  'Unlocking_Charm', 'Locking_Spell', 'Levitation_Charm', 'Lumos', 'Nox',
  'Reparo', 'Scourgify', 'Aguamenti', 'Incendio', 'Stupefy', 'Petrificus_Totalus',
  'Obliviate', 'Confundus_Charm', 'Impediment_Jinx', 'Silencing_Charm',

  // Transfiguration
  'Animagus', 'Transfiguration', 'Switching_Spell', 'Vanishing_Spell',

  // Dark Magic
  'Sectumsempra', 'Fiendfyre', 'Morsmordre', 'Dark_Mark',

  // Defensive
  'Expecto_Patronum', 'Protego', 'Protego_Maxima', 'Salvio_Hexia', 'Cave_Inimicum',

  // Healing
  'Episkey', 'Vulnera_Sanentur', 'Rennervate',

  // Household/Utility
  'Aparecium', 'Homenum_Revelio', 'Prior_Incantato', 'Specialis_Revelio',
  'Pack', 'Point_Me', 'Portus', 'Reducto', 'Relashio', 'Riddikulus',

  // Movement
  'Apparition', 'Disapparition', 'Floo_Network', 'Portkey',
];

// ============================================
// KEY CREATURES
// ============================================
const MAIN_CREATURES = [
  'Phoenix', 'Hippogriff', 'Thestral', 'Dragon', 'Basilisk', 'Acromantula',
  'House-elf', 'Goblin', 'Centaur', 'Merpeople', 'Giant', 'Troll',
  'Dementor', 'Werewolf', 'Vampire', 'Ghost', 'Poltergeist', 'Boggart',
  'Unicorn', 'Niffler', 'Bowtruckle', 'Thunderbird', 'Occamy', 'Demiguise',
  'Erumpent', 'Graphorn', 'Swooping_Evil', 'Kelpie', 'Grindylow', 'Pixie',
  'Gnome', 'Flobberworm', 'Blast-Ended_Skrewt', 'Hungarian_Horntail',
  'Norwegian_Ridgeback', 'Hebridean_Black', 'Fawkes', 'Buckbeak', 'Aragog',
  'Nagini', 'Hedwig', 'Scabbers', 'Crookshanks', 'Pigwidgeon', 'Errol',
];

// ============================================
// KEY LOCATIONS
// ============================================
const MAIN_LOCATIONS = [
  // Hogwarts
  'Hogwarts_School_of_Witchcraft_and_Wizardry', 'Great_Hall', 'Gryffindor_Tower',
  'Slytherin_Dungeon', 'Ravenclaw_Tower', 'Hufflepuff_Basement', 'Room_of_Requirement',
  'Chamber_of_Secrets', 'Forbidden_Forest', 'Black_Lake', 'Quidditch_pitch',
  'Astronomy_Tower', 'Owlery', 'Library', 'Hospital_wing', 'Dumbledore%27s_office',

  // Diagon Alley
  'Diagon_Alley', 'Ollivanders', 'Gringotts_Wizarding_Bank', 'Weasleys%27_Wizard_Wheezes',
  'Leaky_Cauldron', 'Flourish_and_Blotts', 'Eeylops_Owl_Emporium', 'Quality_Quidditch_Supplies',

  // Other Wizarding locations
  'Hogsmeade', 'Three_Broomsticks_Inn', 'Hog%27s_Head_Inn', 'Honeydukes', 'Zonko%27s_Joke_Shop',
  'Shrieking_Shack', 'Ministry_of_Magic', 'St_Mungo%27s_Hospital_for_Magical_Maladies_and_Injuries',
  'Azkaban', 'Nurmengard', 'Godric%27s_Hollow', 'The_Burrow', 'Shell_Cottage',
  '12_Grimmauld_Place', 'Malfoy_Manor', 'Riddle_House', 'Little_Hangleton',
  'Platform_Nine_and_Three-Quarters', 'Hogwarts_Express', 'Knight_Bus',

  // International
  'Ilvermorny_School_of_Witchcraft_and_Wizardry', 'Beauxbatons_Academy_of_Magic', 'Durmstrang_Institute',
  'MACUSA',

  // Muggle locations
  '4_Privet_Drive', 'King%27s_Cross_Station',
];

// ============================================
// KEY OBJECTS
// ============================================
const MAIN_OBJECTS = [
  // Deathly Hallows
  'Elder_Wand', 'Resurrection_Stone', 'Cloak_of_Invisibility', 'Deathly_Hallows',

  // Horcruxes
  'Horcrux', 'Tom_Riddle%27s_diary', 'Marvolo_Gaunt%27s_Ring', 'Salazar_Slytherin%27s_Locket',
  'Helga_Hufflepuff%27s_Cup', 'Rowena_Ravenclaw%27s_Diadem', 'Harry_Potter_(Horcrux)',

  // Magical objects
  'Philosopher%27s_Stone', 'Marauder%27s_Map', 'Time-Turner', 'Pensieve', 'Mirror_of_Erised',
  'Sorting_Hat', 'Goblet_of_Fire', 'Triwizard_Cup', 'Remembrall', 'Sneakoscope',
  'Deluminator', 'Two-way_mirror', 'Vanishing_Cabinet', 'Hand_of_Glory',

  // Quidditch
  'Quidditch', 'Quaffle', 'Bludger', 'Golden_Snitch', 'Broomstick', 'Nimbus_2000', 'Firebolt',

  // Wands
  'Wand', 'Harry_Potter%27s_wand', 'Hermione_Granger%27s_wand', 'Lord_Voldemort%27s_wand',

  // Books within HP
  'The_Tales_of_Beedle_the_Bard', 'Erta_Draco_Dormiens_Nunquam_Titillandus',
];

// ============================================
// KEY POTIONS
// ============================================
const MAIN_POTIONS = [
  'Polyjuice_Potion', 'Felix_Felicis', 'Veritaserum', 'Amortentia', 'Draught_of_Living_Death',
  'Wolfsbane_Potion', 'Pepperup_Potion', 'Skele-Gro', 'Mandrake_Restorative_Draught',
  'Elixir_of_Life', 'Ageing_Potion', 'Shrinking_Solution', 'Swelling_Solution',
  'Wit-Sharpening_Potion', 'Confusing_Concoction', 'Forgetfulness_Potion', 'Sleeping_Draught',
  'Calming_Draught', 'Girding_Potion', 'Strengthening_Solution', 'Antidote_to_Common_Poisons',
  'Doxycide', 'Essence_of_Dittany', 'Murtlap_Essence', 'Blood-Replenishing_Potion',
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

  const url = `${BASE_URL}/wiki/${slug}`;

  try {
    const html = await fetchWithRetry(url, 2);
    const $ = cheerio.load(html);

    // Get title
    const title = $('h1.page-header__title').text().trim() ||
                  $('#firstHeading').text().trim() ||
                  $('h1').first().text().trim();

    // Get summary (first paragraph)
    const summary = $('.mw-parser-output > p').first().text().trim();

    // Get main content (all paragraphs)
    const contentParagraphs: string[] = [];
    $('.mw-parser-output > p').each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 50) {
        contentParagraphs.push(text);
      }
    });
    const content = contentParagraphs.join('\n\n');

    // Get infobox data
    const infobox: Record<string, string> = {};
    $('.portable-infobox, .infobox').find('tr, .pi-item').each((_, el) => {
      const label = $(el).find('th, .pi-data-label').text().trim();
      const value = $(el).find('td, .pi-data-value').text().trim();
      if (label && value) {
        infobox[label] = value;
      }
    });

    // Also try data-source attributes for fandom wikis
    $('[data-source]').each((_, el) => {
      const source = $(el).attr('data-source') || '';
      const value = $(el).find('.pi-data-value').text().trim() || $(el).text().trim();
      if (source && value && !infobox[source]) {
        infobox[source] = value;
      }
    });

    // Get categories
    const categories: string[] = [];
    $('.page-header__categories a, #mw-normal-catlinks a').each((_, el) => {
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
  const dir = join(HP_DIR, subdir);
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

    await sleep(1500); // Be respectful
  }

  logger.info(`\n${category}: Downloaded ${downloaded}, Skipped ${skipped}, Failed ${failed}\n`);
}

// ============================================
// MAIN
// ============================================
async function main() {
  const category = process.argv[2];

  if (!existsSync(HP_DIR)) {
    mkdirSync(HP_DIR, { recursive: true });
  }

  logger.info('=== Harry Potter Wiki Scraper ===\n');

  if (!category || category === 'all') {
    await downloadCategory('Characters', MAIN_CHARACTERS, 'characters');
    await downloadCategory('Spells', MAIN_SPELLS, 'spells');
    await downloadCategory('Creatures', MAIN_CREATURES, 'creatures');
    await downloadCategory('Locations', MAIN_LOCATIONS, 'locations');
    await downloadCategory('Objects', MAIN_OBJECTS, 'objects');
    await downloadCategory('Potions', MAIN_POTIONS, 'potions');
  } else if (category === 'characters') {
    await downloadCategory('Characters', MAIN_CHARACTERS, 'characters');
  } else if (category === 'spells') {
    await downloadCategory('Spells', MAIN_SPELLS, 'spells');
  } else if (category === 'creatures') {
    await downloadCategory('Creatures', MAIN_CREATURES, 'creatures');
  } else if (category === 'locations') {
    await downloadCategory('Locations', MAIN_LOCATIONS, 'locations');
  } else if (category === 'objects') {
    await downloadCategory('Objects', MAIN_OBJECTS, 'objects');
  } else if (category === 'potions') {
    await downloadCategory('Potions', MAIN_POTIONS, 'potions');
  } else {
    logger.error(`Unknown category: ${category}`);
    logger.info('Usage: bun src/download-harry-potter.ts [characters|spells|creatures|locations|objects|potions|all]');
  }

  logger.info('=== Harry Potter Wiki scraping complete ===');
}

main().catch(console.error);

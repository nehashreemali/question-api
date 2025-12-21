/**
 * Fix topic categories to match the registry structure
 * Maps the broader categories from the seed script to the actual registry categories
 */

import { Database } from 'bun:sqlite';
import { join } from 'path';

const db = new Database(join(import.meta.dir, '..', 'data', 'registry.db'));

// Mapping from seed script structure to registry structure
// Format: old (category, subcategory) -> new (category, subcategory)
const categoryMappings: Record<string, Record<string, { category: string; subcategory: string }>> = {
  // Sports mappings
  'sports': {
    'american-sports': { category: 'american-sports', subcategory: 'general' },
    'combat-sports': { category: 'combat-sports', subcategory: 'general' },
    'cricket': { category: 'cricket', subcategory: 'general' },
    'football': { category: 'football', subcategory: 'general' },
    'motorsport': { category: 'other-sports', subcategory: 'motorsport' },
    'olympics': { category: 'olympics', subcategory: 'general' },
    'other-sports': { category: 'other-sports', subcategory: 'general' },
    'tennis': { category: 'other-sports', subcategory: 'tennis' },
  },
  // Science mappings
  'science': {
    'astronomy': { category: 'space', subcategory: 'astronomy' },
    'biology': { category: 'biology', subcategory: 'general' },
    'chemistry': { category: 'chemistry', subcategory: 'general' },
    'earth-science': { category: 'environment', subcategory: 'earth-science' },
    'physics': { category: 'physics', subcategory: 'general' },
  },
  // Entertainment mappings
  'entertainment': {
    'awards': { category: 'movies', subcategory: 'awards' },
    'gaming': { category: 'video-games', subcategory: 'general' },
    'literature': { category: 'literature', subcategory: 'general' },
    'music': { category: 'music', subcategory: 'general' },
  },
  // General knowledge mappings
  'general-knowledge': {
    'current-affairs': { category: 'politics', subcategory: 'international' },
    'india': { category: 'regional-history', subcategory: 'india' },
    'indian-epics': { category: 'epics', subcategory: 'indian' },
    'miscellaneous': { category: 'world-cultures', subcategory: 'general' },
  },
};

// Topic-specific mappings for sports (more precise)
const topicMappings: Record<string, { category: string; subcategory: string }> = {
  // American Sports
  'mlb': { category: 'american-sports', subcategory: 'mlb' },
  'nba': { category: 'american-sports', subcategory: 'nba' },
  'nfl': { category: 'american-sports', subcategory: 'nfl' },
  'nhl': { category: 'american-sports', subcategory: 'nhl' },
  'super-bowl': { category: 'american-sports', subcategory: 'super-bowl' },
  // Combat Sports
  'boxing': { category: 'combat-sports', subcategory: 'boxing' },
  'ufc-mma': { category: 'combat-sports', subcategory: 'mma' },
  'wwe': { category: 'combat-sports', subcategory: 'wwe' },
  'wwe-royal-rumble': { category: 'combat-sports', subcategory: 'events' },
  'wwe-wrestlemania': { category: 'combat-sports', subcategory: 'events' },
  // Cricket
  'cricket-legends': { category: 'cricket', subcategory: 'players' },
  'cricket-world-cups': { category: 'cricket', subcategory: 'world-cup' },
  'ipl': { category: 'cricket', subcategory: 'ipl' },
  'odi-cricket': { category: 'cricket', subcategory: 'odi' },
  't20-cricket': { category: 'cricket', subcategory: 't20' },
  'test-cricket': { category: 'cricket', subcategory: 'test-cricket' },
  'ashes': { category: 'cricket', subcategory: 'test-cricket' },
  // Football
  'bundesliga': { category: 'football', subcategory: 'clubs' },
  'fifa-world-cup': { category: 'football', subcategory: 'world-cup' },
  'football-legends': { category: 'football', subcategory: 'players' },
  'la-liga': { category: 'football', subcategory: 'la-liga' },
  'premier-league': { category: 'football', subcategory: 'premier-league' },
  'serie-a': { category: 'football', subcategory: 'clubs' },
  'champions-league': { category: 'football', subcategory: 'champions-league' },
  'euros': { category: 'football', subcategory: 'world-cup' },
  // Motorsport
  'formula-1': { category: 'other-sports', subcategory: 'motorsport' },
  'motogp': { category: 'other-sports', subcategory: 'motorsport' },
  'nascar': { category: 'other-sports', subcategory: 'motorsport' },
  'rally': { category: 'other-sports', subcategory: 'motorsport' },
  // Olympics
  'olympic-legends': { category: 'olympics', subcategory: 'olympians' },
  'olympic-records': { category: 'olympics', subcategory: 'records' },
  'summer-olympics': { category: 'olympics', subcategory: 'summer-olympics' },
  'winter-olympics': { category: 'olympics', subcategory: 'winter-olympics' },
  // Other Sports
  'athletics': { category: 'olympics', subcategory: 'track-field' },
  'badminton': { category: 'other-sports', subcategory: 'badminton' },
  'cycling': { category: 'other-sports', subcategory: 'cycling' },
  'golf': { category: 'other-sports', subcategory: 'golf' },
  'swimming': { category: 'olympics', subcategory: 'swimming' },
  'table-tennis': { category: 'other-sports', subcategory: 'badminton' },
  // Tennis
  'grand-slams': { category: 'other-sports', subcategory: 'tennis' },
  'tennis-legends': { category: 'other-sports', subcategory: 'tennis' },
  'us-open': { category: 'other-sports', subcategory: 'tennis' },
  'wimbledon': { category: 'other-sports', subcategory: 'tennis' },
  // Science - Astronomy
  'black-holes': { category: 'space', subcategory: 'astronomy' },
  'cosmology': { category: 'space', subcategory: 'astronomy' },
  'exoplanets': { category: 'space', subcategory: 'planets' },
  'solar-system': { category: 'space', subcategory: 'planets' },
  'space-exploration': { category: 'space', subcategory: 'exploration' },
  'stars-and-galaxies': { category: 'space', subcategory: 'astronomy' },
  // Science - Biology
  'botany': { category: 'plants', subcategory: 'botany' },
  'cell-biology': { category: 'biology', subcategory: 'cells' },
  'ecology': { category: 'environment', subcategory: 'ecosystems' },
  'evolution': { category: 'biology', subcategory: 'evolution' },
  'genetics': { category: 'biology', subcategory: 'genetics' },
  'human-anatomy': { category: 'biology', subcategory: 'human-body' },
  'human-physiology': { category: 'biology', subcategory: 'human-body' },
  'marine-biology': { category: 'animals', subcategory: 'marine-life' },
  'microbiology': { category: 'biology', subcategory: 'microbiology' },
  'zoology': { category: 'animals', subcategory: 'wildlife' },
  // Science - Chemistry
  'atomic-structure': { category: 'chemistry', subcategory: 'fundamentals' },
  'biochemistry': { category: 'chemistry', subcategory: 'biochemistry' },
  'chemical-reactions': { category: 'chemistry', subcategory: 'reactions' },
  'inorganic-chemistry': { category: 'chemistry', subcategory: 'inorganic' },
  'organic-chemistry': { category: 'chemistry', subcategory: 'organic' },
  'periodic-table': { category: 'chemistry', subcategory: 'elements' },
  'physical-chemistry': { category: 'chemistry', subcategory: 'fundamentals' },
  // Science - Earth Science
  'climate-science': { category: 'environment', subcategory: 'climate' },
  'geology': { category: 'environment', subcategory: 'geology' },
  'meteorology': { category: 'environment', subcategory: 'weather' },
  'oceanography': { category: 'environment', subcategory: 'oceans' },
  'volcanoes-earthquakes': { category: 'environment', subcategory: 'geology' },
  // Science - Physics
  'mechanics': { category: 'physics', subcategory: 'mechanics' },
  'electromagnetism': { category: 'physics', subcategory: 'electromagnetism' },
  'fluid-dynamics': { category: 'physics', subcategory: 'mechanics' },
  'nuclear-physics': { category: 'physics', subcategory: 'nuclear' },
  'optics': { category: 'physics', subcategory: 'optics' },
  'quantum-physics': { category: 'physics', subcategory: 'quantum' },
  'relativity': { category: 'physics', subcategory: 'relativity' },
  'thermodynamics': { category: 'physics', subcategory: 'thermodynamics' },
  'waves-and-sound': { category: 'physics', subcategory: 'waves' },
  // Entertainment - Awards
  'oscar-awards': { category: 'movies', subcategory: 'awards' },
  'bafta': { category: 'movies', subcategory: 'awards' },
  'emmy-awards': { category: 'tv-shows', subcategory: 'awards' },
  'golden-globes': { category: 'movies', subcategory: 'awards' },
  // Entertainment - Gaming
  'esports': { category: 'video-games', subcategory: 'esports' },
  'nintendo': { category: 'video-games', subcategory: 'consoles' },
  'pc-gaming': { category: 'video-games', subcategory: 'pc-games' },
  'playstation': { category: 'video-games', subcategory: 'consoles' },
  'retro-gaming': { category: 'video-games', subcategory: 'retro' },
  'video-game-history': { category: 'video-games', subcategory: 'history' },
  // Entertainment - Literature
  'bestsellers': { category: 'literature', subcategory: 'modern-literature' },
  'classic-literature': { category: 'literature', subcategory: 'classics' },
  'famous-authors': { category: 'literature', subcategory: 'authors' },
  'mythology': { category: 'mythology', subcategory: 'world-mythology' },
  'nobel-literature': { category: 'literature', subcategory: 'awards' },
  'poetry': { category: 'literature', subcategory: 'poetry' },
  'shakespeare': { category: 'literature', subcategory: 'classics' },
  // Entertainment - Music
  'billboard-charts': { category: 'music', subcategory: 'charts' },
  'bollywood-music': { category: 'music', subcategory: 'bollywood' },
  'classical-music': { category: 'music', subcategory: 'classical' },
  'grammy-awards': { category: 'music', subcategory: 'awards' },
  'hip-hop': { category: 'music', subcategory: 'hip-hop' },
  'music-legends': { category: 'music', subcategory: 'artists' },
  'music-instruments': { category: 'music', subcategory: 'instruments' },
  'pop-music': { category: 'music', subcategory: 'pop' },
  'rock-music': { category: 'music', subcategory: 'rock' },
  // General Knowledge - Current Affairs
  'international-organizations': { category: 'politics', subcategory: 'international' },
  'nobel-prizes': { category: 'famous-people', subcategory: 'achievements' },
  'world-events': { category: 'history', subcategory: 'contemporary' },
  // General Knowledge - India
  'indian-constitution': { category: 'politics', subcategory: 'india' },
  'indian-culture': { category: 'world-cultures', subcategory: 'india' },
  'indian-economy': { category: 'economics', subcategory: 'india' },
  'indian-freedom-movement': { category: 'regional-history', subcategory: 'india' },
  'indian-geography': { category: 'geography', subcategory: 'india' },
  'indian-politics': { category: 'politics', subcategory: 'india' },
  // General Knowledge - Indian Epics
  'bhagavad-gita': { category: 'epics', subcategory: 'indian' },
  'jataka-tales': { category: 'epics', subcategory: 'indian' },
  'mahabharata': { category: 'epics', subcategory: 'indian' },
  'panchatantra': { category: 'epics', subcategory: 'indian' },
  'puranas': { category: 'epics', subcategory: 'indian' },
  'ramayana': { category: 'epics', subcategory: 'indian' },
  'upanishads': { category: 'epics', subcategory: 'indian' },
  'vedas': { category: 'epics', subcategory: 'indian' },
  // General Knowledge - Miscellaneous
  'architecture': { category: 'art', subcategory: 'architecture' },
  'famous-quotes': { category: 'literature', subcategory: 'quotes' },
  'fashion': { category: 'world-cultures', subcategory: 'fashion' },
  'food-and-cuisine': { category: 'food', subcategory: 'cuisines' },
  'currencies': { category: 'economics', subcategory: 'currencies' },
  'languages': { category: 'languages', subcategory: 'world-languages' },
  'world-leaders': { category: 'politics', subcategory: 'leaders' },
  'religions': { category: 'religion', subcategory: 'world-religions' },
};

// Get all orphaned topics (topics that reference non-existent categories)
const orphanedTopics = db.query(`
  SELECT t.category, t.subcategory, t.slug, t.name
  FROM topics t
  LEFT JOIN categories c ON t.category = c.slug
  WHERE c.slug IS NULL
`).all() as any[];

console.log(`Found ${orphanedTopics.length} topics with non-existent categories\n`);

let updated = 0;
let skipped = 0;

for (const topic of orphanedTopics) {
  // First try topic-specific mapping
  let mapping = topicMappings[topic.slug];

  // If no topic-specific mapping, try category/subcategory mapping
  if (!mapping && categoryMappings[topic.category]?.[topic.subcategory]) {
    mapping = categoryMappings[topic.category][topic.subcategory];
  }

  if (mapping) {
    // Check if the target subcategory exists
    const subExists = db.query(`
      SELECT 1 FROM subcategories WHERE category = ? AND slug = ?
    `).get(mapping.category, mapping.subcategory);

    if (subExists) {
      // Update the topic
      db.run(`
        UPDATE topics
        SET category = ?, subcategory = ?
        WHERE category = ? AND subcategory = ? AND slug = ?
      `, mapping.category, mapping.subcategory, topic.category, topic.subcategory, topic.slug);

      console.log(`✓ ${topic.name}: ${topic.category}/${topic.subcategory} → ${mapping.category}/${mapping.subcategory}`);
      updated++;
    } else {
      console.log(`✗ ${topic.name}: Target subcategory ${mapping.category}/${mapping.subcategory} doesn't exist`);
      skipped++;
    }
  } else {
    console.log(`? ${topic.name}: No mapping for ${topic.category}/${topic.subcategory}/${topic.slug}`);
    skipped++;
  }
}

console.log(`\n✓ Updated: ${updated}`);
console.log(`✗ Skipped: ${skipped}`);

// Count remaining orphaned topics
const remaining = db.query(`
  SELECT COUNT(*) as count
  FROM topics t
  LEFT JOIN categories c ON t.category = c.slug
  WHERE c.slug IS NULL
`).get() as any;

console.log(`\nRemaining orphaned topics: ${remaining.count}`);

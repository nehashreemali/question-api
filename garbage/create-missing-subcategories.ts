/**
 * Create missing subcategories that are needed for topic migration
 */

import { ensureSubcategory, initRegistry } from '../src/lib/registry';

initRegistry();

// Missing subcategories needed for topic migration
const missingSubcategories = [
  // Space
  { category: 'space', slug: 'astronomy', name: 'Astronomy' },
  { category: 'space', slug: 'planets', name: 'Planets & Moons' },
  { category: 'space', slug: 'exploration', name: 'Space Exploration' },
  // Biology
  { category: 'biology', slug: 'cells', name: 'Cell Biology' },
  { category: 'biology', slug: 'human-body', name: 'Human Body' },
  // Plants
  { category: 'plants', slug: 'botany', name: 'Botany' },
  // Animals
  { category: 'animals', slug: 'marine-life', name: 'Marine Life' },
  { category: 'animals', slug: 'wildlife', name: 'Wildlife' },
  // Environment
  { category: 'environment', slug: 'ecosystems', name: 'Ecosystems' },
  { category: 'environment', slug: 'climate', name: 'Climate' },
  { category: 'environment', slug: 'geology', name: 'Geology' },
  // Chemistry
  { category: 'chemistry', slug: 'fundamentals', name: 'Fundamentals' },
  // Physics
  { category: 'physics', slug: 'nuclear', name: 'Nuclear Physics' },
  { category: 'physics', slug: 'quantum', name: 'Quantum Physics' },
  { category: 'physics', slug: 'waves', name: 'Waves & Sound' },
  // TV Shows
  { category: 'tv-shows', slug: 'awards', name: 'TV Awards' },
  // Video Games
  { category: 'video-games', slug: 'consoles', name: 'Consoles & Platforms' },
  { category: 'video-games', slug: 'pc-games', name: 'PC Games' },
  { category: 'video-games', slug: 'retro', name: 'Retro Gaming' },
  { category: 'video-games', slug: 'history', name: 'Gaming History' },
  // Literature
  { category: 'literature', slug: 'modern-literature', name: 'Modern Literature' },
  { category: 'literature', slug: 'quotes', name: 'Famous Quotes' },
  // Mythology
  { category: 'mythology', slug: 'world-mythology', name: 'World Mythology' },
  // Music
  { category: 'music', slug: 'charts', name: 'Charts & Hits' },
  { category: 'music', slug: 'bollywood', name: 'Bollywood Music' },
  { category: 'music', slug: 'awards', name: 'Music Awards' },
  { category: 'music', slug: 'instruments', name: 'Musical Instruments' },
  // Famous People
  { category: 'famous-people', slug: 'achievements', name: 'Achievements' },
  // Politics
  { category: 'politics', slug: 'india', name: 'Indian Politics' },
  { category: 'politics', slug: 'leaders', name: 'World Leaders' },
  // World Cultures
  { category: 'world-cultures', slug: 'india', name: 'Indian Culture' },
  { category: 'world-cultures', slug: 'fashion', name: 'Fashion' },
  // Economics
  { category: 'economics', slug: 'india', name: 'Indian Economy' },
  { category: 'economics', slug: 'currencies', name: 'World Currencies' },
  // Regional History
  { category: 'regional-history', slug: 'india', name: 'Indian History' },
  // Geography
  { category: 'geography', slug: 'india', name: 'Indian Geography' },
  // Epics
  { category: 'epics', slug: 'indian', name: 'Indian Epics' },
  // Languages
  { category: 'languages', slug: 'world-languages', name: 'World Languages' },
  // Food
  { category: 'food', slug: 'cuisines', name: 'World Cuisines' },
  // Religion
  { category: 'religion', slug: 'world-religions', name: 'World Religions' },
];

let created = 0;
for (const sub of missingSubcategories) {
  try {
    ensureSubcategory(sub);
    console.log(`✓ Created: ${sub.category}/${sub.slug}`);
    created++;
  } catch (e: any) {
    console.log(`✗ Failed: ${sub.category}/${sub.slug} - ${e.message}`);
  }
}

console.log(`\n✓ Created ${created} subcategories`);

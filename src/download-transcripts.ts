/**
 * Batch download TV show transcripts
 * Usage: bun src/download-transcripts.ts [show-slug]
 */

import { scrapeAndSave, transcriptExists } from './lib/tv-scraper.js';
import { createRateLimiter, sleep } from './lib/http.js';
import { createLogger } from './lib/logger.js';

const logger = createLogger('download');

interface ShowConfig {
  name: string;
  slug: string;
  seasons: number[];  // Array of episode counts per season
}

const SHOWS: ShowConfig[] = [
  // Wave 1 - Already downloaded
  { name: 'The Office', slug: 'the-office-us', seasons: [6, 22, 25, 14, 28, 26, 26, 24, 25] },
  { name: 'The Big Bang Theory', slug: 'the-big-bang-theory', seasons: [17, 23, 23, 24, 24, 24, 24, 24, 24, 24, 24, 24] },
  { name: 'Seinfeld', slug: 'seinfeld', seasons: [5, 12, 23, 24, 22, 24, 24, 22, 24] },
  { name: 'Parks and Recreation', slug: 'parks-and-recreation', seasons: [6, 24, 16, 22, 22, 22, 13] },
  { name: 'Brooklyn Nine-Nine', slug: 'brooklyn-nine-nine', seasons: [22, 23, 23, 22, 22, 18, 13, 10] },
  { name: 'How I Met Your Mother', slug: 'how-i-met-your-mother', seasons: [22, 22, 20, 24, 24, 24, 24, 24, 24] },

  // Wave 2 - Classic Sitcoms
  { name: 'Community', slug: 'community', seasons: [25, 24, 22, 13, 13, 13] },
  { name: 'Modern Family', slug: 'modern-family', seasons: [24, 24, 24, 24, 24, 24, 22, 22, 22, 22, 18] },
  { name: 'Arrested Development', slug: 'arrested-development', seasons: [22, 18, 13, 15, 16] },
  { name: 'Scrubs', slug: 'scrubs', seasons: [24, 22, 22, 25, 24, 22, 11, 19, 13] },
  { name: 'Frasier', slug: 'frasier', seasons: [24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24] },
  { name: 'New Girl', slug: 'new-girl', seasons: [24, 25, 23, 22, 22, 22, 8] },
  { name: 'The Good Place', slug: 'the-good-place', seasons: [13, 13, 13, 14] },
  { name: "Schitt's Creek", slug: 'schitts-creek', seasons: [13, 13, 13, 13, 14, 14] },

  // Wave 3 - Premium Drama
  { name: 'Breaking Bad', slug: 'breaking-bad', seasons: [7, 13, 13, 13, 16] },
  { name: 'Better Call Saul', slug: 'better-call-saul', seasons: [10, 10, 10, 10, 10, 13] },
  { name: 'The Sopranos', slug: 'the-sopranos', seasons: [13, 13, 13, 13, 13, 21] },
  { name: 'The Wire', slug: 'the-wire', seasons: [13, 12, 12, 13, 10] },
  { name: 'Mad Men', slug: 'mad-men', seasons: [13, 13, 13, 13, 13, 13, 14] },
  { name: 'Stranger Things', slug: 'stranger-things', seasons: [8, 9, 8, 9] },
  { name: 'The Crown', slug: 'the-crown', seasons: [10, 10, 10, 10, 10, 10] },
  { name: 'Succession', slug: 'succession', seasons: [10, 10, 9, 10] },
  { name: 'Peaky Blinders', slug: 'peaky-blinders', seasons: [6, 6, 6, 6, 6, 6] },
  { name: 'Ozark', slug: 'ozark', seasons: [10, 10, 10, 14] },

  // Wave 4 - Comedy & Cult
  { name: "It's Always Sunny", slug: 'its-always-sunny-in-philadelphia', seasons: [7, 10, 15, 13, 12, 14, 13, 10, 10, 10, 10, 10, 10, 10, 8, 8] },
  { name: 'Curb Your Enthusiasm', slug: 'curb-your-enthusiasm', seasons: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10] },
  { name: '30 Rock', slug: '30-rock', seasons: [21, 15, 22, 22, 23, 22, 13] },
  { name: 'Veep', slug: 'veep', seasons: [8, 10, 10, 10, 10, 10, 7] },
  { name: 'The Simpsons', slug: 'the-simpsons', seasons: [13, 22, 24, 22, 22, 25, 25, 25, 25, 23, 22, 21, 22, 22, 22, 21, 22, 22, 20, 21] },
  { name: 'South Park', slug: 'south-park', seasons: [13, 18, 17, 17, 14, 17, 15, 14, 14, 14, 14, 14, 14, 14, 14, 10, 10, 10, 6, 6] },
  { name: 'Family Guy', slug: 'family-guy', seasons: [7, 21, 22, 30, 18, 12, 16, 21, 18, 23, 22, 21, 18, 20, 20, 20, 20, 20, 20, 20] },
  { name: 'Rick and Morty', slug: 'rick-and-morty', seasons: [11, 10, 10, 10, 10, 10, 10] },
  { name: 'Futurama', slug: 'futurama', seasons: [13, 20, 15, 18, 16, 26, 26, 10, 10, 10] },
  { name: 'Archer', slug: 'archer', seasons: [10, 13, 13, 13, 13, 8, 10, 8, 8, 9, 8, 8, 8, 8] },

  // Wave 5 - Sci-Fi & Fantasy
  { name: 'Doctor Who', slug: 'doctor-who-2005', seasons: [13, 14, 14, 14, 13, 13, 14, 13, 12, 12, 11, 10, 10, 8] },
  { name: 'Black Mirror', slug: 'black-mirror', seasons: [3, 3, 6, 3, 6, 5] },
  { name: 'The Mandalorian', slug: 'the-mandalorian', seasons: [8, 8, 8] },
  { name: 'The Witcher', slug: 'the-witcher-2019', seasons: [8, 8, 8] },
  { name: 'Westworld', slug: 'westworld-2016', seasons: [10, 10, 8, 8] },
  { name: 'Lost', slug: 'lost', seasons: [25, 24, 23, 14, 17, 18] },
  { name: 'The X-Files', slug: 'the-x-files', seasons: [24, 25, 24, 24, 20, 22, 22, 21, 20, 6, 10] },
  { name: 'Battlestar Galactica', slug: 'battlestar-galactica', seasons: [13, 20, 20, 22] },

  // Wave 6 - International & British
  { name: 'The Office UK', slug: 'the-office', seasons: [6, 6, 2] },
  { name: 'Sherlock', slug: 'sherlock', seasons: [3, 3, 3, 3, 1] },
  { name: 'Downton Abbey', slug: 'downton-abbey', seasons: [7, 9, 9, 9, 9, 9] },
  { name: 'Money Heist', slug: 'money-heist', seasons: [13, 16, 16] },
  { name: 'Dark', slug: 'dark', seasons: [10, 8, 8] },
];

// Rate limit: 1 request per 2 seconds to be polite
const rateLimiter = createRateLimiter(0.5);

async function downloadShow(config: ShowConfig): Promise<{ success: number; skipped: number; failed: number }> {
  const { name, slug, seasons } = config;
  let success = 0;
  let skipped = 0;
  let failed = 0;

  logger.info(`\n${'='.repeat(60)}`);
  logger.info(`Downloading: ${name}`);
  logger.info(`${'='.repeat(60)}`);

  for (let season = 1; season <= seasons.length; season++) {
    const episodeCount = seasons[season - 1];
    logger.info(`\nSeason ${season}: ${episodeCount} episodes`);

    for (let episode = 1; episode <= episodeCount; episode++) {
      // Check if already exists
      if (transcriptExists(slug, season, episode)) {
        logger.info(`  S${season.toString().padStart(2, '0')}E${episode.toString().padStart(2, '0')} - Already exists, skipping`);
        skipped++;
        continue;
      }

      // Rate limit
      await rateLimiter();

      try {
        await scrapeAndSave({ show: slug, season, episode });
        success++;
        logger.success(`  S${season.toString().padStart(2, '0')}E${episode.toString().padStart(2, '0')} - Downloaded`);
      } catch (error: any) {
        failed++;
        logger.error(`  S${season.toString().padStart(2, '0')}E${episode.toString().padStart(2, '0')} - Failed: ${error.message}`);
      }

      // Extra delay between episodes
      await sleep(500);
    }
  }

  return { success, skipped, failed };
}

async function main() {
  const args = process.argv.slice(2);
  const targetShow = args[0];

  let showsToDownload = SHOWS;

  if (targetShow) {
    const show = SHOWS.find(s => s.slug === targetShow || s.name.toLowerCase() === targetShow.toLowerCase());
    if (!show) {
      logger.error(`Show not found: ${targetShow}`);
      logger.info('Available shows:');
      SHOWS.forEach(s => logger.info(`  - ${s.slug} (${s.name})`));
      process.exit(1);
    }
    showsToDownload = [show];
  }

  logger.info('TV Transcript Downloader');
  logger.info(`Downloading ${showsToDownload.length} show(s)`);

  const totals = { success: 0, skipped: 0, failed: 0 };

  for (const show of showsToDownload) {
    const result = await downloadShow(show);
    totals.success += result.success;
    totals.skipped += result.skipped;
    totals.failed += result.failed;
  }

  logger.info(`\n${'='.repeat(60)}`);
  logger.info('DOWNLOAD COMPLETE');
  logger.info(`${'='.repeat(60)}`);
  logger.success(`Downloaded: ${totals.success}`);
  logger.info(`Skipped (already exist): ${totals.skipped}`);
  if (totals.failed > 0) {
    logger.error(`Failed: ${totals.failed}`);
  }
}

main().catch(console.error);

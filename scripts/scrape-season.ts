#!/usr/bin/env bun

/**
 * Scrape all transcripts for a season
 *
 * Usage:
 *   bun scripts/scrape-season.ts "Friends" 2
 */

import { scrapeAndSave } from '../src/lib/tv-scraper.js';
import {
  getEpisodeManifest,
  initEpisodeManifest,
  saveEpisodeManifest,
  updateEpisodeTranscript,
  updateSeasonFromEpisodes,
  updateSeriesFromSeasons,
  updateGlobalFromSeries,
  getSeasonManifest,
  initSeasonManifest,
  saveSeasonManifest,
} from '../src/lib/manifest.js';
import { existsSync } from 'fs';
import { join } from 'path';

const DEFAULT_EPISODES_PER_SEASON = 24;

function transcriptExists(show: string, season: number, episode: number): boolean {
  const seriesSlug = show.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const transcriptPath = join(
    process.cwd(),
    'data',
    'tv-shows',
    seriesSlug,
    `season-${season}`,
    `episode-${episode}`,
    'transcript.json'
  );
  return existsSync(transcriptPath);
}

async function scrapeSeasonTranscripts(
  show: string,
  season: number,
  episodeCount: number = DEFAULT_EPISODES_PER_SEASON
): Promise<void> {
  const seriesSlug = show.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📥 Transcript Scraper
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Show:     ${show}
Season:   ${season}
Episodes: 1-${episodeCount}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);

  let totalScraped = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  // Initialize season manifest
  let seasonManifest = getSeasonManifest(seriesSlug, season);
  if (!seasonManifest) {
    console.log('📝 Initializing season manifest...\n');
    seasonManifest = initSeasonManifest(show, seriesSlug, season, episodeCount);
    saveSeasonManifest(seriesSlug, season, seasonManifest);
  }

  for (let episode = 1; episode <= episodeCount; episode++) {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📺 Episode ${episode}/${episodeCount}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    // Check if transcript already exists
    if (transcriptExists(show, season, episode)) {
      console.log(`   ⏭️  Transcript already exists, skipping\n`);
      totalSkipped++;
      continue;
    }

    try {
      // Initialize episode manifest
      let episodeManifest = getEpisodeManifest(seriesSlug, season, episode);
      if (!episodeManifest) {
        episodeManifest = initEpisodeManifest(show, seriesSlug, season, episode, `S${season}E${episode}`);
        saveEpisodeManifest(seriesSlug, season, episode, episodeManifest);
      }

      // Scrape transcript
      console.log(`   📥 Scraping transcript...`);
      const result = await scrapeAndSave({ show, season, episode });

      // Update manifest with episode title
      episodeManifest = getEpisodeManifest(seriesSlug, season, episode);
      if (episodeManifest) {
        episodeManifest.episode.title = result.title;
        saveEpisodeManifest(seriesSlug, season, episode, episodeManifest);
      }

      // Update manifest with transcript data
      updateEpisodeTranscript(seriesSlug, season, episode, {
        source: result.source,
        sourceUrl: result.sourceUrl,
        wordCount: result.wordCount,
        hasCharacterNames: result.hasCharacterNames,
        quality: 'good',
      });

      updateSeasonFromEpisodes(seriesSlug, season);
      updateSeriesFromSeasons(seriesSlug);
      updateGlobalFromSeries();

      console.log(`   ✅ Scraped: ${result.title}`);
      console.log(`   📊 ${result.wordCount} words | Source: ${result.source}\n`);

      totalScraped++;

      // Small delay to be nice to the server
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error: any) {
      console.log(`   ❌ Failed: ${error.message}\n`);
      totalFailed++;
    }
  }

  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Transcript Scraping Complete!`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`
📊 Summary:
   Scraped: ${totalScraped} episodes
   Skipped: ${totalSkipped} episodes (already exist)
   Failed:  ${totalFailed} episodes

💡 Next step: Generate questions
   npm run generate:friends:s${season}
  `);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log(`
Transcript Scraper - Scrape all episodes for a season

Usage:
  bun scripts/scrape-season.ts <show> <season> [episodeCount]

Examples:
  bun scripts/scrape-season.ts "Friends" 2
  bun scripts/scrape-season.ts "Friends" 2 24
  bun scripts/scrape-season.ts "The Big Bang Theory" 1 17

Note: Transcript scraping does NOT use API tokens!
      It's fast and free - scrape as many as you want.
    `);
    process.exit(1);
  }

  const show = args[0];
  const season = parseInt(args[1]);
  const episodeCount = args[2] ? parseInt(args[2]) : DEFAULT_EPISODES_PER_SEASON;

  if (isNaN(season)) {
    console.error('❌ Season must be a number');
    process.exit(1);
  }

  await scrapeSeasonTranscripts(show, season, episodeCount);
}

main();

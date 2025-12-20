#!/usr/bin/env bun

/**
 * TV Show Transcript Scraper
 *
 * Usage:
 *   bun src/scrape-tv.ts "Show Name" <season> <episode>
 *   bun src/scrape-tv.ts "Friends" 1 1
 */

import { scrapeAndSave } from './lib/tv-scraper.js';
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
} from './lib/manifest.js';

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.log(`
📺 TV Show Transcript Scraper (Functional)

Usage:
  bun src/scrape-tv-functional.ts <show-name> <season> <episode>

Examples:
  bun src/scrape-tv-functional.ts "Friends" 1 1
  bun src/scrape-tv-functional.ts "The Big Bang Theory" 1 1
    `);
    process.exit(1);
  }

  const [show, seasonStr, episodeStr] = args;
  const season = parseInt(seasonStr);
  const episode = parseInt(episodeStr);

  if (isNaN(season) || isNaN(episode)) {
    console.error('❌ Season and episode must be numbers');
    process.exit(1);
  }

  console.log(`
📺 TV Show Transcript Scraper
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Show:    ${show}
Season:  ${season}
Episode: ${episode}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);

  try {
    // Initialize episode manifest if it doesn't exist
    const seriesSlug = show.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    let episodeManifest = getEpisodeManifest(seriesSlug, season, episode);

    if (!episodeManifest) {
      console.log('📝 Initializing episode manifest...');
      episodeManifest = initEpisodeManifest(show, seriesSlug, season, episode, `S${season}E${episode}`);
      saveEpisodeManifest(seriesSlug, season, episode, episodeManifest);
    }

    // Scrape transcript
    const result = await scrapeAndSave({ show, season, episode });

    // Update episode manifest with actual episode title
    episodeManifest = getEpisodeManifest(seriesSlug, season, episode);
    if (episodeManifest) {
      episodeManifest.episode.title = result.title;
      saveEpisodeManifest(seriesSlug, season, episode, episodeManifest);
    }

    // Update manifest with transcript data
    console.log('📝 Updating episode manifest...');
    updateEpisodeTranscript(seriesSlug, season, episode, {
      source: result.source,
      sourceUrl: result.sourceUrl,
      wordCount: result.wordCount,
      hasCharacterNames: result.hasCharacterNames,
      quality: 'good',
    });

    // Update season manifest
    let seasonManifest = getSeasonManifest(seriesSlug, season);
    if (!seasonManifest) {
      console.log('📝 Initializing season manifest...');
      seasonManifest = initSeasonManifest(show, seriesSlug, season, 24); // Default 24 episodes
      saveSeasonManifest(seriesSlug, season, seasonManifest);
    }

    console.log('📝 Updating season manifest...');
    updateSeasonFromEpisodes(seriesSlug, season);

    // Update series and global manifests
    console.log('📝 Updating series manifest...');
    updateSeriesFromSeasons(seriesSlug);

    console.log('📝 Updating global manifest...');
    updateGlobalFromSeries();

    console.log(`
✅ Success! Transcript saved and manifests updated.

Next step: Generate questions
  bun src/generate-questions.ts "${show}" ${season} ${episode}
    `);
  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}`);
    console.error(`
Troubleshooting:
  - Check show name spelling
  - Verify season/episode exists
  - Check internet connection
    `);
    process.exit(1);
  }
}

main();

#!/usr/bin/env bun

/**
 * Fix manifest to mark episodes with missing transcripts
 */

import { existsSync } from 'fs';
import { join } from 'path';
import {
  getSeasonManifest,
  saveSeasonManifest,
  updateSeriesFromSeasons,
  updateGlobalFromSeries,
} from '../src/lib/manifest.js';

const showName = 'Friends';
const seriesSlug = 'friends';

console.log('🔍 Checking for missing transcripts...\n');

for (let season = 1; season <= 10; season++) {
  const seasonManifest = getSeasonManifest(seriesSlug, season);
  if (!seasonManifest) continue;

  let updated = false;

  for (let episode = 1; episode <= 24; episode++) {
    const transcriptPath = join(
      process.cwd(),
      'data/tv-shows',
      seriesSlug,
      `season-${season}`,
      `episode-${episode}`,
      'transcript.json'
    );

    const hasTranscript = existsSync(transcriptPath);
    const episodeData = seasonManifest.episodes?.find((e: any) => e.episode === episode);

    if (!hasTranscript && episodeData) {
      console.log(`❌ S${season}E${episode}: Missing transcript`);

      // Mark as failed in manifest
      if (!episodeData.transcript) {
        episodeData.transcript = {};
      }
      episodeData.transcript.status = 'missing';
      episodeData.transcript.error = 'Transcript not available from source (404)';
      episodeData.status = 'failed';
      updated = true;
    }
  }

  if (updated) {
    saveSeasonManifest(seriesSlug, season, seasonManifest);
    console.log(`✅ Updated Season ${season} manifest\n`);
  }
}

// Update series and global manifests
updateSeriesFromSeasons(seriesSlug);
updateGlobalFromSeries();

console.log('\n✅ Manifest sync complete!');

#!/usr/bin/env bun

/**
 * Smart Batch Question Generator
 *
 * Efficiently generates questions for multiple episodes while:
 * - Minimizing token usage
 * - Handling rate limits gracefully
 * - Resuming from where it stopped
 * - Skipping already completed episodes
 *
 * Usage:
 *   bun scripts/batch-generate.ts "Friends" 1        # Generate all Season 1
 *   bun scripts/batch-generate.ts "Friends" 1 5 10   # Generate episodes 5-10
 *   bun scripts/batch-generate.ts "Friends"          # Generate all seasons
 */

import { existsSync } from 'fs';
import { join } from 'path';
import { scrapeAndSave } from '../src/lib/tv-scraper.js';
import { generateQuestions } from '../src/lib/question-generator.js';
import {
  getEpisodeManifest,
  initEpisodeManifest,
  saveEpisodeManifest,
  updateEpisodeTranscript,
  updateEpisodeQuestions,
  updateSeasonFromEpisodes,
  updateSeriesFromSeasons,
  updateGlobalFromSeries,
  getSeasonManifest,
  initSeasonManifest,
  saveSeasonManifest,
} from '../src/lib/manifest.js';

// Configuration
interface Config {
  api_keys: {
    groq: string;
  };
  ai_settings: {
    model: string;
    temperature: number;
    questions_per_transcript: number;
  };
}

interface BatchConfig {
  show: string;
  season?: number;
  startEpisode?: number;
  endEpisode?: number;
  delayBetweenEpisodes?: number; // milliseconds
}

const DEFAULT_EPISODES_PER_SEASON = 24;

async function loadConfig(): Promise<Config> {
  const configPath = join(process.cwd(), 'config.json');
  if (!existsSync(configPath)) {
    throw new Error('config.json not found');
  }
  const text = await Bun.file(configPath).text();
  return JSON.parse(text);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function questionFileExists(show: string, season: number, episode: number): boolean {
  const seriesSlug = show.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const questionsPath = join(
    process.cwd(),
    'data',
    'tv-shows',
    seriesSlug,
    `season-${season}`,
    `episode-${episode}`,
    'questions.json'
  );
  return existsSync(questionsPath);
}

function transcriptFileExists(show: string, season: number, episode: number): boolean {
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

async function processEpisode(
  config: Config,
  show: string,
  season: number,
  episode: number
): Promise<{ success: boolean; rateLimited: boolean; skipped: boolean }> {
  const seriesSlug = show.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  // Check if questions already exist
  if (questionFileExists(show, season, episode)) {
    console.log(`   ⏭️  Episode ${episode} - Already has questions, skipping`);
    return { success: true, rateLimited: false, skipped: true };
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📺 Processing S${season.toString().padStart(2, '0')}E${episode.toString().padStart(2, '0')}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  try {
    // Step 1: Scrape transcript if needed
    if (!transcriptFileExists(show, season, episode)) {
      console.log('   📥 Scraping transcript...');

      let episodeManifest = getEpisodeManifest(seriesSlug, season, episode);
      if (!episodeManifest) {
        episodeManifest = initEpisodeManifest(show, seriesSlug, season, episode, `S${season}E${episode}`);
        saveEpisodeManifest(seriesSlug, season, episode, episodeManifest);
      }

      const result = await scrapeAndSave({ show, season, episode });

      // Update manifest
      episodeManifest = getEpisodeManifest(seriesSlug, season, episode);
      if (episodeManifest) {
        episodeManifest.episode.title = result.title;
        saveEpisodeManifest(seriesSlug, season, episode, episodeManifest);
      }

      updateEpisodeTranscript(seriesSlug, season, episode, {
        source: result.source,
        sourceUrl: result.sourceUrl,
        wordCount: result.wordCount,
        hasCharacterNames: result.hasCharacterNames,
        quality: 'good',
      });

      let seasonManifest = getSeasonManifest(seriesSlug, season);
      if (!seasonManifest) {
        seasonManifest = initSeasonManifest(show, seriesSlug, season, DEFAULT_EPISODES_PER_SEASON);
        saveSeasonManifest(seriesSlug, season, seasonManifest);
      }

      updateSeasonFromEpisodes(seriesSlug, season);
      updateSeriesFromSeasons(seriesSlug);
      updateGlobalFromSeries();

      console.log(`   ✅ Transcript saved (${result.wordCount} words)`);
    } else {
      console.log('   ✅ Transcript already exists');
    }

    // Step 2: Generate questions
    console.log('   🤖 Generating questions...');

    const questionSet = await generateQuestions({
      show,
      season,
      episode,
      groqApiKey: config.api_keys.groq,
      questionsCount: config.ai_settings.questions_per_transcript,
      model: config.ai_settings.model,
      temperature: config.ai_settings.temperature,
      skipIfExists: true, // This is critical for saving tokens!
    });

    // Update manifest with question stats
    const distribution = { easy: 0, medium: 0, hard: 0 };
    const types = { dialogue: 0, scene: 0, character: 0, plot: 0, object: 0 };

    questionSet.questions.forEach((q: any) => {
      if (q.difficulty === 'easy') distribution.easy++;
      else if (q.difficulty === 'medium') distribution.medium++;
      else if (q.difficulty === 'hard') distribution.hard++;

      if (q.type && q.type in types) {
        types[q.type as keyof typeof types]++;
      }
    });

    updateEpisodeQuestions(seriesSlug, season, episode, {
      totalCount: questionSet.questionCount,
      distribution,
      types,
      aiModel: questionSet.aiModel || config.ai_settings.model,
      temperature: questionSet.temperature || config.ai_settings.temperature,
      tokensUsed: questionSet.tokensUsed || 0,
    });

    updateSeasonFromEpisodes(seriesSlug, season);
    updateSeriesFromSeasons(seriesSlug);
    updateGlobalFromSeries();

    console.log(`   ✅ Generated ${questionSet.questionCount} questions`);
    console.log(`   📊 Difficulty: Easy ${distribution.easy} | Medium ${distribution.medium} | Hard ${distribution.hard}`);

    return { success: true, rateLimited: false, skipped: false };

  } catch (error: any) {
    // Check for rate limit error
    if (error.message?.includes('429') || error.response?.status === 429) {
      console.log(`   ⚠️  Rate limit warning (will retry next episode)`);
      // Don't return rateLimited=true immediately, let the batch continue
      // The actual rate limit will be detected after multiple failures
      return { success: false, rateLimited: false, skipped: false };
    }

    console.error(`   ❌ Error: ${error.message}`);
    return { success: false, rateLimited: false, skipped: false };
  }
}

async function batchGenerate(batchConfig: BatchConfig): Promise<void> {
  const config = await loadConfig();
  const { show, season, startEpisode = 1, delayBetweenEpisodes = 2000 } = batchConfig;
  let { endEpisode = DEFAULT_EPISODES_PER_SEASON } = batchConfig;

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Smart Batch Question Generator
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Show:     ${show}
Season:   ${season || 'All'}
Episodes: ${startEpisode}-${endEpisode}
Model:    ${config.ai_settings.model}
Questions per episode: ${config.ai_settings.questions_per_transcript}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);

  let totalProcessed = 0;
  let totalSkipped = 0;
  let totalFailed = 0;
  let consecutiveFailures = 0;
  const MAX_CONSECUTIVE_FAILURES = 3; // Stop after 3 consecutive failures

  // Process episodes
  for (let ep = startEpisode; ep <= endEpisode; ep++) {
    const result = await processEpisode(config, show, season!, ep);

    if (result.skipped) {
      totalSkipped++;
      consecutiveFailures = 0; // Reset on skip
    } else if (result.success) {
      totalProcessed++;
      consecutiveFailures = 0; // Reset on success
    } else if (result.rateLimited) {
      consecutiveFailures++;

      // Only stop if we have multiple consecutive failures
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log('⏰ Rate Limit Reached');
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`\nProcessed: ${totalProcessed} episodes`);
        console.log(`Skipped: ${totalSkipped} episodes (already complete)`);
        console.log(`Failed: ${consecutiveFailures} consecutive failures`);
        console.log(`\nTo resume, run:`);
        console.log(`  bun scripts/batch-generate.ts "${show}" ${season} ${ep} ${endEpisode}`);
        console.log(`\nThe rate limit typically resets after ~1 hour.`);
        console.log(`All transcripts have been saved, so resuming will be fast!`);
        process.exit(0);
      } else {
        console.log(`   ⚡ Retrying next episode (${consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES} failures)...`);
      }
    } else {
      totalFailed++;
      consecutiveFailures++;

      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log('❌ Too Many Failures');
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`\nProcessed: ${totalProcessed} episodes`);
        console.log(`Skipped: ${totalSkipped} episodes`);
        console.log(`Failed: ${totalFailed} episodes`);
        process.exit(1);
      }
    }

    // Small delay between episodes to be nice to the API
    if (ep < endEpisode) {
      await sleep(delayBetweenEpisodes);
    }
  }

  // Final summary
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log('✅ Batch Generation Complete!');
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`\nProcessed: ${totalProcessed} episodes`);
  console.log(`Skipped: ${totalSkipped} episodes (already complete)`);
  console.log(`Failed: ${totalFailed} episodes`);
  console.log(`\nView progress:`);
  console.log(`  cat data/tv-shows/${show.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/season-${season}/manifest.json`);
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log(`
Smart Batch Question Generator

Usage:
  bun scripts/batch-generate.ts <show> <season> [startEpisode] [endEpisode]

Examples:
  bun scripts/batch-generate.ts "Friends" 1
  bun scripts/batch-generate.ts "Friends" 1 14 24
  bun scripts/batch-generate.ts "The Big Bang Theory" 1

Features:
  ✅ Auto-skips completed episodes (saves tokens!)
  ✅ Handles rate limits gracefully
  ✅ Easy resume from where it stopped
  ✅ Automatic manifest tracking
  ✅ Small delays between episodes
    `);
    process.exit(1);
  }

  const show = args[0];
  const season = parseInt(args[1]);
  const startEpisode = args[2] ? parseInt(args[2]) : 1;
  const endEpisode = args[3] ? parseInt(args[3]) : DEFAULT_EPISODES_PER_SEASON;

  if (isNaN(season)) {
    console.error('❌ Season must be a number');
    process.exit(1);
  }

  await batchGenerate({
    show,
    season,
    startEpisode,
    endEpisode,
    delayBetweenEpisodes: 2000, // 2 second delay between episodes
  });
}

main();

#!/usr/bin/env bun

/**
 * Simple Quiz Generator - Main Entry Point
 *
 * Single function to scrape transcript AND generate questions
 * Smart caching: If transcript exists, skips directly to question generation
 *
 * Usage:
 *   bun index.ts "Show Name" <season> <episode>
 *   bun index.ts "Friends" 2 5
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { scrapeAndSave } from './src/lib/tv-scraper.js';
import { generateQuestions } from './src/lib/question-generator.js';
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
} from './src/lib/manifest.js';

interface Config {
  api_keys?: {
    groq?: string;
  };
  ai_settings?: {
    model?: string;
    questions_per_transcript?: number;
    temperature?: number;
  };
}

/**
 * Main function: Generate questions for a TV show episode
 * Automatically handles transcript scraping if needed
 */
async function generateTVShowQuestions(
  showName: string,
  seasonNumber: number,
  episodeNumber: number
): Promise<void> {
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎬 Simple Quiz Generator
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Show:    ${showName}
Season:  ${seasonNumber}
Episode: ${episodeNumber}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);

  // Load config
  const configPath = join(process.cwd(), 'config.json');
  if (!existsSync(configPath)) {
    throw new Error('config.json not found');
  }

  const config: Config = JSON.parse(readFileSync(configPath, 'utf8'));
  const groqApiKey = config.api_keys?.groq || process.env.GROQ_API_KEY;

  if (!groqApiKey) {
    throw new Error('Groq API key not found! Add it to config.json or set GROQ_API_KEY environment variable.');
  }

  const seriesSlug = showName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  // Check if questions already exist
  const questionPath = join(
    process.cwd(),
    'data/tv-shows',
    seriesSlug,
    `season-${seasonNumber}`,
    `episode-${episodeNumber}`,
    'questions.json'
  );

  if (existsSync(questionPath)) {
    console.log('✅ Questions already exist for this episode!');
    console.log(`   Location: ${questionPath}`);
    console.log('\n💡 Use --force flag to regenerate');
    return;
  }

  // Step 1: Check if transcript exists, if not scrape it
  const transcriptPath = join(
    process.cwd(),
    'data/tv-shows',
    seriesSlug,
    `season-${seasonNumber}`,
    `episode-${episodeNumber}`,
    'transcript.json'
  );

  let transcriptResult;

  if (existsSync(transcriptPath)) {
    console.log('✅ Transcript already exists, skipping scrape...\n');
  } else {
    console.log('📥 Fetching transcript from API...\n');

    try {
      // Initialize episode manifest if needed
      let episodeManifest = getEpisodeManifest(seriesSlug, seasonNumber, episodeNumber);
      if (!episodeManifest) {
        episodeManifest = initEpisodeManifest(
          showName,
          seriesSlug,
          seasonNumber,
          episodeNumber,
          `S${seasonNumber}E${episodeNumber}`
        );
        saveEpisodeManifest(seriesSlug, seasonNumber, episodeNumber, episodeManifest);
      }

      // Scrape transcript
      transcriptResult = await scrapeAndSave({
        show: showName,
        season: seasonNumber,
        episode: episodeNumber,
      });

      // Update manifests
      updateEpisodeTranscript(seriesSlug, seasonNumber, episodeNumber, {
        source: transcriptResult.source,
        sourceUrl: transcriptResult.sourceUrl,
        wordCount: transcriptResult.wordCount,
        hasCharacterNames: transcriptResult.hasCharacterNames,
        quality: 'good',
      });

      // Initialize season manifest if needed
      let seasonManifest = getSeasonManifest(seriesSlug, seasonNumber);
      if (!seasonManifest) {
        seasonManifest = initSeasonManifest(showName, seriesSlug, seasonNumber, 24);
        saveSeasonManifest(seriesSlug, seasonNumber, seasonManifest);
      }

      updateSeasonFromEpisodes(seriesSlug, seasonNumber);
      updateSeriesFromSeasons(seriesSlug);
      updateGlobalFromSeries();

      console.log(`✅ Transcript saved: ${transcriptResult.wordCount} words\n`);
    } catch (error: any) {
      console.error(`❌ Failed to fetch transcript: ${error.message}`);
      console.error(`   This episode may not exist or is unavailable from the source.`);
      throw error;
    }
  }

  // Step 2: Generate questions using AI
  console.log('🤖 Step 2/2: Generating questions with AI...\n');

  try {
    const questionSet = await generateQuestions({
      show: showName,
      season: seasonNumber,
      episode: episodeNumber,
      groqApiKey,
      questionsCount: config.ai_settings?.questions_per_transcript || 35,
      model: config.ai_settings?.model || 'llama-3.3-70b-versatile',
      temperature: config.ai_settings?.temperature || 0.7,
      skipIfExists: false,
    });

    // Calculate distributions
    const distribution = { easy: 0, medium: 0, hard: 0 };
    const types = { dialogue: 0, scene: 0, character: 0, plot: 0, object: 0 };

    questionSet.questions.forEach((q) => {
      if (q.difficulty === 'easy') distribution.easy++;
      else if (q.difficulty === 'medium') distribution.medium++;
      else if (q.difficulty === 'hard') distribution.hard++;

      if (q.type && q.type in types) {
        types[q.type as keyof typeof types]++;
      }
    });

    // Update manifests
    updateEpisodeQuestions(seriesSlug, seasonNumber, episodeNumber, {
      totalCount: questionSet.questionCount,
      distribution,
      types,
      aiModel: questionSet.aiModel || 'llama-3.3-70b-versatile',
      temperature: questionSet.temperature || 0.7,
      tokensUsed: questionSet.tokensUsed || 0,
    });

    updateSeasonFromEpisodes(seriesSlug, seasonNumber);
    updateSeriesFromSeasons(seriesSlug);
    updateGlobalFromSeries();

    // Display results
    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ SUCCESS!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 Generated: ${questionSet.questionCount} questions
📊 Difficulty: Easy ${distribution.easy} | Medium ${distribution.medium} | Hard ${distribution.hard}
💾 Saved to: ${questionPath}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);

    // Show sample questions
    console.log('📝 Sample Questions:\n');
    questionSet.questions.slice(0, 2).forEach((q, i) => {
      console.log(`Q${i + 1} [${q.difficulty.toUpperCase()}]: ${q.question}`);
      q.options.forEach((opt, j) => {
        const marker = opt === q.correct_answer ? '✓' : ' ';
        console.log(`   ${['A', 'B', 'C', 'D'][j]}. [${marker}] ${opt}`);
      });
      console.log();
    });
  } catch (error: any) {
    console.error(`❌ Failed to generate questions: ${error.message}`);

    // Check for rate limit
    if (error.message?.includes('429') || error.response?.status === 429) {
      console.error('\n⏰ Rate limit hit! Please wait ~1 hour before trying again.');
    }

    throw error;
  }
}

/**
 * Process entire season
 */
async function generateSeasonQuestions(
  showName: string,
  seasonNumber: number,
  maxEpisodes: number = 24
): Promise<void> {
  const seriesSlug = showName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  // Validate season number for known shows
  const knownShows: Record<string, { maxSeasons: number; episodesPerSeason: number }> = {
    'friends': { maxSeasons: 10, episodesPerSeason: 24 },
    'the-big-bang-theory': { maxSeasons: 12, episodesPerSeason: 24 },
  };

  if (knownShows[seriesSlug] && seasonNumber > knownShows[seriesSlug].maxSeasons) {
    console.error(`\n❌ Error: ${showName} only has ${knownShows[seriesSlug].maxSeasons} seasons!`);
    console.error(`   You requested season ${seasonNumber}, which doesn't exist.`);
    process.exit(1);
  }

  // Find the last completed episode from manifest to resume from
  let startEpisode = 1;
  const seasonManifest = getSeasonManifest(seriesSlug, seasonNumber);

  if (seasonManifest?.episodes) {
    // Find highest episode number with completed questions
    const completedEpisodes = seasonManifest.episodes
      .filter((ep: any) => ep.status === 'completed' || ep.questionCount > 0)
      .map((ep: any) => ep.episode)
      .sort((a: number, b: number) => b - a); // Sort descending

    if (completedEpisodes.length > 0) {
      startEpisode = completedEpisodes[0] + 1; // Start from next episode

      if (startEpisode > maxEpisodes) {
        console.log(`\n✅ All episodes already completed for ${showName} Season ${seasonNumber}!`);
        console.log(`   Last completed: Episode ${completedEpisodes[0]}`);
        return;
      }

      console.log(`\n📍 Resuming from Episode ${startEpisode} (last completed: Episode ${completedEpisodes[0]})`);
    }
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎬 Batch Season Generator
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Show:    ${showName}
Season:  ${seasonNumber}
Mode:    Process episodes ${startEpisode}-${maxEpisodes}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);

  let processed = 0;
  let skipped = 0;
  let failed = 0;
  let consecutiveFailures = 0;
  const MAX_CONSECUTIVE_FAILURES = 3;

  for (let ep = startEpisode; ep <= maxEpisodes; ep++) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📺 Episode ${ep}/${maxEpisodes}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    try {
      // Check if episode is marked as failed in manifest
      const episodeManifest = getEpisodeManifest(seriesSlug, seasonNumber, ep);
      if (episodeManifest?.transcript?.status === 'missing' || episodeManifest?.transcript?.status === 'failed') {
        console.log('⏭️  Transcript marked as missing/failed, skipping...');
        skipped++;
        consecutiveFailures = 0;
        continue;
      }

      // Check if already has questions
      const questionPath = join(
        process.cwd(),
        'data/tv-shows',
        seriesSlug,
        `season-${seasonNumber}`,
        `episode-${ep}`,
        'questions.json'
      );

      if (existsSync(questionPath)) {
        console.log('⏭️  Questions already exist, skipping...');
        skipped++;
        consecutiveFailures = 0; // Reset on skip
        continue;
      }

      await generateTVShowQuestions(showName, seasonNumber, ep);
      processed++;
      consecutiveFailures = 0; // Reset on success

      // Delay between episodes to stay under rate limits
      // Groq free tier: 6,000 tokens/min, large transcripts can use ~6,500+ tokens
      // Wait 1 minute between episodes to stay under limit
      if (ep < maxEpisodes) {
        console.log('⏳ Waiting 1 minute before next episode (rate limit protection)...');
        await new Promise(resolve => setTimeout(resolve, 60000));
      }
    } catch (error: any) {
      // Check for rate limit
      if (error.message?.includes('429') || error.response?.status === 429) {
        consecutiveFailures++;

        if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
          console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
          console.log('⏰ Rate Limit Reached');
          console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
          console.log(`\nProcessed: ${processed} episodes`);
          console.log(`Skipped: ${skipped} episodes (already complete)`);
          console.log(`Failed: ${consecutiveFailures} consecutive rate limits`);
          console.log(`\nTo resume from episode ${ep}, run:`);
          console.log(`  bun index.ts "${showName}" ${seasonNumber} ${ep}`);
          console.log(`\nOr continue one-by-one when rate limit resets (~1 hour)`);
          process.exit(0);
        } else {
          console.log(`   ⚡ Retrying next episode (${consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES} failures)...`);
        }
      } else {
        failed++;
        consecutiveFailures++;
        console.error(`   ❌ Failed: ${error.message}`);

        if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
          console.log(`\n❌ Too many consecutive failures. Stopping.`);
          process.exit(1);
        }
      }
    }
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Season Processing Complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Processed: ${processed} episodes
Skipped:   ${skipped} episodes (already complete)
Failed:    ${failed} episodes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
}

// CLI execution
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log(`
🎬 Simple Quiz Generator

Usage:
  Single Episode:
    bun index.ts <show-name> <season> <episode>

  Entire Season:
    bun index.ts <show-name> <season>

Examples:
  bun index.ts "Friends" 2 5          # Single episode
  bun index.ts "Friends" 2             # Entire season 2
  bun index.ts "The Big Bang Theory" 1 # Entire season 1

What it does:
  1. Checks if transcript exists, if not fetches from API
  2. Generates questions using AI (Groq)
  3. Saves everything to data/tv-shows/
  4. Updates manifest tracking

Smart Features:
  ✓ Auto-skips if questions already exist
  ✓ Caches transcripts (no re-download)
  ✓ Updates all manifests automatically
  ✓ Handles rate limits gracefully
    `);
    process.exit(1);
  }

  const [showName, seasonStr, episodeStr] = args;
  const season = parseInt(seasonStr);

  if (isNaN(season)) {
    console.error('❌ Season must be a valid number');
    process.exit(1);
  }

  try {
    // Check if episode is provided (single episode mode)
    if (episodeStr) {
      const episode = parseInt(episodeStr);
      if (isNaN(episode)) {
        console.error('❌ Episode must be a valid number');
        process.exit(1);
      }
      await generateTVShowQuestions(showName, season, episode);
    } else {
      // Entire season mode
      await generateSeasonQuestions(showName, season);
    }
  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.main) {
  main();
}

// Export for use in other scripts
export { generateTVShowQuestions };

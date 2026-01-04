#!/usr/bin/env bun

/**
 * ❌ DEPRECATED – DO NOT USE
 *
 * This script is deprecated and will throw an error if executed.
 * All question generation must go through: scripts/generate-questions.ts
 * Requires arming phrase: POWER_UP generate_questions
 */
throw new Error('DEPRECATED: Use scripts/generate-questions.ts with POWER_UP arming phrase');

/**
 * TV Show Question Generator
 *
 * Usage:
 *   bun src/generate-questions.ts "Show Name" <season> <episode>
 *   bun src/generate-questions.ts "Friends" 1 1
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { generateQuestions } from './lib/question-generator.js';
import {
  getEpisodeManifest,
  updateEpisodeQuestions,
  updateSeasonFromEpisodes,
  updateSeriesFromSeasons,
  updateGlobalFromSeries,
} from './lib/manifest.js';

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.log(`
🤖 TV Show Question Generator

Usage:
  bun src/generate-questions.ts <show-name> <season> <episode> [--force]

Examples:
  bun src/generate-questions.ts "Friends" 1 1
  bun src/generate-questions.ts "The Big Bang Theory" 1 1 --force

Options:
  --force    Regenerate even if questions already exist
    `);
    process.exit(1);
  }

  const [show, seasonStr, episodeStr, ...flags] = args;
  const season = parseInt(seasonStr);
  const episode = parseInt(episodeStr);
  const skipIfExists = !flags.includes('--force');

  if (isNaN(season) || isNaN(episode)) {
    console.error('❌ Season and episode must be numbers');
    process.exit(1);
  }

  // Load config
  const config = JSON.parse(readFileSync(join(process.cwd(), 'config.json'), 'utf8'));
  const groqApiKey = config.api_keys?.groq || process.env.GROQ_API_KEY;

  if (!groqApiKey) {
    console.error('❌ Groq API key not found! Add it to config.json or set GROQ_API_KEY environment variable.');
    process.exit(1);
  }

  console.log(`
🤖 AI Question Generator
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Show:    ${show}
Season:  ${season}
Episode: ${episode}
Mode:    ${skipIfExists ? 'Skip if exists' : 'Force regenerate'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);

  try {
    const questionSet = await generateQuestions({
      show,
      season,
      episode,
      groqApiKey,
      questionsCount: config.ai_settings?.questions_per_transcript || 35,
      model: config.ai_settings?.model || 'llama-3.3-70b-versatile',
      temperature: config.ai_settings?.temperature || 0.7,
      skipIfExists,
    });

    // Display sample questions
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📝 Sample Questions:\n`);

    questionSet.questions.slice(0, 3).forEach((q, i) => {
      console.log(`Q${i + 1} [${q.difficulty.toUpperCase()}]: ${q.question}`);
      q.options.forEach((opt, j) => {
        const marker = opt === q.correct_answer ? '✓' : ' ';
        console.log(`   ${['A', 'B', 'C', 'D'][j]}. [${marker}] ${opt}`);
      });
      if (q.explanation) {
        console.log(`   💡 ${q.explanation}`);
      }
      console.log();
    });

    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`\n✅ Success! All ${questionSet.questionCount} questions saved.`);

    // Update manifests
    const seriesSlug = show.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    // Calculate difficulty distribution
    const distribution = { easy: 0, medium: 0, hard: 0 };
    questionSet.questions.forEach((q) => {
      if (q.difficulty === 'easy') distribution.easy++;
      else if (q.difficulty === 'medium') distribution.medium++;
      else if (q.difficulty === 'hard') distribution.hard++;
    });

    // Calculate type distribution
    const types = { dialogue: 0, scene: 0, character: 0, plot: 0, object: 0 };
    questionSet.questions.forEach((q) => {
      if (q.type && q.type in types) {
        types[q.type as keyof typeof types]++;
      }
    });

    console.log('\n📝 Updating episode manifest...');
    updateEpisodeQuestions(seriesSlug, season, episode, {
      totalCount: questionSet.questionCount,
      distribution,
      types,
      aiModel: questionSet.aiModel || 'llama-3.3-70b-versatile',
      temperature: questionSet.temperature || 0.7,
      tokensUsed: questionSet.tokensUsed || 0,
    });

    console.log('📝 Updating season manifest...');
    updateSeasonFromEpisodes(seriesSlug, season);

    console.log('📝 Updating series manifest...');
    updateSeriesFromSeasons(seriesSlug);

    console.log('📝 Updating global manifest...');
    updateGlobalFromSeries();

    console.log('\n✅ Manifests updated successfully!');
  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}`);

    // Check for rate limit error
    if (error.response?.data?.error?.code === 'rate_limit_exceeded') {
      console.error('\n⏰ Rate limit hit! Please wait before trying again.');
      console.error('   Consider using --force flag only when necessary to save API calls.');
    }

    process.exit(1);
  }
}

main();

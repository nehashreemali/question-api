#!/usr/bin/env bun

/**
 * Initialize manifest system for TV shows
 *
 * This script initializes series and season manifests for existing shows
 * and creates episode manifests based on existing transcript/question files.
 */

import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import {
  initSeriesManifest,
  saveSeriesManifest,
  initSeasonManifest,
  saveSeasonManifest,
  initEpisodeManifest,
  saveEpisodeManifest,
  updateEpisodeTranscript,
  updateEpisodeQuestions,
  updateSeasonFromEpisodes,
  updateSeriesFromSeasons,
  initGlobalManifest,
  saveGlobalManifest,
  updateGlobalFromSeries,
} from './lib/manifest.js';

interface SeriesConfig {
  name: string;
  slug: string;
  totalSeasons: number;
  totalEpisodes: number;
  genre: string[];
  yearStart: number;
  yearEnd?: number;
  country: string;
  language: string;
  network?: string;
  priority: 'high' | 'medium' | 'low';
  tier: number;
  phase: number;
  sources: {
    primary: string;
    secondary?: string;
    reliability: string;
    overallCoverage: number;
    notes?: string;
  };
  quality: {
    transcriptQuality: string;
    hasCharacterNames: boolean;
    dialogueDensity: string;
    questionGenerationSuitability: string;
  };
}

// Series configurations (from TOP-50-SERIES.md Phase 1)
const SERIES_CONFIG: { [slug: string]: SeriesConfig } = {
  friends: {
    name: 'Friends',
    slug: 'friends',
    totalSeasons: 10,
    totalEpisodes: 236,
    genre: ['Sitcom', 'Comedy', 'Romance'],
    yearStart: 1994,
    yearEnd: 2004,
    country: 'USA',
    language: 'English',
    network: 'NBC',
    priority: 'high',
    tier: 1,
    phase: 1,
    sources: {
      primary: 'Friends Transcripts (fangj.github.io)',
      secondary: 'Subslikescript',
      reliability: 'excellent',
      overallCoverage: 100,
      notes: 'Best transcript source available with character names',
    },
    quality: {
      transcriptQuality: 'excellent',
      hasCharacterNames: true,
      dialogueDensity: 'high',
      questionGenerationSuitability: 'excellent',
    },
  },
  'the-big-bang-theory': {
    name: 'The Big Bang Theory',
    slug: 'the-big-bang-theory',
    totalSeasons: 12,
    totalEpisodes: 279,
    genre: ['Sitcom', 'Comedy'],
    yearStart: 2007,
    yearEnd: 2019,
    country: 'USA',
    language: 'English',
    network: 'CBS',
    priority: 'high',
    tier: 1,
    phase: 1,
    sources: {
      primary: 'Subslikescript',
      reliability: 'good',
      overallCoverage: 95,
    },
    quality: {
      transcriptQuality: 'good',
      hasCharacterNames: false,
      dialogueDensity: 'high',
      questionGenerationSuitability: 'excellent',
    },
  },
  'breaking-bad': {
    name: 'Breaking Bad',
    slug: 'breaking-bad',
    totalSeasons: 5,
    totalEpisodes: 62,
    genre: ['Crime', 'Drama', 'Thriller'],
    yearStart: 2008,
    yearEnd: 2013,
    country: 'USA',
    language: 'English',
    network: 'AMC',
    priority: 'high',
    tier: 1,
    phase: 1,
    sources: {
      primary: 'Subslikescript',
      reliability: 'excellent',
      overallCoverage: 100,
    },
    quality: {
      transcriptQuality: 'excellent',
      hasCharacterNames: false,
      dialogueDensity: 'high',
      questionGenerationSuitability: 'excellent',
    },
  },
  'the-office': {
    name: 'The Office (US)',
    slug: 'the-office',
    totalSeasons: 9,
    totalEpisodes: 201,
    genre: ['Sitcom', 'Comedy', 'Mockumentary'],
    yearStart: 2005,
    yearEnd: 2013,
    country: 'USA',
    language: 'English',
    network: 'NBC',
    priority: 'high',
    tier: 1,
    phase: 1,
    sources: {
      primary: 'Subslikescript',
      reliability: 'good',
      overallCoverage: 95,
    },
    quality: {
      transcriptQuality: 'good',
      hasCharacterNames: false,
      dialogueDensity: 'very high',
      questionGenerationSuitability: 'excellent',
    },
  },
  'how-i-met-your-mother': {
    name: 'How I Met Your Mother',
    slug: 'how-i-met-your-mother',
    totalSeasons: 9,
    totalEpisodes: 208,
    genre: ['Sitcom', 'Comedy', 'Romance'],
    yearStart: 2005,
    yearEnd: 2014,
    country: 'USA',
    language: 'English',
    network: 'CBS',
    priority: 'high',
    tier: 1,
    phase: 1,
    sources: {
      primary: 'Subslikescript',
      reliability: 'good',
      overallCoverage: 95,
    },
    quality: {
      transcriptQuality: 'good',
      hasCharacterNames: false,
      dialogueDensity: 'high',
      questionGenerationSuitability: 'excellent',
    },
  },
};

// Episodes per season (approximations)
const EPISODES_PER_SEASON: { [slug: string]: number[] } = {
  friends: [24, 24, 25, 24, 24, 25, 24, 24, 24, 18],
  'the-big-bang-theory': [17, 23, 23, 24, 24, 24, 24, 24, 24, 24, 24, 24],
  'breaking-bad': [7, 13, 13, 13, 16],
  'the-office': [6, 22, 23, 19, 28, 26, 26, 24, 27],
  'how-i-met-your-mother': [22, 22, 20, 24, 24, 24, 24, 24, 24],
};

function getDataPath(): string {
  return join(process.cwd(), 'data', 'tv-shows');
}

function scanExistingSeries(): string[] {
  const dataPath = getDataPath();
  if (!existsSync(dataPath)) return [];

  return readdirSync(dataPath, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)
    .filter((name) => name in SERIES_CONFIG);
}

function scanSeasons(seriesSlug: string): number[] {
  const seriesPath = join(getDataPath(), seriesSlug);
  if (!existsSync(seriesPath)) return [];

  return readdirSync(seriesPath, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory() && dirent.name.startsWith('season-'))
    .map((dirent) => parseInt(dirent.name.replace('season-', '')))
    .filter((num) => !isNaN(num))
    .sort((a, b) => a - b);
}

function scanEpisodes(seriesSlug: string, season: number): number[] {
  const seasonPath = join(getDataPath(), seriesSlug, `season-${season}`);
  if (!existsSync(seasonPath)) return [];

  return readdirSync(seasonPath, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory() && dirent.name.startsWith('episode-'))
    .map((dirent) => parseInt(dirent.name.replace('episode-', '')))
    .filter((num) => !isNaN(num))
    .sort((a, b) => a - b);
}

function initializeSeriesManifest(seriesSlug: string): void {
  const config = SERIES_CONFIG[seriesSlug];
  if (!config) {
    console.log(`⚠️  No config found for ${seriesSlug}, skipping...`);
    return;
  }

  console.log(`\n📁 Initializing ${config.name}...`);

  // Initialize series manifest
  const seriesManifest = initSeriesManifest(config);
  saveSeriesManifest(seriesSlug, seriesManifest);
  console.log(`   ✅ Series manifest created`);

  // Scan existing seasons
  const existingSeasons = scanSeasons(seriesSlug);

  if (existingSeasons.length === 0) {
    console.log(`   ℹ️  No existing seasons found`);
    return;
  }

  console.log(`   📂 Found ${existingSeasons.length} season(s): ${existingSeasons.join(', ')}`);

  // Initialize season manifests
  for (const season of existingSeasons) {
    const episodeCount = EPISODES_PER_SEASON[seriesSlug]?.[season - 1] || 24;
    const seasonManifest = initSeasonManifest(config.name, seriesSlug, season, episodeCount);
    saveSeasonManifest(seriesSlug, season, seasonManifest);
    console.log(`   ✅ Season ${season} manifest created (${episodeCount} episodes expected)`);

    // Scan existing episodes
    const existingEpisodes = scanEpisodes(seriesSlug, season);
    console.log(`      📄 Found ${existingEpisodes.length} episode(s): ${existingEpisodes.join(', ')}`);

    // Initialize episode manifests
    for (const episode of existingEpisodes) {
      const episodePath = join(getDataPath(), seriesSlug, `season-${season}`, `episode-${episode}`);
      const transcriptPath = join(episodePath, 'transcript.json');
      const questionsPath = join(episodePath, 'questions.json');

      // Initialize episode manifest
      let episodeManifest = initEpisodeManifest(config.name, seriesSlug, season, episode, `S${season}E${episode}`);

      // Check for existing transcript
      if (existsSync(transcriptPath)) {
        try {
          const transcript = JSON.parse(readFileSync(transcriptPath, 'utf8'));
          episodeManifest.episode.title = transcript.title || `S${season}E${episode}`;
          saveEpisodeManifest(seriesSlug, season, episode, episodeManifest);

          updateEpisodeTranscript(seriesSlug, season, episode, {
            source: transcript.source || 'Unknown',
            sourceUrl: transcript.sourceUrl || '',
            wordCount: transcript.wordCount || transcript.transcript?.split(/\s+/).length || 0,
            hasCharacterNames: transcript.hasCharacterNames !== false,
            quality: 'good',
          });
          console.log(`      ✅ Episode ${episode} manifest created (transcript found)`);
        } catch (error) {
          console.log(`      ⚠️  Episode ${episode}: Failed to read transcript`);
          saveEpisodeManifest(seriesSlug, season, episode, episodeManifest);
        }
      }

      // Check for existing questions
      if (existsSync(questionsPath)) {
        try {
          const questions = JSON.parse(readFileSync(questionsPath, 'utf8'));
          const questionsList = questions.questions || [];

          // Calculate distributions
          const distribution = { easy: 0, medium: 0, hard: 0 };
          const types = { dialogue: 0, scene: 0, character: 0, plot: 0, object: 0 };

          questionsList.forEach((q: any) => {
            if (q.difficulty === 'easy') distribution.easy++;
            else if (q.difficulty === 'medium') distribution.medium++;
            else if (q.difficulty === 'hard') distribution.hard++;

            if (q.type && q.type in types) {
              types[q.type as keyof typeof types]++;
            }
          });

          updateEpisodeQuestions(seriesSlug, season, episode, {
            totalCount: questionsList.length,
            distribution,
            types,
            aiModel: questions.aiModel || 'llama-3.3-70b-versatile',
            temperature: questions.temperature || 0.7,
            tokensUsed: questions.tokensUsed || 0,
          });
          console.log(`      ✅ Episode ${episode} questions found (${questionsList.length} questions)`);
        } catch (error) {
          console.log(`      ⚠️  Episode ${episode}: Failed to read questions`);
        }
      }
    }

    // Update season from episodes
    updateSeasonFromEpisodes(seriesSlug, season);
  }

  // Update series from seasons
  updateSeriesFromSeasons(seriesSlug);
  console.log(`   ✅ ${config.name} manifests complete!`);
}

async function main() {
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 Manifest System Initialization
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);

  // Initialize global manifest
  console.log('🌍 Initializing global manifest...');
  const globalManifest = initGlobalManifest();
  saveGlobalManifest(globalManifest);
  console.log('✅ Global manifest created');

  // Scan for existing series
  const existingSeries = scanExistingSeries();

  if (existingSeries.length === 0) {
    console.log('\nℹ️  No existing TV show data found.');
    console.log('   Run scraping commands to generate data first.');
    process.exit(0);
  }

  console.log(`\n📺 Found ${existingSeries.length} series:`);
  existingSeries.forEach((slug) => {
    const config = SERIES_CONFIG[slug];
    console.log(`   - ${config?.name || slug} (${slug})`);
  });

  // Initialize manifests for each series
  for (const slug of existingSeries) {
    initializeSeriesManifest(slug);
  }

  // Update global manifest
  console.log('\n🌍 Updating global manifest...');
  updateGlobalFromSeries();
  console.log('✅ Global manifest updated');

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Manifest initialization complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Next steps:
  - View manifests in data/tv-shows/manifest.json
  - Continue scraping: bun src/scrape-tv.ts "Friends" 1 3
  - Generate questions: bun src/generate-questions.ts "Friends" 1 3
  `);
}

main();

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// ============================================
// Types
// ============================================

export interface EpisodeManifest {
  episode: {
    series: string;
    seriesSlug: string;
    season: number;
    episode: number;
    title: string;
    airDate?: string;
    runtime?: number;
  };
  transcript: {
    status: 'pending' | 'completed' | 'failed' | 'missing';
    source?: string;
    sourceUrl?: string;
    scrapedAt?: string;
    wordCount?: number;
    hasCharacterNames?: boolean;
    quality?: 'excellent' | 'good' | 'fair' | 'poor';
    error?: string;
  };
  questions: {
    status: 'pending' | 'completed' | 'failed';
    generatedAt?: string;
    totalCount?: number;
    distribution?: {
      easy: number;
      medium: number;
      hard: number;
    };
    types?: {
      dialogue: number;
      scene: number;
      character: number;
      plot: number;
      object: number;
    };
    aiModel?: string;
    temperature?: number;
    tokensUsed?: number;
  };
  files: {
    transcript?: string;
    questions?: string;
    rawQuestions?: string;
  };
  validation: {
    transcriptValidated: boolean;
    questionsValidated: boolean;
    noDuplicates: boolean;
    allAnswersValid: boolean;
  };
  metadata: {
    createdAt: string;
    updatedAt: string;
    version: string;
  };
}

export interface SeasonManifest {
  season: {
    series: string;
    seriesSlug: string;
    seasonNumber: number;
    totalEpisodes: number;
    airDateStart?: string;
    airDateEnd?: string;
  };
  progress: {
    episodesCompleted: number;
    episodesInProgress: number;
    episodesPending: number;
    episodesFailed: number;
    completionPercentage: number;
  };
  statistics: {
    totalQuestions: number;
    totalTranscriptWords: number;
    averageQuestionsPerEpisode: number;
    totalTokensUsed: number;
    estimatedCost: number;
  };
  episodes: Array<{
    episode: number;
    title: string;
    status: string;
    questionCount: number;
    lastUpdated: string | null;
  }>;
  sources: {
    primary: string;
    reliability: string;
    coverage: number;
  };
  metadata: {
    createdAt: string;
    updatedAt: string;
    version: string;
  };
}

export interface SeriesManifest {
  series: {
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
    imdbRating?: number;
    priority: 'high' | 'medium' | 'low';
  };
  progress: {
    seasonsCompleted: number;
    seasonsInProgress: number;
    seasonsPending: number;
    episodesCompleted: number;
    episodesInProgress: number;
    episodesPending: number;
    overallCompletionPercentage: number;
  };
  statistics: {
    totalQuestions: number;
    totalTranscriptWords: number;
    averageQuestionsPerEpisode: number;
    totalTokensUsed: number;
    estimatedTotalCost: number;
    projectedTotalQuestions: number;
    projectedTotalCost: number;
  };
  seasons: Array<{
    season: number;
    totalEpisodes: number;
    episodesCompleted: number;
    status: string;
    questionCount: number;
    completionPercentage: number;
    lastUpdated: string | null;
  }>;
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
  metadata: {
    createdAt: string;
    updatedAt: string;
    version: string;
    addedBy: string;
    tier: number;
    phase: number;
  };
}

export interface GlobalManifest {
  tvShows: {
    totalSeries: number;
    seriesCompleted: number;
    seriesInProgress: number;
    seriesPending: number;
    totalEpisodes: number;
    episodesCompleted: number;
    completionPercentage: number;
  };
  statistics: {
    totalQuestions: number;
    totalTranscriptWords: number;
    averageQuestionsPerEpisode: number;
    totalTokensUsed: number;
    totalCostUSD: number;
    projectedTotalQuestions: number;
    projectedTotalCostUSD: number;
  };
  series: Array<{
    name: string;
    slug: string;
    totalSeasons: number;
    totalEpisodes: number;
    episodesCompleted: number;
    questionsGenerated: number;
    status: string;
    priority: string;
    tier: number;
    phase: number;
    completionPercentage: number;
    lastUpdated: string | null;
  }>;
  phases: {
    [key: string]: {
      series: string[];
      totalEpisodes: number;
      episodesCompleted: number;
      completionPercentage: number;
      status: string;
    };
  };
  sources: {
    [key: string]: {
      seriesCount: number;
      reliability: string;
    };
  };
  metadata: {
    createdAt: string;
    updatedAt: string;
    version: string;
    schemaVersion: string;
  };
}

// ============================================
// Helper Functions
// ============================================

function getDataPath(): string {
  return join(process.cwd(), 'data', 'tv-shows');
}

function getEpisodePath(seriesSlug: string, season: number, episode: number): string {
  return join(getDataPath(), seriesSlug, `season-${season}`, `episode-${episode}`);
}

function getSeasonPath(seriesSlug: string, season: number): string {
  return join(getDataPath(), seriesSlug, `season-${season}`);
}

function getSeriesPath(seriesSlug: string): string {
  return join(getDataPath(), seriesSlug);
}

function readManifest<T>(path: string): T | null {
  try {
    if (!existsSync(path)) return null;
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    console.error(`Error reading manifest: ${path}`, error);
    return null;
  }
}

function writeManifest<T>(path: string, data: T): void {
  try {
    const dir = path.substring(0, path.lastIndexOf('/'));
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error(`Error writing manifest: ${path}`, error);
    throw error;
  }
}

// ============================================
// Episode Manifest Functions
// ============================================

export function initEpisodeManifest(
  seriesName: string,
  seriesSlug: string,
  season: number,
  episode: number,
  title: string
): EpisodeManifest {
  const now = new Date().toISOString();

  return {
    episode: {
      series: seriesName,
      seriesSlug,
      season,
      episode,
      title,
    },
    transcript: {
      status: 'pending',
    },
    questions: {
      status: 'pending',
    },
    files: {},
    validation: {
      transcriptValidated: false,
      questionsValidated: false,
      noDuplicates: false,
      allAnswersValid: false,
    },
    metadata: {
      createdAt: now,
      updatedAt: now,
      version: '1.0',
    },
  };
}

export function getEpisodeManifest(
  seriesSlug: string,
  season: number,
  episode: number
): EpisodeManifest | null {
  const path = join(getEpisodePath(seriesSlug, season, episode), 'manifest.json');
  return readManifest<EpisodeManifest>(path);
}

export function saveEpisodeManifest(
  seriesSlug: string,
  season: number,
  episode: number,
  manifest: EpisodeManifest
): void {
  manifest.metadata.updatedAt = new Date().toISOString();
  const path = join(getEpisodePath(seriesSlug, season, episode), 'manifest.json');
  writeManifest(path, manifest);
}

export function updateEpisodeTranscript(
  seriesSlug: string,
  season: number,
  episode: number,
  data: {
    source: string;
    sourceUrl: string;
    wordCount: number;
    hasCharacterNames: boolean;
    quality: 'excellent' | 'good' | 'fair' | 'poor';
  }
): void {
  let manifest = getEpisodeManifest(seriesSlug, season, episode);
  if (!manifest) {
    throw new Error('Episode manifest not found');
  }

  manifest.transcript = {
    status: 'completed',
    source: data.source,
    sourceUrl: data.sourceUrl,
    scrapedAt: new Date().toISOString(),
    wordCount: data.wordCount,
    hasCharacterNames: data.hasCharacterNames,
    quality: data.quality,
  };

  manifest.files.transcript = 'transcript.json';
  manifest.validation.transcriptValidated = true;

  saveEpisodeManifest(seriesSlug, season, episode, manifest);
}

export function updateEpisodeQuestions(
  seriesSlug: string,
  season: number,
  episode: number,
  data: {
    totalCount: number;
    distribution: { easy: number; medium: number; hard: number };
    types?: { dialogue: number; scene: number; character: number; plot: number; object: number };
    aiModel: string;
    temperature: number;
    tokensUsed: number;
  }
): void {
  let manifest = getEpisodeManifest(seriesSlug, season, episode);
  if (!manifest) {
    throw new Error('Episode manifest not found');
  }

  manifest.questions = {
    status: 'completed',
    generatedAt: new Date().toISOString(),
    totalCount: data.totalCount,
    distribution: data.distribution,
    types: data.types,
    aiModel: data.aiModel,
    temperature: data.temperature,
    tokensUsed: data.tokensUsed,
  };

  manifest.files.questions = 'questions.json';
  manifest.files.rawQuestions = 'rawQuestions.json';
  manifest.validation.questionsValidated = true;

  saveEpisodeManifest(seriesSlug, season, episode, manifest);
}

// ============================================
// Season Manifest Functions
// ============================================

export function initSeasonManifest(
  seriesName: string,
  seriesSlug: string,
  seasonNumber: number,
  totalEpisodes: number
): SeasonManifest {
  const now = new Date().toISOString();

  return {
    season: {
      series: seriesName,
      seriesSlug,
      seasonNumber,
      totalEpisodes,
    },
    progress: {
      episodesCompleted: 0,
      episodesInProgress: 0,
      episodesPending: totalEpisodes,
      episodesFailed: 0,
      completionPercentage: 0,
    },
    statistics: {
      totalQuestions: 0,
      totalTranscriptWords: 0,
      averageQuestionsPerEpisode: 0,
      totalTokensUsed: 0,
      estimatedCost: 0,
    },
    episodes: [],
    sources: {
      primary: 'Unknown',
      reliability: 'unknown',
      coverage: 0,
    },
    metadata: {
      createdAt: now,
      updatedAt: now,
      version: '1.0',
    },
  };
}

export function getSeasonManifest(seriesSlug: string, season: number): SeasonManifest | null {
  const path = join(getSeasonPath(seriesSlug, season), 'manifest.json');
  return readManifest<SeasonManifest>(path);
}

export function saveSeasonManifest(seriesSlug: string, season: number, manifest: SeasonManifest): void {
  manifest.metadata.updatedAt = new Date().toISOString();
  const path = join(getSeasonPath(seriesSlug, season), 'manifest.json');
  writeManifest(path, manifest);
}

export function updateSeasonFromEpisodes(seriesSlug: string, season: number): void {
  let manifest = getSeasonManifest(seriesSlug, season);
  if (!manifest) {
    throw new Error('Season manifest not found');
  }

  // Collect all episode manifests
  const episodeManifests: EpisodeManifest[] = [];
  for (let ep = 1; ep <= manifest.season.totalEpisodes; ep++) {
    const episodeManifest = getEpisodeManifest(seriesSlug, season, ep);
    if (episodeManifest) {
      episodeManifests.push(episodeManifest);
    }
  }

  // Calculate progress
  let completed = 0;
  let inProgress = 0;
  let failed = 0;

  episodeManifests.forEach((em) => {
    if (em.transcript.status === 'completed' && em.questions.status === 'completed') {
      completed++;
    } else if (em.transcript.status === 'completed' || em.questions.status === 'completed') {
      inProgress++;
    } else if (em.transcript.status === 'failed' || em.questions.status === 'failed') {
      failed++;
    }
  });

  manifest.progress = {
    episodesCompleted: completed,
    episodesInProgress: inProgress,
    episodesPending: manifest.season.totalEpisodes - completed - inProgress - failed,
    episodesFailed: failed,
    completionPercentage: (completed / manifest.season.totalEpisodes) * 100,
  };

  // Calculate statistics
  let totalQuestions = 0;
  let totalWords = 0;
  let totalTokens = 0;

  episodeManifests.forEach((em) => {
    totalQuestions += em.questions.totalCount || 0;
    totalWords += em.transcript.wordCount || 0;
    totalTokens += em.questions.tokensUsed || 0;
  });

  manifest.statistics = {
    totalQuestions,
    totalTranscriptWords: totalWords,
    averageQuestionsPerEpisode: completed > 0 ? Math.round(totalQuestions / completed) : 0,
    totalTokensUsed: totalTokens,
    estimatedCost: totalTokens * 0.00005, // Rough estimate
  };

  // Update episode list
  manifest.episodes = episodeManifests.map((em) => {
    const status =
      em.transcript.status === 'completed' && em.questions.status === 'completed'
        ? 'completed'
        : em.transcript.status === 'completed'
        ? 'transcript_scraped'
        : 'pending';

    return {
      episode: em.episode.episode,
      title: em.episode.title,
      status,
      questionCount: em.questions.totalCount || 0,
      lastUpdated: em.metadata.updatedAt,
    };
  });

  saveSeasonManifest(seriesSlug, season, manifest);
}

// ============================================
// Series Manifest Functions
// ============================================

export function initSeriesManifest(data: {
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
}): SeriesManifest {
  const now = new Date().toISOString();

  return {
    series: {
      name: data.name,
      slug: data.slug,
      totalSeasons: data.totalSeasons,
      totalEpisodes: data.totalEpisodes,
      genre: data.genre,
      yearStart: data.yearStart,
      yearEnd: data.yearEnd,
      country: data.country,
      language: data.language,
      network: data.network,
      priority: data.priority,
    },
    progress: {
      seasonsCompleted: 0,
      seasonsInProgress: 0,
      seasonsPending: data.totalSeasons,
      episodesCompleted: 0,
      episodesInProgress: 0,
      episodesPending: data.totalEpisodes,
      overallCompletionPercentage: 0,
    },
    statistics: {
      totalQuestions: 0,
      totalTranscriptWords: 0,
      averageQuestionsPerEpisode: 0,
      totalTokensUsed: 0,
      estimatedTotalCost: 0,
      projectedTotalQuestions: data.totalEpisodes * 30,
      projectedTotalCost: data.totalEpisodes * 0.5,
    },
    seasons: [],
    sources: data.sources,
    quality: data.quality,
    metadata: {
      createdAt: now,
      updatedAt: now,
      version: '1.0',
      addedBy: 'system',
      tier: data.tier,
      phase: data.phase,
    },
  };
}

export function getSeriesManifest(seriesSlug: string): SeriesManifest | null {
  const path = join(getSeriesPath(seriesSlug), 'manifest.json');
  return readManifest<SeriesManifest>(path);
}

export function saveSeriesManifest(seriesSlug: string, manifest: SeriesManifest): void {
  manifest.metadata.updatedAt = new Date().toISOString();
  const path = join(getSeriesPath(seriesSlug), 'manifest.json');
  writeManifest(path, manifest);
}

export function updateSeriesFromSeasons(seriesSlug: string): void {
  let manifest = getSeriesManifest(seriesSlug);
  if (!manifest) {
    throw new Error('Series manifest not found');
  }

  // Collect all season manifests
  const seasonManifests: SeasonManifest[] = [];
  for (let s = 1; s <= manifest.series.totalSeasons; s++) {
    const seasonManifest = getSeasonManifest(seriesSlug, s);
    if (seasonManifest) {
      seasonManifests.push(seasonManifest);
    }
  }

  // Calculate progress
  let seasonsCompleted = 0;
  let seasonsInProgress = 0;
  let episodesCompleted = 0;
  let episodesInProgress = 0;

  seasonManifests.forEach((sm) => {
    episodesCompleted += sm.progress.episodesCompleted;
    episodesInProgress += sm.progress.episodesInProgress;

    if (sm.progress.completionPercentage === 100) {
      seasonsCompleted++;
    } else if (sm.progress.episodesCompleted > 0) {
      seasonsInProgress++;
    }
  });

  manifest.progress = {
    seasonsCompleted,
    seasonsInProgress,
    seasonsPending: manifest.series.totalSeasons - seasonsCompleted - seasonsInProgress,
    episodesCompleted,
    episodesInProgress,
    episodesPending: manifest.series.totalEpisodes - episodesCompleted - episodesInProgress,
    overallCompletionPercentage: (episodesCompleted / manifest.series.totalEpisodes) * 100,
  };

  // Calculate statistics
  let totalQuestions = 0;
  let totalWords = 0;
  let totalTokens = 0;

  seasonManifests.forEach((sm) => {
    totalQuestions += sm.statistics.totalQuestions;
    totalWords += sm.statistics.totalTranscriptWords;
    totalTokens += sm.statistics.totalTokensUsed;
  });

  manifest.statistics = {
    totalQuestions,
    totalTranscriptWords: totalWords,
    averageQuestionsPerEpisode: episodesCompleted > 0 ? Math.round(totalQuestions / episodesCompleted) : 0,
    totalTokensUsed: totalTokens,
    estimatedTotalCost: totalTokens * 0.00005,
    projectedTotalQuestions: manifest.series.totalEpisodes * 30,
    projectedTotalCost: manifest.series.totalEpisodes * 0.5,
  };

  // Update season list
  manifest.seasons = seasonManifests.map((sm) => {
    const status =
      sm.progress.completionPercentage === 100
        ? 'completed'
        : sm.progress.episodesCompleted > 0
        ? 'in_progress'
        : 'pending';

    return {
      season: sm.season.seasonNumber,
      totalEpisodes: sm.season.totalEpisodes,
      episodesCompleted: sm.progress.episodesCompleted,
      status,
      questionCount: sm.statistics.totalQuestions,
      completionPercentage: sm.progress.completionPercentage,
      lastUpdated: sm.metadata.updatedAt,
    };
  });

  saveSeriesManifest(seriesSlug, manifest);
}

// ============================================
// Global Manifest Functions
// ============================================

export function initGlobalManifest(): GlobalManifest {
  const now = new Date().toISOString();

  return {
    tvShows: {
      totalSeries: 0,
      seriesCompleted: 0,
      seriesInProgress: 0,
      seriesPending: 0,
      totalEpisodes: 0,
      episodesCompleted: 0,
      completionPercentage: 0,
    },
    statistics: {
      totalQuestions: 0,
      totalTranscriptWords: 0,
      averageQuestionsPerEpisode: 0,
      totalTokensUsed: 0,
      totalCostUSD: 0,
      projectedTotalQuestions: 0,
      projectedTotalCostUSD: 0,
    },
    series: [],
    phases: {},
    sources: {},
    metadata: {
      createdAt: now,
      updatedAt: now,
      version: '1.0',
      schemaVersion: '1.0',
    },
  };
}

export function getGlobalManifest(): GlobalManifest | null {
  const path = join(getDataPath(), 'manifest.json');
  return readManifest<GlobalManifest>(path);
}

export function saveGlobalManifest(manifest: GlobalManifest): void {
  manifest.metadata.updatedAt = new Date().toISOString();
  const path = join(getDataPath(), 'manifest.json');
  writeManifest(path, manifest);
}

export function updateGlobalFromSeries(): void {
  let manifest = getGlobalManifest();
  if (!manifest) {
    manifest = initGlobalManifest();
  }

  // Get all series slugs from filesystem
  const dataPath = getDataPath();
  if (!existsSync(dataPath)) {
    saveGlobalManifest(manifest);
    return;
  }

  const seriesSlugs: string[] = [];
  const entries = Bun.file(dataPath);
  // This is a simplified version - in real implementation, scan directory

  // Collect all series manifests
  const seriesManifests: { slug: string; manifest: SeriesManifest }[] = [];

  // For now, hardcode known series (friends, the-big-bang-theory)
  ['friends', 'the-big-bang-theory'].forEach((slug) => {
    const seriesManifest = getSeriesManifest(slug);
    if (seriesManifest) {
      seriesManifests.push({ slug, manifest: seriesManifest });
    }
  });

  // Calculate global stats
  let totalSeries = seriesManifests.length;
  let seriesCompleted = 0;
  let seriesInProgress = 0;
  let totalEpisodes = 0;
  let episodesCompleted = 0;
  let totalQuestions = 0;
  let totalWords = 0;
  let totalTokens = 0;

  seriesManifests.forEach(({ manifest: sm }) => {
    totalEpisodes += sm.series.totalEpisodes;
    episodesCompleted += sm.progress.episodesCompleted;
    totalQuestions += sm.statistics.totalQuestions;
    totalWords += sm.statistics.totalTranscriptWords;
    totalTokens += sm.statistics.totalTokensUsed;

    if (sm.progress.overallCompletionPercentage === 100) {
      seriesCompleted++;
    } else if (sm.progress.episodesCompleted > 0) {
      seriesInProgress++;
    }
  });

  manifest.tvShows = {
    totalSeries,
    seriesCompleted,
    seriesInProgress,
    seriesPending: totalSeries - seriesCompleted - seriesInProgress,
    totalEpisodes,
    episodesCompleted,
    completionPercentage: totalEpisodes > 0 ? (episodesCompleted / totalEpisodes) * 100 : 0,
  };

  manifest.statistics = {
    totalQuestions,
    totalTranscriptWords: totalWords,
    averageQuestionsPerEpisode: episodesCompleted > 0 ? Math.round(totalQuestions / episodesCompleted) : 0,
    totalTokensUsed: totalTokens,
    totalCostUSD: totalTokens * 0.00005,
    projectedTotalQuestions: totalEpisodes * 30,
    projectedTotalCostUSD: totalEpisodes * 0.5,
  };

  // Update series list
  manifest.series = seriesManifests.map(({ slug, manifest: sm }) => ({
    name: sm.series.name,
    slug: sm.series.slug,
    totalSeasons: sm.series.totalSeasons,
    totalEpisodes: sm.series.totalEpisodes,
    episodesCompleted: sm.progress.episodesCompleted,
    questionsGenerated: sm.statistics.totalQuestions,
    status:
      sm.progress.overallCompletionPercentage === 100
        ? 'completed'
        : sm.progress.episodesCompleted > 0
        ? 'in_progress'
        : 'pending',
    priority: sm.series.priority,
    tier: sm.metadata.tier,
    phase: sm.metadata.phase,
    completionPercentage: sm.progress.overallCompletionPercentage,
    lastUpdated: sm.metadata.updatedAt,
  }));

  saveGlobalManifest(manifest);
}

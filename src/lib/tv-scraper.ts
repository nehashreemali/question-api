/**
 * TV Show Scraper - Functional implementation
 */

import * as cheerio from 'cheerio';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { fetchWithRetry } from './http.js';
import { createLogger } from './logger.js';

const logger = createLogger('tv-scraper');

export interface TVEpisode {
  show: string;
  season: number;
  episode: number;
}

export interface TranscriptResult {
  show: string;
  season: number;
  episode: number;
  title: string;
  transcript: string;
  source: string;
  sourceUrl: string;
  scrapedAt: string;
  wordCount: number;
  hasCharacterNames: boolean;
}

/**
 * Scrape from fangj.github.io/friends
 */
async function scrapeFriendsTranscript(episode: TVEpisode): Promise<TranscriptResult | null> {
  const { show, season, episode: ep } = episode;

  // Only works for Friends
  if (show.toLowerCase() !== 'friends') {
    return null;
  }

  const episodeCode = `${season.toString().padStart(2, '0')}${ep.toString().padStart(2, '0')}`;
  const url = `https://fangj.github.io/friends/season/${episodeCode}.html`;

  logger.info(`Trying Friends Transcripts: ${url}`);

  try {
    const html = await fetchWithRetry(url);
    const $ = cheerio.load(html);

    const title = $('title').text().trim() || `Friends Season ${season} Episode ${ep}`;
    const content = $('body').text();

    // Clean up the transcript
    const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const transcript = lines.join('\n');

    return {
      show,
      season,
      episode: ep,
      title,
      transcript,
      source: 'Friends Transcripts (fangj.github.io)',
      sourceUrl: url,
      scrapedAt: new Date().toISOString(),
      wordCount: transcript.split(/\s+/).length,
      hasCharacterNames: true,
    };
  } catch (error: any) {
    logger.warn(`Friends Transcripts failed: ${error.message}`);
    return null;
  }
}

/**
 * Scrape from Subslikescript
 */
async function scrapeSubslikescript(episode: TVEpisode): Promise<TranscriptResult | null> {
  const { show, season, episode: ep } = episode;

  // Format show name for URL
  const showSlug = show
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_');

  const url = `https://subslikescript.com/series/${showSlug}/season-${season}/episode-${ep}`;

  logger.info(`Trying Subslikescript: ${url}`);

  try {
    const html = await fetchWithRetry(url);
    const $ = cheerio.load(html);

    const title = $('h1').first().text().trim() || `${show} Season ${season} Episode ${ep}`;
    const transcript = $('.full-script').text().trim();

    if (!transcript || transcript.length < 100) {
      throw new Error('No transcript content found');
    }

    return {
      show,
      season,
      episode: ep,
      title,
      transcript,
      source: 'Subslikescript',
      sourceUrl: url,
      scrapedAt: new Date().toISOString(),
      wordCount: transcript.split(/\s+/).length,
      hasCharacterNames: false,
    };
  } catch (error: any) {
    logger.warn(`Subslikescript failed: ${error.message}`);
    return null;
  }
}

/**
 * Scrape TV episode transcript from multiple sources
 */
export async function scrapeEpisode(episode: TVEpisode): Promise<TranscriptResult> {
  const { show, season, episode: ep } = episode;

  logger.info(`Scraping ${show} S${season.toString().padStart(2, '0')}E${ep.toString().padStart(2, '0')}`);

  // Try sources in priority order
  const scrapers = [
    scrapeFriendsTranscript,
    scrapeSubslikescript,
  ];

  for (const scraper of scrapers) {
    const result = await scraper(episode);
    if (result) {
      logger.success(`Successfully scraped from ${result.source}`);
      return result;
    }
  }

  throw new Error(`Failed to scrape transcript for ${show} S${season}E${ep} from all sources`);
}

/**
 * Save transcript to file system (new structure)
 */
export function saveTranscript(result: TranscriptResult): string {
  const { show, season, episode } = result;

  const showDir = show.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
  const episodeDir = join(
    process.cwd(),
    'data',
    'tv-shows',
    showDir,
    `season-${season}`,
    `episode-${episode}`
  );

  if (!existsSync(episodeDir)) {
    mkdirSync(episodeDir, { recursive: true });
  }

  const filepath = join(episodeDir, 'transcript.json');
  writeFileSync(filepath, JSON.stringify(result, null, 2));
  logger.success(`Saved transcript: ${filepath}`);

  return filepath;
}

/**
 * Main workflow: Scrape and save
 */
export async function scrapeAndSave(episode: TVEpisode): Promise<TranscriptResult> {
  const result = await scrapeEpisode(episode);
  saveTranscript(result);
  return result;
}

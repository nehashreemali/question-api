/**
 * TV Show Scraper - Functional implementation
 */

import * as cheerio from 'cheerio';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
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
 * Springfield! Springfield! show slug mapping
 */
const SPRINGFIELD_SLUGS: Record<string, string> = {
  'the-office-us': 'the-office-us',
  'the-office': 'the-office-us',
  'the-big-bang-theory': 'big-bang-theory',
  'seinfeld': 'seinfeld',
  'parks-and-recreation': 'parks-and-recreation',
  'brooklyn-nine-nine': 'brooklyn-nine-nine',
  'how-i-met-your-mother': 'how-i-met-your-mother',
  'friends': 'friends',
  'community': 'community',
  'modern-family': 'modern-family',
  'arrested-development': 'arrested-development',
  'scrubs': 'scrubs',
  'frasier': 'frasier',
  '30-rock': '30-rock',
  'new-girl': 'new-girl',
  'the-good-place': 'the-good-place',
  'schitts-creek': 'schitts-creek',
  'curb-your-enthusiasm': 'curb-your-enthusiasm',
};

/**
 * Scrape from Springfield! Springfield!
 */
async function scrapeSpringfield(episode: TVEpisode): Promise<TranscriptResult | null> {
  const { show, season, episode: ep } = episode;

  // Get the Springfield slug for this show
  const showSlug = show.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
  const springfieldSlug = SPRINGFIELD_SLUGS[showSlug] || showSlug;

  const episodeCode = `s${season.toString().padStart(2, '0')}e${ep.toString().padStart(2, '0')}`;
  const url = `https://www.springfieldspringfield.co.uk/view_episode_scripts.php?tv-show=${springfieldSlug}&episode=${episodeCode}`;

  logger.info(`Trying Springfield: ${url}`);

  try {
    const html = await fetchWithRetry(url);
    const $ = cheerio.load(html);

    // Get episode title from the page
    const breadcrumb = $('.breadcrumb-item').last().text().trim();
    const title = breadcrumb || `${show} S${season}E${ep}`;

    // Get transcript from the scrolling container
    const transcript = $('.scrolling-script-container').text().trim();

    if (!transcript || transcript.length < 100) {
      throw new Error('No transcript content found');
    }

    return {
      show,
      season,
      episode: ep,
      title,
      transcript,
      source: 'Springfield! Springfield!',
      sourceUrl: url,
      scrapedAt: new Date().toISOString(),
      wordCount: transcript.split(/\s+/).length,
      hasCharacterNames: false,
    };
  } catch (error: any) {
    logger.warn(`Springfield failed: ${error.message}`);
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
    scrapeSpringfield,
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
 * Get transcript file path (new flat structure)
 */
export function getTranscriptPath(show: string, season: number, episode: number): string {
  const showSlug = show.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
  const filename = `s${season.toString().padStart(2, '0')}e${episode.toString().padStart(2, '0')}.json`;
  return join(process.cwd(), 'generation', 'transcripts', showSlug, filename);
}

/**
 * Check if transcript exists
 */
export function transcriptExists(show: string, season: number, episode: number): boolean {
  return existsSync(getTranscriptPath(show, season, episode));
}

/**
 * Load existing transcript
 */
export function loadTranscript(show: string, season: number, episode: number): TranscriptResult | null {
  const filepath = getTranscriptPath(show, season, episode);
  if (!existsSync(filepath)) {
    return null;
  }
  try {
    const content = readFileSync(filepath, 'utf8');
    return JSON.parse(content) as TranscriptResult;
  } catch {
    return null;
  }
}

/**
 * Save transcript to file system (flat structure)
 * Path: data/transcripts/{show-slug}/s{nn}e{nn}.json
 */
export function saveTranscript(result: TranscriptResult): string {
  const { show, season, episode } = result;

  const showSlug = show.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
  const showDir = join(process.cwd(), 'generation', 'transcripts', showSlug);

  if (!existsSync(showDir)) {
    mkdirSync(showDir, { recursive: true });
  }

  const filename = `s${season.toString().padStart(2, '0')}e${episode.toString().padStart(2, '0')}.json`;
  const filepath = join(showDir, filename);
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

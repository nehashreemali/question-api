/**
 * TV Show Adapter
 *
 * Fetches content for TV shows from cached transcripts.
 * Falls back to Wikipedia if no transcripts are available.
 */

import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import type { ContentAdapter, ContentResult, FetchOptions, Citation } from './types';

const DATA_PATH = join(process.cwd(), 'data', 'tv-shows');

export class TVAdapter implements ContentAdapter {
  name = 'tv-adapter';

  canHandle(options: FetchOptions): boolean {
    return options.category === 'tv-shows';
  }

  async fetch(options: FetchOptions): Promise<ContentResult> {
    const { topic, season, episode } = options;
    const showName = this.slugToShowName(topic);

    // If specific season/episode provided, load just that transcript
    if (season && episode) {
      const singleEpisode = this.loadSingleEpisodeTranscript(topic, showName, season, episode);
      if (singleEpisode) {
        return singleEpisode;
      }
      throw new Error(`No transcript found for ${showName} S${season}E${episode}. Please scrape the transcript first.`);
    }

    // Otherwise, try to load all cached transcripts
    const cachedContent = this.loadCachedTranscripts(topic, showName);
    if (cachedContent) {
      return cachedContent;
    }

    // Fall back to Wikipedia
    return this.fetchFromWikipedia(showName, topic);
  }

  private loadSingleEpisodeTranscript(slug: string, showName: string, season: number, episode: number): ContentResult | null {
    const transcriptPath = join(DATA_PATH, slug, `season-${season}`, `episode-${episode}`, 'transcript.json');

    if (!existsSync(transcriptPath)) {
      return null;
    }

    try {
      const data = JSON.parse(readFileSync(transcriptPath, 'utf8'));
      const transcript = data.transcript || data.formattedTranscript || '';
      const title = data.title || `Season ${season} Episode ${episode}`;

      return {
        title: `${showName}: ${title}`,
        content: `# ${showName} - ${title}\n\n*Season ${season}, Episode ${episode}*\n\n${transcript}`,
        source: data.source || 'Transcript',
        sourceUrl: data.sourceUrl || '',
        fetchedAt: new Date().toISOString(),
        citations: [{
          text: `S${season}E${episode}: ${title}`,
          source: data.source || 'Transcript',
          url: data.sourceUrl,
        }],
        metadata: {
          category: 'tv-shows',
          topic: slug,
          season,
          episode,
          wordCount: transcript.split(/\s+/).length,
        },
      };
    } catch (e) {
      return null;
    }
  }

  private loadCachedTranscripts(slug: string, showName: string): ContentResult | null {
    const showPath = join(DATA_PATH, slug);

    if (!existsSync(showPath)) {
      return null;
    }

    const transcripts: string[] = [];
    const citations: Citation[] = [];
    let totalEpisodes = 0;

    // Find all season directories
    const entries = readdirSync(showPath, { withFileTypes: true });
    const seasonDirs = entries
      .filter(e => e.isDirectory() && e.name.startsWith('season-'))
      .sort((a, b) => {
        const aNum = parseInt(a.name.replace('season-', ''));
        const bNum = parseInt(b.name.replace('season-', ''));
        return aNum - bNum;
      });

    for (const seasonDir of seasonDirs) {
      const seasonPath = join(showPath, seasonDir.name);
      const seasonNum = seasonDir.name.replace('season-', '');

      // Find all episode directories
      const episodeEntries = readdirSync(seasonPath, { withFileTypes: true });
      const episodeDirs = episodeEntries
        .filter(e => e.isDirectory() && e.name.startsWith('episode-'))
        .sort((a, b) => {
          const aNum = parseInt(a.name.replace('episode-', ''));
          const bNum = parseInt(b.name.replace('episode-', ''));
          return aNum - bNum;
        });

      for (const episodeDir of episodeDirs) {
        const transcriptPath = join(seasonPath, episodeDir.name, 'transcript.json');

        if (existsSync(transcriptPath)) {
          try {
            const data = JSON.parse(readFileSync(transcriptPath, 'utf8'));
            const episodeNum = episodeDir.name.replace('episode-', '');

            // Add transcript content (truncate very long ones)
            const transcript = data.transcript || data.formattedTranscript || '';
            const truncated = transcript.substring(0, 15000); // ~15k chars per episode

            transcripts.push(`\n## Season ${seasonNum}, Episode ${episodeNum}: ${data.title || 'Unknown'}\n\n${truncated}`);
            totalEpisodes++;

            citations.push({
              text: `S${seasonNum}E${episodeNum}: ${data.title || 'Unknown'}`,
              source: data.source || 'Transcript',
              url: data.sourceUrl,
            });
          } catch (e) {
            // Skip invalid transcripts
          }
        }
      }
    }

    if (transcripts.length === 0) {
      return null;
    }

    // Combine transcripts (limit total size for AI context)
    let combinedContent = `# ${showName} - Episode Transcripts\n\n`;
    combinedContent += `*${totalEpisodes} episodes loaded*\n\n`;

    // Add transcripts up to ~100k chars total
    let currentSize = combinedContent.length;
    const maxSize = 100000;

    for (const transcript of transcripts) {
      if (currentSize + transcript.length > maxSize) {
        break;
      }
      combinedContent += transcript + '\n\n---\n';
      currentSize += transcript.length;
    }

    return {
      title: showName,
      content: combinedContent,
      source: 'Cached Transcripts',
      sourceUrl: '',
      fetchedAt: new Date().toISOString(),
      citations: citations.slice(0, 20), // Limit citations
      metadata: {
        category: 'tv-shows',
        topic: slug,
        episodeCount: totalEpisodes,
      },
    };
  }

  private async fetchFromWikipedia(showName: string, slug: string): Promise<ContentResult> {
    const citations: Citation[] = [];
    let content = '';
    let sourceUrl = '';

    // Try different Wikipedia article title formats
    const searchTerms = [
      `${showName} (TV series)`,
      `${showName} (American TV series)`,
      showName,
    ];

    for (const term of searchTerms) {
      try {
        const encoded = encodeURIComponent(term);
        const response = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`
        );

        if (response.ok) {
          const data = await response.json() as any;
          if (data.extract && data.extract.length > 100) {
            content = `# ${data.title}\n\n${data.extract}\n\n`;
            sourceUrl = data.content_urls?.desktop?.page || '';
            citations.push({ text: data.title, source: 'Wikipedia', url: sourceUrl });
            break;
          }
        }
      } catch (e) {
        continue;
      }
    }

    if (!content) {
      throw new Error(`No transcripts found for "${showName}" and Wikipedia lookup failed. Please scrape transcripts first.`);
    }

    return {
      title: showName,
      content,
      source: 'Wikipedia',
      sourceUrl,
      fetchedAt: new Date().toISOString(),
      citations,
      metadata: { category: 'tv-shows', topic: slug },
    };
  }

  private slugToShowName(slug: string): string {
    // Map of slug -> proper show name
    const showNames: Record<string, string> = {
      'friends': 'Friends',
      'the-office-us': 'The Office',
      'the-big-bang-theory': 'The Big Bang Theory',
      'how-i-met-your-mother': 'How I Met Your Mother',
      'seinfeld': 'Seinfeld',
      'brooklyn-nine-nine': 'Brooklyn Nine-Nine',
      'parks-and-recreation': 'Parks and Recreation',
      'modern-family': 'Modern Family',
      'schitts-creek': "Schitt's Creek",
      'arrested-development': 'Arrested Development',
      'the-good-place': 'The Good Place',
      'breaking-bad': 'Breaking Bad',
      'game-of-thrones': 'Game of Thrones',
      'the-sopranos': 'The Sopranos',
      'stranger-things': 'Stranger Things',
      'the-mandalorian': 'The Mandalorian',
      'the-simpsons': 'The Simpsons',
      'south-park': 'South Park',
      'family-guy': 'Family Guy',
      'the-wire': 'The Wire',
      'lost': 'Lost',
      'house-md': 'House',
      'greys-anatomy': "Grey's Anatomy",
      'the-walking-dead': 'The Walking Dead',
      'better-call-saul': 'Better Call Saul',
      'succession': 'Succession',
      'the-crown': 'The Crown',
      'ted-lasso': 'Ted Lasso',
      'severance': 'Severance',
      'the-bear': 'The Bear',
    };

    return showNames[slug] || slug.split('-').map(w =>
      w.charAt(0).toUpperCase() + w.slice(1)
    ).join(' ');
  }
}

export default TVAdapter;

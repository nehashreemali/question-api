/**
 * Movies Adapter
 *
 * Fetches movie content from Wikipedia.
 * Handles movie franchises, studios, and genre-based content.
 */

import axios from 'axios';
import type { ContentAdapter, ContentResult, FetchOptions, Citation } from './types';
import { createLogger } from '../logger';

const logger = createLogger('movies-adapter');

const WIKI_API = 'https://en.wikipedia.org/api/rest_v1';

// Movie topic to Wikipedia article mapping
const MOVIE_MAPPINGS: Record<string, string[]> = {
  // Franchises
  'marvel-mcu': ['Marvel Cinematic Universe', 'List of Marvel Cinematic Universe films', 'Avengers (film series)'],
  'dc-extended-universe': ['DC Extended Universe', 'List of DC Extended Universe films', 'Justice League (film)'],
  'star-wars': ['Star Wars', 'Star Wars sequel trilogy', 'Star Wars prequel trilogy'],
  'harry-potter': ['Harry Potter (film series)', 'Wizarding World', 'Fantastic Beasts (film series)'],
  'lord-of-the-rings': ['The Lord of the Rings (film series)', 'The Hobbit (film series)', 'Middle-earth in film'],
  'fast-and-furious': ['Fast & Furious', 'List of Fast & Furious films'],
  'james-bond': ['James Bond (literary character)', 'James Bond in film', 'List of James Bond films'],
  'jurassic-park': ['Jurassic Park (franchise)', 'Jurassic World', 'List of Jurassic Park films'],
  'mission-impossible': ['Mission: Impossible (film series)', 'List of Mission: Impossible films'],
  'pirates-of-the-caribbean': ['Pirates of the Caribbean (film series)', 'Jack Sparrow'],
  'the-matrix': ['The Matrix (franchise)', 'The Matrix', 'The Matrix Resurrections'],
  'indiana-jones': ['Indiana Jones (franchise)', 'Indiana Jones', 'List of Indiana Jones films'],

  // Studios
  'pixar': ['Pixar', 'List of Pixar films', 'Toy Story (franchise)'],
  'disney-animation': ['Walt Disney Animation Studios', 'List of Walt Disney Animation Studios films'],
  'studio-ghibli': ['Studio Ghibli', 'List of Studio Ghibli works', 'Hayao Miyazaki'],
  'dreamworks': ['DreamWorks Animation', 'List of DreamWorks Animation productions'],

  // Genres
  'oscar-winners': ['Academy Award for Best Picture', 'List of Academy Award-winning films'],
  'classic-hollywood': ['Classical Hollywood cinema', 'Golden Age of Hollywood'],
  '80s-classics': ['1980s in film', 'List of American films of the 1980s'],
  '90s-classics': ['1990s in film', 'List of American films of the 1990s'],
  'horror-classics': ['Horror film', 'List of horror films'],
  'animated-movies': ['Animated film', 'History of animation'],
};

export class MoviesAdapter implements ContentAdapter {
  name = 'movies-adapter';

  canHandle(options: FetchOptions): boolean {
    return options.category === 'movies';
  }

  async fetch(options: FetchOptions): Promise<ContentResult> {
    const { topic, subcategory } = options;

    logger.info(`Fetching movies content for: ${topic}`);

    const articles = this.getArticlesForTopic(topic);
    const citations: Citation[] = [];
    const contents: string[] = [];

    for (const article of articles) {
      try {
        const result = await this.fetchArticle(article);
        if (result) {
          contents.push(`## ${article}\n\n${result.content}`);
          citations.push({
            text: article,
            source: 'Wikipedia',
            url: result.url,
          });
        }
      } catch (error: any) {
        logger.warn(`Failed to fetch article "${article}": ${error.message}`);
      }
    }

    if (contents.length === 0) {
      throw new Error(`No movie content found for topic: ${topic}`);
    }

    const topicName = this.formatTopicName(topic);

    return {
      title: topicName,
      content: contents.join('\n\n---\n\n'),
      source: 'Wikipedia (Movies)',
      sourceUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(articles[0])}`,
      fetchedAt: new Date().toISOString(),
      citations,
      metadata: {
        category: 'movies',
        subcategory,
        topic,
        articleCount: contents.length,
      },
    };
  }

  private getArticlesForTopic(topic: string): string[] {
    const mapped = MOVIE_MAPPINGS[topic];

    if (mapped) {
      return mapped;
    }

    // Fallback: convert slug to article name
    const articleName = topic
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    return [articleName];
  }

  private async fetchArticle(title: string): Promise<{ content: string; url: string } | null> {
    const url = `${WIKI_API}/page/summary/${encodeURIComponent(title)}`;

    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'QuizGenerator/1.0 (educational project)',
        },
      });

      const data = response.data;
      let content = data.extract || '';

      // Get more content from sections
      try {
        const sectionsUrl = `${WIKI_API}/page/mobile-sections/${encodeURIComponent(title)}`;
        const sectionsResponse = await axios.get(sectionsUrl, {
          timeout: 15000,
          headers: {
            'User-Agent': 'QuizGenerator/1.0 (educational project)',
          },
        });

        const sections = sectionsResponse.data.remaining?.sections || [];
        for (const section of sections.slice(0, 5)) {
          if (section.text) {
            const text = section.text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            if (text.length > 100) {
              content += `\n\n### ${section.line}\n${text}`;
            }
          }
        }
      } catch {
        // Ignore sections fetch failure
      }

      return {
        content,
        url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        logger.warn(`Wikipedia article not found: ${title}`);
        return null;
      }
      throw error;
    }
  }

  private formatTopicName(slug: string): string {
    return slug
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
}

export default MoviesAdapter;

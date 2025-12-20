/**
 * Sports Adapter
 *
 * Fetches sports content from Wikipedia and other sources.
 * Includes "as of" dates for time-sensitive statistics.
 *
 * Can be extended to use specialized APIs:
 * - ESPNcricinfo for cricket
 * - ESPN for football, NBA, etc.
 * - Cagematch for WWE/wrestling
 */

import axios from 'axios';
import type { ContentAdapter, ContentResult, FetchOptions, Citation } from './types';
import { createLogger } from '../logger';

const logger = createLogger('sports-adapter');

const WIKI_API = 'https://en.wikipedia.org/api/rest_v1';

// Sports topic to Wikipedia article mapping
const SPORTS_MAPPINGS: Record<string, string[]> = {
  // Cricket
  'cricket-world-cups': ['Cricket World Cup', 'ICC Cricket World Cup', 'List of Cricket World Cup finals'],
  'ipl': ['Indian Premier League', 'List of Indian Premier League seasons', 'IPL records'],
  'test-cricket': ['Test cricket', 'List of Test cricket records', 'Test cricket statistics'],
  'odi-cricket': ['One Day International', 'ODI cricket records'],
  't20-cricket': ['Twenty20', 'T20 cricket records', 'ICC T20 World Cup'],
  'cricket-legends': ['Sachin Tendulkar', 'Virat Kohli', 'MS Dhoni', 'Kapil Dev', 'Sunil Gavaskar'],
  'ashes': ['The Ashes', 'History of The Ashes', 'List of The Ashes series'],

  // Football (Soccer)
  'fifa-world-cup': ['FIFA World Cup', 'List of FIFA World Cup finals', 'FIFA World Cup records'],
  'premier-league': ['Premier League', 'List of Premier League seasons', 'Premier League records'],
  'champions-league': ['UEFA Champions League', 'List of European Cup and UEFA Champions League finals'],
  'la-liga': ['La Liga', 'List of La Liga seasons'],
  'football-legends': ['Lionel Messi', 'Cristiano Ronaldo', 'Diego Maradona', 'Pelé'],
  'euros': ['UEFA European Championship', 'List of UEFA European Championship finals'],

  // American Sports
  'nfl': ['National Football League', 'NFL records', 'Super Bowl'],
  'nba': ['National Basketball Association', 'List of NBA champions', 'NBA records'],
  'super-bowl': ['Super Bowl', 'List of Super Bowl champions', 'Super Bowl records'],

  // Tennis
  'grand-slams': ['Grand Slam (tennis)', 'List of Grand Slam men\'s singles champions', 'List of Grand Slam women\'s singles champions'],
  'tennis-legends': ['Roger Federer', 'Rafael Nadal', 'Novak Djokovic', 'Serena Williams'],
  'wimbledon': ['The Championships, Wimbledon', 'List of Wimbledon gentlemen\'s singles champions'],

  // Olympics
  'summer-olympics': ['Summer Olympic Games', 'List of Summer Olympic Games', 'Olympic records'],
  'winter-olympics': ['Winter Olympic Games', 'List of Winter Olympic Games'],
  'olympic-records': ['List of Olympic records in athletics', 'World record progression'],
  'olympic-legends': ['Usain Bolt', 'Michael Phelps', 'Carl Lewis', 'Nadia Comăneci'],

  // WWE / Combat Sports
  'wwe': ['WWE', 'History of WWE', 'List of WWE Champions'],
  'wwe-wrestlemania': ['WrestleMania', 'List of WrestleMania main events', 'WrestleMania records'],
  'wwe-royal-rumble': ['Royal Rumble', 'List of Royal Rumble winners', 'Royal Rumble match'],
  'boxing': ['Boxing', 'List of world heavyweight boxing champions', 'Muhammad Ali'],
  'ufc-mma': ['Ultimate Fighting Championship', 'Mixed martial arts', 'List of UFC champions'],

  // Motorsport
  'formula-1': ['Formula One', 'List of Formula One World Drivers\' Champions', 'Formula One records'],
  'motogp': ['MotoGP', 'List of MotoGP World Champions'],

  // Other Sports
  'golf': ['Golf', 'Masters Tournament', 'List of men\'s major championships winning golfers'],
  'athletics': ['Athletics (sport)', 'World record progression', 'IAAF World Championships'],
  'swimming': ['Swimming (sport)', 'List of world records in swimming', 'World Aquatics Championships'],
  'badminton': ['Badminton', 'BWF World Championships', 'All England Open Badminton Championships'],
};

export class SportsAdapter implements ContentAdapter {
  name = 'sports-adapter';

  canHandle(options: FetchOptions): boolean {
    return options.category === 'sports';
  }

  async fetch(options: FetchOptions): Promise<ContentResult> {
    const { topic, subcategory } = options;

    logger.info(`Fetching sports content for: ${topic}`);

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
      throw new Error(`No sports content found for topic: ${topic}`);
    }

    const topicName = this.formatTopicName(topic);
    const asOfDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    return {
      title: topicName,
      content: contents.join('\n\n---\n\n'),
      source: 'Wikipedia (Sports)',
      sourceUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(articles[0])}`,
      fetchedAt: new Date().toISOString(),
      citations,
      // Important: Include as-of date for time-sensitive sports data
      asOfDate,
      metadata: {
        category: 'sports',
        subcategory,
        topic,
        articleCount: contents.length,
        warning: 'Sports statistics and records may change. Data accurate as of fetch date.',
      },
    };
  }

  private getArticlesForTopic(topic: string): string[] {
    const mapped = SPORTS_MAPPINGS[topic];

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

      // Also try to get more content from sections
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

export default SportsAdapter;

/**
 * Wikipedia Adapter
 *
 * Fetches content from Wikipedia API for knowledge-based topics.
 * Used for science, history, geography, and general knowledge content.
 */

import axios from 'axios';
import type { ContentAdapter, ContentResult, FetchOptions, Citation } from './types';
import { createLogger } from '../logger';

const logger = createLogger('wikipedia-adapter');

// Wikipedia API endpoint
const WIKI_API = 'https://en.wikipedia.org/api/rest_v1';

// Topic to Wikipedia article mapping
const TOPIC_MAPPINGS: Record<string, string | string[]> = {
  // Science - Physics
  'mechanics': ['Classical mechanics', 'Newton\'s laws of motion', 'Kinematics'],
  'thermodynamics': ['Thermodynamics', 'Laws of thermodynamics', 'Heat transfer'],
  'electromagnetism': ['Electromagnetism', 'Maxwell\'s equations', 'Electromagnetic field'],
  'optics': ['Optics', 'Light', 'Reflection (physics)'],
  'quantum-physics': ['Quantum mechanics', 'Wave–particle duality', 'Heisenberg uncertainty principle'],
  'nuclear-physics': ['Nuclear physics', 'Nuclear fission', 'Nuclear fusion'],
  'relativity': ['Theory of relativity', 'Special relativity', 'General relativity'],

  // Science - Chemistry
  'organic-chemistry': ['Organic chemistry', 'Organic compound', 'Carbon'],
  'inorganic-chemistry': ['Inorganic chemistry', 'Inorganic compound', 'Coordination complex'],
  'periodic-table': ['Periodic table', 'Chemical element', 'Atomic number'],
  'chemical-reactions': ['Chemical reaction', 'Stoichiometry', 'Chemical equation'],

  // Science - Biology
  'genetics': ['Genetics', 'DNA', 'Gene', 'Heredity'],
  'cell-biology': ['Cell biology', 'Cell (biology)', 'Organelle'],
  'evolution': ['Evolution', 'Natural selection', 'Charles Darwin'],
  'human-anatomy': ['Human anatomy', 'Human body', 'Organ (anatomy)'],

  // Science - Astronomy
  'solar-system': ['Solar System', 'Planet', 'Sun'],
  'stars-and-galaxies': ['Star', 'Galaxy', 'Milky Way'],
  'black-holes': ['Black hole', 'Event horizon', 'Hawking radiation'],
  'space-exploration': ['Space exploration', 'NASA', 'SpaceX'],

  // History
  'ancient-egypt': ['Ancient Egypt', 'Pharaoh', 'Pyramids of Giza'],
  'ancient-greece': ['Ancient Greece', 'Greek mythology', 'Athens'],
  'roman-empire': ['Roman Empire', 'Julius Caesar', 'Roman Republic'],
  'ancient-india': ['History of India', 'Indus Valley Civilisation', 'Maurya Empire'],
  'world-war-1': ['World War I', 'Trench warfare', 'Treaty of Versailles'],
  'world-war-2': ['World War II', 'Adolf Hitler', 'D-Day'],
  'cold-war': ['Cold War', 'Soviet Union', 'Cuban Missile Crisis'],
  'indian-freedom-movement': ['Indian independence movement', 'Mahatma Gandhi', 'Quit India movement'],

  // Geography
  'countries-and-capitals': ['List of national capitals', 'Country', 'Capital city'],
  'mountains': ['Mountain', 'Mount Everest', 'Himalayas'],
  'rivers-and-lakes': ['River', 'Lake', 'Amazon River', 'Ganges'],
  'oceans-and-seas': ['Ocean', 'Sea', 'Pacific Ocean'],

  // Indian Epics
  'mahabharata': ['Mahabharata', 'Bhagavad Gita', 'Kurukshetra War', 'Pandava'],
  'ramayana': ['Ramayana', 'Rama', 'Sita', 'Hanuman'],
  'bhagavad-gita': ['Bhagavad Gita', 'Krishna', 'Arjuna'],
  'vedas': ['Vedas', 'Rigveda', 'Upanishads'],
  'upanishads': ['Upanishads', 'Brahman', 'Atman (Hinduism)'],
  'puranas': ['Puranas', 'Vishnu Purana', 'Shiva Purana'],
  'panchatantra': ['Panchatantra', 'Fables'],
  'jataka-tales': ['Jataka tales', 'Gautama Buddha'],

  // Technology
  'artificial-intelligence': ['Artificial intelligence', 'Machine learning', 'Deep learning'],
  'computer-history': ['History of computing', 'Computer', 'ENIAC'],
  'internet-history': ['History of the Internet', 'World Wide Web', 'ARPANET'],

  // Entertainment
  'oscar-awards': ['Academy Awards', 'Academy Award for Best Picture'],
  'grammy-awards': ['Grammy Awards', 'Grammy Award for Album of the Year'],
  'classical-music': ['Classical music', 'Ludwig van Beethoven', 'Wolfgang Amadeus Mozart'],
  'shakespeare': ['William Shakespeare', 'Hamlet', 'Romeo and Juliet'],
};

export class WikipediaAdapter implements ContentAdapter {
  name = 'wikipedia-adapter';

  private knowledgeCategories = [
    'science', 'mathematics', 'history', 'geography',
    'entertainment', 'technology', 'general-knowledge'
  ];

  canHandle(options: FetchOptions): boolean {
    return this.knowledgeCategories.includes(options.category);
  }

  async fetch(options: FetchOptions): Promise<ContentResult> {
    const { topic, category, subcategory } = options;

    logger.info(`Fetching Wikipedia content for: ${topic}`);

    // Get article titles for this topic
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
      throw new Error(`No Wikipedia content found for topic: ${topic}`);
    }

    const topicName = this.formatTopicName(topic);

    return {
      title: topicName,
      content: contents.join('\n\n---\n\n'),
      source: 'Wikipedia',
      sourceUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(articles[0])}`,
      fetchedAt: new Date().toISOString(),
      citations,
      metadata: {
        category,
        subcategory,
        topic,
        articleCount: contents.length,
      },
    };
  }

  private getArticlesForTopic(topic: string): string[] {
    const mapped = TOPIC_MAPPINGS[topic];

    if (mapped) {
      return Array.isArray(mapped) ? mapped : [mapped];
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

      // Get extract (summary) and optionally the full content
      let content = data.extract || '';

      // Also try to get more content from the mobile-sections endpoint
      try {
        const sectionsUrl = `${WIKI_API}/page/mobile-sections/${encodeURIComponent(title)}`;
        const sectionsResponse = await axios.get(sectionsUrl, {
          timeout: 15000,
          headers: {
            'User-Agent': 'QuizGenerator/1.0 (educational project)',
          },
        });

        const sections = sectionsResponse.data.remaining?.sections || [];
        for (const section of sections.slice(0, 5)) { // First 5 sections
          if (section.text) {
            // Strip HTML tags
            const text = section.text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            if (text.length > 100) {
              content += `\n\n### ${section.line}\n${text}`;
            }
          }
        }
      } catch {
        // Ignore sections fetch failure, we have the summary
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

export default WikipediaAdapter;

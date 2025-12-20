/**
 * Adapter Registry
 *
 * Central registry for all content adapters.
 * Provides a unified interface to fetch content from any source.
 */

import type { ContentAdapter, ContentResult, FetchOptions } from './types';
import { TVAdapter } from './tv-adapter';
import { WikipediaAdapter } from './wikipedia-adapter';
import { SportsAdapter } from './sports-adapter';
import { MoviesAdapter } from './movies-adapter';
import { NCERTAdapter } from './ncert-adapter';
import { createLogger } from '../logger';

const logger = createLogger('adapter-registry');

// Register all adapters
const adapters: ContentAdapter[] = [
  // Media adapters
  new TVAdapter(),
  new MoviesAdapter(),

  // Educational adapters (curriculum-aligned)
  new NCERTAdapter(),

  // Knowledge adapters (Wikipedia-based)
  new WikipediaAdapter(),

  // Sports adapters
  new SportsAdapter(),
];

/**
 * Find an adapter that can handle the given options
 */
export function getAdapter(options: FetchOptions): ContentAdapter | undefined {
  return adapters.find(adapter => adapter.canHandle(options));
}

/**
 * Fetch content using the appropriate adapter
 */
export async function fetchContent(options: FetchOptions): Promise<ContentResult> {
  const adapter = getAdapter(options);

  if (!adapter) {
    throw new Error(
      `No adapter found for category: ${options.category}, topic: ${options.topic}`
    );
  }

  logger.info(`Using ${adapter.name} for ${options.category}/${options.topic}`);

  return adapter.fetch(options);
}

/**
 * List all available adapters and their supported categories
 */
export function listAdapters(): { name: string; categories: string[] }[] {
  return [
    { name: 'tv-adapter', categories: ['tv-shows'] },
    { name: 'movies-adapter', categories: ['movies'] },
    { name: 'ncert-adapter', categories: ['science', 'mathematics'] },
    { name: 'wikipedia-adapter', categories: ['science', 'mathematics', 'history', 'geography', 'entertainment', 'technology', 'general-knowledge'] },
    { name: 'sports-adapter', categories: ['sports'] },
  ];
}

// Re-export types and classes
export type { ContentAdapter, ContentResult, FetchOptions, Citation } from './types';
export { TVAdapter } from './tv-adapter';
export { WikipediaAdapter } from './wikipedia-adapter';
export { SportsAdapter } from './sports-adapter';
export { MoviesAdapter } from './movies-adapter';
export { NCERTAdapter } from './ncert-adapter';

export default { getAdapter, fetchContent, listAdapters };

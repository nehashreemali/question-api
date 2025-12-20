/**
 * Adapter Types
 *
 * Type definitions for content adapters.
 */

export interface Citation {
  text: string;
  source: string;
  url?: string;
}

export interface ContentResult {
  title: string;
  content: string;
  source: string;
  sourceUrl: string;
  fetchedAt: string;
  metadata?: Record<string, any>;
  citations?: Citation[];
  asOfDate?: string;
}

export interface FetchOptions {
  category: string;
  subcategory?: string;
  topic: string;
  season?: number;
  episode?: number;
}

export interface ContentAdapter {
  name: string;
  canHandle(options: FetchOptions): boolean;
  fetch(options: FetchOptions): Promise<ContentResult>;
}

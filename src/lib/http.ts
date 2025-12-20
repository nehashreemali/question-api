/**
 * HTTP utility functions - Functional implementation
 */

import axios, { AxiosRequestConfig } from 'axios';
import { warn } from './logger.js';

export interface FetchOptions {
  retries?: number;
  retryDelay?: number;
  timeout?: number;
}

/**
 * Fetch URL with retry logic
 */
export async function fetchWithRetry(
  url: string,
  options: FetchOptions = {}
): Promise<string> {
  const {
    retries = 3,
    retryDelay = 2000,
    timeout = 10000,
  } = options;

  const axiosConfig: AxiosRequestConfig = {
    timeout,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; QuizGenerator/1.0)',
    },
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(url, axiosConfig);
      return response.data;
    } catch (error: any) {
      if (attempt === retries) {
        throw new Error(`Failed to fetch ${url} after ${retries} attempts: ${error.message}`);
      }

      warn(`Fetch attempt ${attempt} failed for ${url}, retrying in ${retryDelay}ms...`);
      await sleep(retryDelay);
    }
  }

  throw new Error('Unreachable code');
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Rate limiter using closure
 */
export function createRateLimiter(requestsPerSecond: number) {
  let lastRequestTime = 0;
  const minInterval = 1000 / requestsPerSecond;

  return async function wait(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;

    if (timeSinceLastRequest < minInterval) {
      await sleep(minInterval - timeSinceLastRequest);
    }

    lastRequestTime = Date.now();
  };
}

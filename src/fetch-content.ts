#!/usr/bin/env bun

/**
 * Fetch Content - Test the adapters
 *
 * Usage:
 *   bun src/fetch-content.ts <category> <topic> [subcategory]
 *
 * Examples:
 *   bun src/fetch-content.ts science mechanics physics
 *   bun src/fetch-content.ts sports cricket-world-cups cricket
 *   bun src/fetch-content.ts general-knowledge mahabharata indian-epics
 *   bun src/fetch-content.ts movies marvel-mcu franchises
 */

import { fetchContent, listAdapters } from './lib/adapters/index';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

async function main() {
  const [category, topic, subcategory] = process.argv.slice(2);

  if (!category || !topic) {
    console.log('Usage: bun src/fetch-content.ts <category> <topic> [subcategory]');
    console.log('\nAvailable adapters:');
    listAdapters().forEach(a => {
      console.log(`  ${a.name}: ${a.categories.join(', ')}`);
    });
    console.log('\nExamples:');
    console.log('  bun src/fetch-content.ts science mechanics physics');
    console.log('  bun src/fetch-content.ts sports cricket-world-cups cricket');
    console.log('  bun src/fetch-content.ts general-knowledge mahabharata indian-epics');
    console.log('  bun src/fetch-content.ts movies marvel-mcu franchises');
    process.exit(1);
  }

  console.log(`\nFetching content for: ${category}/${topic}${subcategory ? `/${subcategory}` : ''}\n`);

  try {
    const result = await fetchContent({
      category,
      topic,
      subcategory,
    });

    console.log('='.repeat(60));
    console.log(`Title: ${result.title}`);
    console.log(`Source: ${result.source}`);
    console.log(`URL: ${result.sourceUrl}`);
    console.log(`Fetched: ${result.fetchedAt}`);
    if (result.asOfDate) {
      console.log(`As of: ${result.asOfDate}`);
    }
    console.log('='.repeat(60));
    console.log(`\nContent preview (first 1000 chars):\n`);
    console.log(result.content.substring(0, 1000) + '...\n');

    if (result.citations && result.citations.length > 0) {
      console.log('Citations:');
      result.citations.forEach((c, i) => {
        console.log(`  ${i + 1}. ${c.text} - ${c.url}`);
      });
    }

    console.log(`\nTotal content length: ${result.content.length} chars`);

    // Save to file
    const outputDir = join(process.cwd(), 'data', category, topic);
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = join(outputDir, 'content.json');
    writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`\nSaved to: ${outputPath}`);

  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();

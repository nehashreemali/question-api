import axios from 'axios';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const dataDir = join(import.meta.dir, 'data');
if (!existsSync(dataDir)) mkdirSync(dataDir);

async function scrapeWikipedia(title: string) {
  console.log(`📥 Scraping: ${title}`);

  const response = await axios.get('https://en.wikipedia.org/w/api.php', {
    params: {
      action: 'query',
      prop: 'extracts',
      exintro: false,
      explaintext: true,
      titles: title,
      format: 'json',
      redirects: 1,
    },
    headers: { 'User-Agent': 'QuizGen/1.0' },
  });

  const pages = response.data.query.pages;
  const pageId = Object.keys(pages)[0];

  if (pageId === '-1') throw new Error(`Article not found: ${title}`);

  const content = pages[pageId].extract;
  if (!content) throw new Error(`No content for: ${title}`);

  const fileName = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const data = {
    title,
    content,
    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
    scrapedAt: new Date().toISOString(),
    wordCount: content.split(/\s+/).length,
  };

  writeFileSync(join(dataDir, `${fileName}.json`), JSON.stringify(data, null, 2));
  console.log(`✅ Saved: ${fileName}.json (${data.wordCount} words)`);
}

const title = process.argv[2] || 'Stranger Things';
scrapeWikipedia(title);

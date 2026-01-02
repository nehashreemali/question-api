#!/usr/bin/env bun

import Database from "bun:sqlite";

// Get all TV show topics from registry
const db = new Database("data/registry.db", { readonly: true });
const topics = db.query(`
  SELECT subcategory, slug, name
  FROM topics
  WHERE category = 'tv-shows'
  ORDER BY subcategory, name
`).all() as { subcategory: string; slug: string; name: string }[];

db.close();

console.log(`Found ${topics.length} TV show topics\n`);

import { existsSync } from "fs";

async function fetchShow(subcategory: string, slug: string, name: string) {
  const outfile = `images/tv-shows-${subcategory}-${slug}.jpg`;

  if (existsSync(outfile)) {
    console.log(`SKIP: ${slug}`);
    return true;
  }

  // Clean up name for search (remove parentheses, special chars)
  const search = name
    .replace(/\([^)]*\)/g, "")  // Remove parenthetical
    .replace(/[':!?]/g, "")     // Remove special chars
    .trim();

  try {
    const res = await fetch(`https://api.tvmaze.com/singlesearch/shows?q=${encodeURIComponent(search)}`);

    if (!res.ok) {
      console.log(`FAIL: ${slug} (HTTP ${res.status})`);
      return false;
    }

    const data = await res.json();
    const imageUrl = data?.image?.original;

    if (imageUrl) {
      const imgRes = await fetch(imageUrl);
      const buffer = await imgRes.arrayBuffer();
      await Bun.write(outfile, buffer);
      console.log(`OK: ${slug}`);
      return true;
    } else {
      console.log(`FAIL: ${slug} (no image)`);
      return false;
    }
  } catch (e) {
    console.log(`FAIL: ${slug}`);
    return false;
  }
}

let success = 0;
let skipped = 0;
let failed = 0;

for (const topic of topics) {
  const result = await fetchShow(topic.subcategory, topic.slug, topic.name);
  if (result === true) {
    if (existsSync(`images/tv-shows-${topic.subcategory}-${topic.slug}.jpg`)) {
      success++;
    } else {
      skipped++;
    }
  } else {
    failed++;
  }
  await new Promise(r => setTimeout(r, 150));
}

console.log(`\nFetched: ${success}, Skipped: ${skipped}, Failed: ${failed}`);
console.log("\nResizing large images...");

// Resize any over 100KB
import { spawnSync } from "child_process";
import { statSync, readdirSync } from "fs";

const files = readdirSync("images").filter(f => f.startsWith("tv-shows-") && f.endsWith(".jpg"));
let resized = 0;
for (const f of files) {
  const path = `images/${f}`;
  const size = statSync(path).size;
  if (size > 100000) {
    spawnSync("sips", ["-Z", "600", path]);
    resized++;
  }
}

console.log(`Resized ${resized} images`);
console.log("\nAll done!");

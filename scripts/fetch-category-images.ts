#!/usr/bin/env bun

import Database from "bun:sqlite";
import { existsSync } from "fs";
import { spawnSync } from "child_process";
import { statSync, readdirSync } from "fs";

// Custom search terms for better image results
const CATEGORY_SEARCH: Record<string, string> = {
  "american-sports": "american football stadium",
  "animals": "wildlife animals",
  "anime-manga": "anime artwork",
  "art": "art gallery paintings",
  "automobiles": "luxury cars",
  "biology": "dna microscope biology",
  "business": "business office",
  "chemistry": "chemistry lab",
  "combat-sports": "boxing ring",
  "comics": "comic books",
  "cricket": "cricket match",
  "economics": "stock market finance",
  "environment": "nature forest",
  "epics": "ancient temple india",
  "famous-people": "famous portraits",
  "food": "gourmet food",
  "football": "soccer football",
  "geography": "world map globe",
  "health": "medical healthcare",
  "history": "ancient history",
  "inventions": "inventions technology",
  "languages": "languages books",
  "literature": "library books",
  "mathematics": "mathematics equations",
  "military": "military history",
  "movies": "cinema film",
  "music": "music instruments",
  "mythology": "greek mythology",
  "olympics": "olympics sports",
  "other-sports": "sports athletics",
  "philosophy": "philosophy thinking",
  "physics": "physics space",
  "plants": "plants nature",
  "politics": "politics government",
  "programming": "coding programming",
  "psychology": "psychology brain",
  "regional-history": "world history",
  "religion": "religion spirituality",
  "space": "space galaxy stars",
  "technology": "technology future",
  "travel": "travel destinations",
  "tv-shows": "television retro",
  "video-games": "video games gaming",
  "world-cultures": "world cultures traditions",
};

// Get all categories and subcategories from registry
const db = new Database("data/registry.db", { readonly: true });

const categories = db.query(`SELECT slug, name FROM categories ORDER BY name`).all() as { slug: string; name: string }[];
const subcategories = db.query(`SELECT category, slug, name FROM subcategories ORDER BY category, name`).all() as { category: string; slug: string; name: string }[];

db.close();

console.log(`Found ${categories.length} categories and ${subcategories.length} subcategories\n`);

async function fetchImage(filename: string, searchTerm: string): Promise<boolean> {
  const outfile = `images/${filename}.jpg`;

  if (existsSync(outfile)) {
    return true; // Already exists
  }

  try {
    // Try Pexels (no API key for basic search page scraping)
    // Use a hash of the search term to get consistent but varied images
    const hash = searchTerm.split("").reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0);
    const seed = Math.abs(hash);

    // Use picsum.photos with seed for consistent images
    const url = `https://picsum.photos/seed/${encodeURIComponent(searchTerm.replace(/\s+/g, "-"))}/640/400`;
    const res = await fetch(url, { redirect: "follow" });

    if (!res.ok) {
      console.log(`FAIL: ${filename} (HTTP ${res.status})`);
      return false;
    }

    const buffer = await res.arrayBuffer();

    if (buffer.byteLength < 5000) {
      console.log(`FAIL: ${filename} (too small)`);
      return false;
    }

    await Bun.write(outfile, buffer);
    console.log(`OK: ${filename}`);
    return true;
  } catch (e) {
    console.log(`FAIL: ${filename}`);
    return false;
  }
}

// Fetch category images
console.log("=== Fetching Category Images ===\n");
let catSuccess = 0;
let catSkipped = 0;

for (const cat of categories) {
  if (existsSync(`images/${cat.slug}.jpg`)) {
    catSkipped++;
    continue;
  }

  const search = CATEGORY_SEARCH[cat.slug] || cat.name;
  const result = await fetchImage(cat.slug, search);
  if (result) catSuccess++;

  await new Promise(r => setTimeout(r, 300)); // Rate limit
}

console.log(`\nCategories: ${catSuccess} fetched, ${catSkipped} skipped\n`);

// Fetch subcategory images
console.log("=== Fetching Subcategory Images ===\n");
let subSuccess = 0;
let subSkipped = 0;

for (const sub of subcategories) {
  const filename = `${sub.category}-${sub.slug}`;

  if (existsSync(`images/${filename}.jpg`)) {
    subSkipped++;
    continue;
  }

  // Use subcategory name as search term
  const result = await fetchImage(filename, sub.name);
  if (result) subSuccess++;

  await new Promise(r => setTimeout(r, 300)); // Rate limit
}

console.log(`\nSubcategories: ${subSuccess} fetched, ${subSkipped} skipped\n`);

// Resize large images
console.log("=== Resizing Large Images ===\n");
const files = readdirSync("images").filter(f => f.endsWith(".jpg") && !f.startsWith("tv-shows-"));
let resized = 0;

for (const f of files) {
  const path = `images/${f}`;
  const size = statSync(path).size;
  if (size > 100000) {
    spawnSync("sips", ["-Z", "600", path]);
    resized++;
  }
}

console.log(`Resized ${resized} images\n`);
console.log("All done!");

/**
 * Migration Script: Flatten transcript folder structure
 *
 * Migrates from:
 *   data/tv-shows/{show}/season-{n}/episode-{n}/transcript.json
 * To:
 *   data/transcripts/{show}/s{nn}e{nn}.json
 *
 * Usage: bun scripts/flatten-transcripts.ts [--dry-run]
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { join, basename, dirname } from 'path';

const DATA_DIR = join(import.meta.dir, '..', 'data');
const OLD_TV_DIR = join(DATA_DIR, 'tv-shows');
const NEW_TRANSCRIPTS_DIR = join(DATA_DIR, 'transcripts');

const isDryRun = process.argv.includes('--dry-run');

interface TranscriptFile {
  oldPath: string;
  newPath: string;
  show: string;
  season: number;
  episode: number;
}

function padNumber(n: number): string {
  return n.toString().padStart(2, '0');
}

function findTranscripts(dir: string): TranscriptFile[] {
  const results: TranscriptFile[] = [];

  if (!existsSync(dir)) return results;

  const shows = readdirSync(dir, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name !== 'manifest.json');

  for (const showDir of shows) {
    const showPath = join(dir, showDir.name);
    const showSlug = showDir.name;

    // Find all season directories
    const seasonDirs = readdirSync(showPath, { withFileTypes: true })
      .filter(d => d.isDirectory() && d.name.startsWith('season-'));

    for (const seasonDir of seasonDirs) {
      const seasonMatch = seasonDir.name.match(/season-(\d+)/);
      if (!seasonMatch) continue;

      const season = parseInt(seasonMatch[1]);
      const seasonPath = join(showPath, seasonDir.name);

      // Find all episode directories
      const episodeDirs = readdirSync(seasonPath, { withFileTypes: true })
        .filter(d => d.isDirectory() && d.name.startsWith('episode-'));

      for (const episodeDir of episodeDirs) {
        const episodeMatch = episodeDir.name.match(/episode-(\d+)/);
        if (!episodeMatch) continue;

        const episode = parseInt(episodeMatch[1]);
        const transcriptPath = join(seasonPath, episodeDir.name, 'transcript.json');

        if (existsSync(transcriptPath)) {
          const newFileName = `s${padNumber(season)}e${padNumber(episode)}.json`;
          const newPath = join(NEW_TRANSCRIPTS_DIR, showSlug, newFileName);

          results.push({
            oldPath: transcriptPath,
            newPath,
            show: showSlug,
            season,
            episode,
          });
        }
      }
    }
  }

  return results;
}

function migrateTranscript(file: TranscriptFile): boolean {
  try {
    // Read the old transcript
    const content = readFileSync(file.oldPath, 'utf8');
    const data = JSON.parse(content);

    // Ensure the new directory exists
    const newDir = dirname(file.newPath);
    if (!isDryRun && !existsSync(newDir)) {
      mkdirSync(newDir, { recursive: true });
    }

    // Write to new location
    if (!isDryRun) {
      writeFileSync(file.newPath, JSON.stringify(data, null, 2));
    }

    return true;
  } catch (error) {
    console.error(`❌ Failed to migrate ${file.oldPath}: ${error}`);
    return false;
  }
}

async function main() {
  console.log('🔄 Flattening transcript folder structure...\n');

  if (isDryRun) {
    console.log('📋 DRY RUN - No files will be modified\n');
  }

  // Find all transcripts
  const transcripts = findTranscripts(OLD_TV_DIR);
  console.log(`Found ${transcripts.length} transcripts to migrate\n`);

  if (transcripts.length === 0) {
    console.log('Nothing to migrate.');
    return;
  }

  // Group by show for summary
  const byShow: Record<string, TranscriptFile[]> = {};
  for (const t of transcripts) {
    if (!byShow[t.show]) byShow[t.show] = [];
    byShow[t.show].push(t);
  }

  // Migrate each transcript
  let migrated = 0;
  let failed = 0;

  for (const [show, files] of Object.entries(byShow)) {
    const sortedFiles = files.sort((a, b) => {
      if (a.season !== b.season) return a.season - b.season;
      return a.episode - b.episode;
    });

    console.log(`📁 ${show}: ${files.length} episodes`);

    for (const file of sortedFiles) {
      const success = migrateTranscript(file);
      if (success) {
        migrated++;
        if (isDryRun) {
          console.log(`   Would migrate: s${padNumber(file.season)}e${padNumber(file.episode)}.json`);
        }
      } else {
        failed++;
      }
    }
  }

  console.log('\n' + '─'.repeat(50));
  console.log(`✅ Migration ${isDryRun ? 'would be ' : ''}complete!`);
  console.log(`   Migrated: ${migrated}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Shows: ${Object.keys(byShow).length}`);

  if (!isDryRun) {
    console.log(`\n📂 New structure: data/transcripts/{show}/s{nn}e{nn}.json`);
    console.log(`\n⚠️  You can now delete the old data/tv-shows folder if everything looks good.`);
    console.log(`   Run: rm -rf data/tv-shows`);
  } else {
    console.log(`\n📋 Run without --dry-run to perform the migration.`);
  }
}

main();

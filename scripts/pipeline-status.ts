#!/usr/bin/env bun
/**
 * Pipeline Status CLI Tool
 *
 * Quick terminal view of content pipeline status.
 * Shows downloaded content, generation progress, and review status.
 *
 * Usage:
 *   bun scripts/pipeline-status.ts
 *   bun scripts/pipeline-status.ts --category=tv-shows
 *   bun scripts/pipeline-status.ts --json
 */

import { Database } from 'bun:sqlite';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(import.meta.dir, '..', 'data');
const GENERATION_DIR = join(import.meta.dir, '..', 'generation');

// ============================================================================
// Argument Parsing
// ============================================================================

const args = process.argv.slice(2);
const jsonOutput = args.includes('--json');
const categoryFilter = args.find(a => a.startsWith('--category='))?.split('=')[1];

// ============================================================================
// Data Collection
// ============================================================================

interface CategoryStats {
  category: string;
  contentUnits: number;
  generated: number;
  pendingGen: number;
  questions: number;
  approved: number;
  rejected: number;
  pendingReview: number;
  avgScore: number;
}

interface TopicStats {
  topic: string;
  category: string;
  subcategory: string;
  units: number;
  questions: number;
  approved: number;
  rejected: number;
  pendingReview: number;
}

function getContentCounts(): Record<string, number> {
  const counts: Record<string, number> = {};

  // TV Shows (transcripts)
  const transcriptsDir = join(GENERATION_DIR, 'transcripts');
  if (existsSync(transcriptsDir)) {
    let total = 0;
    for (const show of readdirSync(transcriptsDir)) {
      if (show.startsWith('.')) continue; // Skip .DS_Store etc
      const showDir = join(transcriptsDir, show);
      try {
        const episodes = readdirSync(showDir).filter(f => f.endsWith('.json'));
        total += episodes.length;
      } catch (e) {
        // Not a directory
      }
    }
    counts['tv-shows'] = total;
  }

  // Movies
  const moviesDir = join(GENERATION_DIR, 'movies');
  if (existsSync(moviesDir)) {
    counts['movies'] = readdirSync(moviesDir).filter(f => f.endsWith('.json')).length;
  }

  // Epics
  const epicsDir = join(GENERATION_DIR, 'epics');
  if (existsSync(epicsDir)) {
    let total = 0;
    for (const epic of readdirSync(epicsDir)) {
      if (epic.startsWith('.')) continue;
      const epicDir = join(epicsDir, epic);
      try {
        if (epic === 'mahabharata') {
          // Count sections in parvas
          for (const parva of readdirSync(epicDir).filter(f => f.startsWith('parva-'))) {
            const parvaDir = join(epicDir, parva);
            total += readdirSync(parvaDir).filter(f => f.endsWith('.json')).length;
          }
        } else {
          total += readdirSync(epicDir).filter(f => f.endsWith('.json')).length;
        }
      } catch (e) {
        // Not a directory
      }
    }
    counts['epics'] = total;
  }

  // Wikipedia
  const wikiDir = join(GENERATION_DIR, 'wikipedia');
  if (existsSync(wikiDir)) {
    let total = 0;
    for (const cat of readdirSync(wikiDir)) {
      if (cat.startsWith('.')) continue;
      const catDir = join(wikiDir, cat);
      try {
        total += readdirSync(catDir).filter(f => f.endsWith('.json')).length;
      } catch (e) {
        // Not a directory
      }
    }
    counts['wikipedia'] = total;
  }

  // Books
  const booksDir = join(GENERATION_DIR, 'books');
  if (existsSync(booksDir)) {
    let total = 0;
    for (const book of readdirSync(booksDir)) {
      if (book.startsWith('.')) continue;
      const bookDir = join(booksDir, book);
      try {
        total += readdirSync(bookDir).filter(f => f.endsWith('.json')).length;
      } catch (e) {
        // Not a directory
      }
    }
    counts['books'] = total;
  }

  return counts;
}

function getQuestionStats(): Record<string, CategoryStats> {
  const stats: Record<string, CategoryStats> = {};

  const dbFiles = readdirSync(DATA_DIR).filter(f =>
    f.endsWith('.db') &&
    !f.startsWith('_') &&
    f !== 'registry.db' &&
    f !== 'pipeline.db' &&
    f !== 'questions.db'
  );

  for (const dbFile of dbFiles) {
    const category = dbFile.replace('.db', '');
    const dbPath = join(DATA_DIR, dbFile);

    if (!existsSync(dbPath)) continue;

    try {
      const db = new Database(dbPath, { readonly: true });

      const result = db.query(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN review_status = 'approved' THEN 1 ELSE 0 END) as approved,
          SUM(CASE WHEN review_status = 'rejected' THEN 1 ELSE 0 END) as rejected,
          SUM(CASE WHEN review_status = 'pending' THEN 1 ELSE 0 END) as pendingReview,
          AVG(CASE WHEN quality_score IS NOT NULL THEN quality_score END) as avgScore
        FROM questions
      `).get() as any;

      db.close();

      stats[category] = {
        category,
        contentUnits: 0,
        generated: 0,
        pendingGen: 0,
        questions: result.total || 0,
        approved: result.approved || 0,
        rejected: result.rejected || 0,
        pendingReview: result.pendingReview || 0,
        avgScore: result.avgScore || 0,
      };
    } catch (e) {
      // Skip
    }
  }

  return stats;
}

function getTopicStats(category?: string): TopicStats[] {
  const topics: TopicStats[] = [];

  const dbFiles = readdirSync(DATA_DIR).filter(f =>
    f.endsWith('.db') &&
    !f.startsWith('_') &&
    f !== 'registry.db' &&
    f !== 'pipeline.db' &&
    f !== 'questions.db'
  );

  for (const dbFile of dbFiles) {
    const cat = dbFile.replace('.db', '');
    if (category && cat !== category) continue;

    const dbPath = join(DATA_DIR, dbFile);
    if (!existsSync(dbPath)) continue;

    try {
      const db = new Database(dbPath, { readonly: true });

      const rows = db.query(`
        SELECT
          topic,
          subcategory,
          COUNT(*) as total,
          COUNT(DISTINCT part || '-' || chapter) as units,
          SUM(CASE WHEN review_status = 'approved' THEN 1 ELSE 0 END) as approved,
          SUM(CASE WHEN review_status = 'rejected' THEN 1 ELSE 0 END) as rejected,
          SUM(CASE WHEN review_status = 'pending' THEN 1 ELSE 0 END) as pendingReview
        FROM questions
        GROUP BY topic, subcategory
        ORDER BY total DESC
      `).all() as any[];

      db.close();

      for (const row of rows) {
        topics.push({
          topic: row.topic,
          category: cat,
          subcategory: row.subcategory,
          units: row.units,
          questions: row.total,
          approved: row.approved || 0,
          rejected: row.rejected || 0,
          pendingReview: row.pendingReview || 0,
        });
      }
    } catch (e) {
      // Skip
    }
  }

  return topics.sort((a, b) => b.questions - a.questions);
}

function getPipelineStats(): Record<string, { total: number; completed: number; pending: number }> {
  const pipelineDbPath = join(DATA_DIR, 'pipeline.db');
  if (!existsSync(pipelineDbPath)) return {};

  const db = new Database(pipelineDbPath, { readonly: true });

  const rows = db.query(`
    SELECT
      category,
      COUNT(*) as total,
      SUM(CASE WHEN generation_status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN generation_status = 'pending' THEN 1 ELSE 0 END) as pending
    FROM content_tracking
    GROUP BY category
  `).all() as any[];

  db.close();

  const result: Record<string, { total: number; completed: number; pending: number }> = {};
  for (const row of rows) {
    result[row.category] = {
      total: row.total,
      completed: row.completed,
      pending: row.pending,
    };
  }

  return result;
}

// ============================================================================
// Output
// ============================================================================

function printStatus() {
  const contentCounts = getContentCounts();
  const questionStats = getQuestionStats();
  const pipelineStats = getPipelineStats();
  const topicStats = getTopicStats(categoryFilter);

  // Calculate totals
  let totalContent = 0, totalQuestions = 0, totalApproved = 0, totalRejected = 0, totalPending = 0;
  let totalGenCompleted = 0, totalGenPending = 0;

  for (const count of Object.values(contentCounts)) {
    totalContent += count;
  }

  for (const stats of Object.values(questionStats)) {
    totalQuestions += stats.questions;
    totalApproved += stats.approved;
    totalRejected += stats.rejected;
    totalPending += stats.pendingReview;
  }

  for (const stats of Object.values(pipelineStats)) {
    totalGenCompleted += stats.completed;
    totalGenPending += stats.pending;
  }

  if (jsonOutput) {
    console.log(JSON.stringify({
      content: contentCounts,
      questions: questionStats,
      pipeline: pipelineStats,
      topics: topicStats,
      totals: {
        content: totalContent,
        questions: totalQuestions,
        approved: totalApproved,
        rejected: totalRejected,
        pendingReview: totalPending,
        genCompleted: totalGenCompleted,
        genPending: totalGenPending,
      },
    }, null, 2));
    return;
  }

  // Header
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                    PIPELINE STATUS                             ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');

  // Overview
  console.log('┌──────────────────────────────────────────────────────────────┐');
  console.log('│ OVERVIEW                                                     │');
  console.log('├──────────────────────────────────────────────────────────────┤');
  console.log(`│ 📥 Downloaded:     ${String(totalContent).padStart(6)} content units                    │`);
  console.log(`│ 📝 Generated:      ${String(totalGenCompleted).padStart(6)} units → ${String(totalQuestions).padStart(6)} questions         │`);
  console.log(`│ ⏳ Pending Gen:    ${String(totalGenPending).padStart(6)} units awaiting generation          │`);
  console.log('├──────────────────────────────────────────────────────────────┤');
  console.log(`│ ✅ Approved:       ${String(totalApproved).padStart(6)} questions                          │`);
  console.log(`│ ❌ Rejected:       ${String(totalRejected).padStart(6)} questions                          │`);
  console.log(`│ 🔍 Pending Review: ${String(totalPending).padStart(6)} questions                          │`);
  console.log('└──────────────────────────────────────────────────────────────┘');
  console.log('');

  // By Category
  console.log('┌──────────────────────────────────────────────────────────────┐');
  console.log('│ BY CATEGORY                                                  │');
  console.log('├─────────────────┬─────────┬─────────┬─────────┬──────────────┤');
  console.log('│ Category        │ Content │ Questns │ Approvd │ Pending Rev  │');
  console.log('├─────────────────┼─────────┼─────────┼─────────┼──────────────┤');

  const allCategories = new Set([
    ...Object.keys(contentCounts),
    ...Object.keys(questionStats),
    ...Object.keys(pipelineStats),
  ]);

  for (const cat of Array.from(allCategories).sort()) {
    const content = contentCounts[cat] || 0;
    const questions = questionStats[cat]?.questions || 0;
    const approved = questionStats[cat]?.approved || 0;
    const pending = questionStats[cat]?.pendingReview || 0;

    const catName = cat.slice(0, 15).padEnd(15);
    console.log(`│ ${catName} │ ${String(content).padStart(7)} │ ${String(questions).padStart(7)} │ ${String(approved).padStart(7)} │ ${String(pending).padStart(12)} │`);
  }

  console.log('└─────────────────┴─────────┴─────────┴─────────┴──────────────┘');
  console.log('');

  // By Topic (top 15)
  console.log('┌──────────────────────────────────────────────────────────────┐');
  console.log('│ TOP TOPICS                                                   │');
  console.log('├─────────────────────────┬─────────┬─────────┬────────────────┤');
  console.log('│ Topic                   │ Questns │ Approvd │ Status         │');
  console.log('├─────────────────────────┼─────────┼─────────┼────────────────┤');

  const displayTopics = topicStats.slice(0, 15);
  for (const topic of displayTopics) {
    const name = topic.topic.slice(0, 23).padEnd(23);
    let status = '🔍 Pending';
    if (topic.pendingReview === 0 && topic.approved > 0) {
      status = '✅ Reviewed';
    } else if (topic.approved > 0) {
      const pct = ((topic.approved / topic.questions) * 100).toFixed(0);
      status = `📊 ${pct}% done`;
    }

    console.log(`│ ${name} │ ${String(topic.questions).padStart(7)} │ ${String(topic.approved).padStart(7)} │ ${status.padEnd(14)} │`);
  }

  console.log('└─────────────────────────┴─────────┴─────────┴────────────────┘');
  console.log('');

  // Progress bar
  const reviewPct = totalQuestions > 0 ? (totalApproved / totalQuestions) * 100 : 0;
  const genPct = totalContent > 0 ? (totalGenCompleted / totalContent) * 100 : 0;

  console.log('┌──────────────────────────────────────────────────────────────┐');
  console.log('│ PROGRESS                                                     │');
  console.log('├──────────────────────────────────────────────────────────────┤');

  const genBar = '█'.repeat(Math.floor(genPct / 2.5)) + '░'.repeat(40 - Math.floor(genPct / 2.5));
  console.log(`│ Generation: [${genBar}] ${genPct.toFixed(1).padStart(5)}% │`);

  const revBar = '█'.repeat(Math.floor(reviewPct / 2.5)) + '░'.repeat(40 - Math.floor(reviewPct / 2.5));
  console.log(`│ Review:     [${revBar}] ${reviewPct.toFixed(1).padStart(5)}% │`);

  console.log('└──────────────────────────────────────────────────────────────┘');
  console.log('');
}

// Run
printStatus();
